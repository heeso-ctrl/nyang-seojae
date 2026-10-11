import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { db } from './db';
import { ensureFoliate, readerCss, type FoliateRelocate, type FoliateTocItem, type FoliateViewElement } from './epub';
import { finishReaderClock, readerAutoPause, readerInput, readerVisibility, READER_IDLE_MS, type ReaderClock } from './readerSession';
import { readerTapRatio } from './readerTap';
import type { ActiveTimer, Book, EditNote, EpubFile, Quote, ReaderKeys, ReaderStyle } from './types';

const DEFAULT_KEYS: ReaderKeys = {
  next: ['PageDown', 'ArrowRight', 'ArrowDown', ' ', 'Space'],
  previous: ['PageUp', 'ArrowLeft', 'ArrowUp'],
  swapped: false
};
const DEFAULT_STYLE: ReaderStyle = { fontSize: 100, lineHeight: 1.7, margin: 48, fontFamily: 'book' };
const FONT_SIZES = [85, 100, 115, 130, 145];
const LINE_HEIGHTS = [1.4, 1.7, 2];
const MARGINS = [24, 48, 72];

interface SelectionInfo {
  text: string;
  cfi: string;
  top: number;
}

export function ReaderView({ book, epubFile, timer, initialCfi, onExit, onChanged }: {
  book: Book;
  epubFile: EpubFile;
  timer: ActiveTimer;
  initialCfi?: string;
  onExit: () => void;
  onChanged: () => Promise<void>;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<FoliateViewElement | undefined>(undefined);
  const clockRef = useRef<ReaderClock>({ timer, lastInputAt: Date.now() });
  const idleRef = useRef<number | undefined>(undefined);
  const pendingLocationRef = useRef<FoliateRelocate | undefined>(undefined);
  const persistTimerRef = useRef<number | undefined>(undefined);
  const lastPersistRef = useRef(0);
  const keysRef = useRef(DEFAULT_KEYS);
  const styleRef = useRef(DEFAULT_STYLE);
  const annotationsRef = useRef<Array<{ value: string; kind: 'quote' | 'edit' }>>([]);
  const progressRef = useRef(epubFile.progress ?? book.progress ?? 0);
  const [toolsVisible, setToolsVisible] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [toc, setToc] = useState<FoliateTocItem[]>([]);
  const [progress, setProgress] = useState(epubFile.progress ?? book.progress ?? 0);
  const [chapter, setChapter] = useState('');
  const [selection, setSelection] = useState<SelectionInfo>();
  const [selectionMode, setSelectionMode] = useState<'quote' | 'edit'>();
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  const saveClock = useCallback(async () => {
    await db.activeTimers.put(clockRef.current.timer);
  }, []);

  const scheduleIdle = useCallback(() => {
    if (idleRef.current) window.clearTimeout(idleRef.current);
    const delay = Math.max(0, clockRef.current.lastInputAt + READER_IDLE_MS - Date.now());
    idleRef.current = window.setTimeout(() => {
      clockRef.current = readerAutoPause(clockRef.current, Date.now());
      void saveClock();
    }, delay);
  }, [saveClock]);

  const markInput = useCallback(() => {
    const lastPause = clockRef.current.timer.pauses.at(-1);
    const wasPaused = Boolean(lastPause && lastPause.until === undefined);
    clockRef.current = readerInput(clockRef.current, Date.now());
    if (wasPaused) void saveClock();
    scheduleIdle();
  }, [saveClock, scheduleIdle]);

  const persistLocation = useCallback(async (force = false) => {
    const location = pendingLocationRef.current;
    if (!location?.cfi) return;
    const elapsed = Date.now() - lastPersistRef.current;
    if (!force && elapsed < 2_000) {
      if (!persistTimerRef.current) persistTimerRef.current = window.setTimeout(() => {
        persistTimerRef.current = undefined;
        void persistLocation(true);
      }, 2_000 - elapsed);
      return;
    }
    lastPersistRef.current = Date.now();
    const nextProgress = Math.max(0, Math.min(1, location.fraction ?? progressRef.current));
    await db.transaction('rw', db.epubFiles, db.books, async () => {
      await db.epubFiles.update(epubFile.id, { lastCfi: location.cfi, progress: nextProgress });
      await db.books.update(book.id, { progress: nextProgress, updatedAt: Date.now() });
    });
  }, [book.id, epubFile.id]);

  const turn = useCallback((direction: 'next' | 'previous') => {
    markInput();
    const effective = keysRef.current.swapped
      ? direction === 'next' ? 'previous' : 'next'
      : direction;
    void (effective === 'next' ? viewRef.current?.next() : viewRef.current?.prev());
  }, [markInput]);

  useEffect(() => {
    let live = true;
    let view: FoliateViewElement | undefined;
    const listeners: Array<() => void> = [];
    const selectionTimers = new Set<number>();
    void (async () => {
      try {
        const [keysPref, stylePref, quotes, editNotes] = await Promise.all([
          db.preferences.get('readerKeys'), db.preferences.get('readerStyle'),
          db.quotes.where('bookId').equals(book.id).toArray(),
          db.editNotes.where('bookId').equals(book.id).toArray()
        ]);
        if (!live) return;
        if (keysPref?.value) keysRef.current = { ...DEFAULT_KEYS, ...(keysPref.value as Partial<ReaderKeys>) };
        if (stylePref?.value) {
          styleRef.current = { ...DEFAULT_STYLE, ...(stylePref.value as Partial<ReaderStyle>) };
          setStyle(styleRef.current);
        }
        annotationsRef.current = [
          ...quotes.filter((item) => item.cfi).map((item) => ({ value: item.cfi!, kind: 'quote' as const })),
          ...editNotes.map((item) => ({ value: item.cfi, kind: 'edit' as const }))
        ];
        await ensureFoliate();
        if (!live || !mountRef.current) return;
        view = document.createElement('foliate-view') as FoliateViewElement;
        viewRef.current = view;
        mountRef.current.replaceChildren(view);

        const handleKey = (event: KeyboardEvent) => {
          const key = event.code === 'Space' ? 'Space' : event.key;
          const next = keysRef.current.next.includes(event.key) || keysRef.current.next.includes(key) || keysRef.current.next.includes(event.code);
          const previous = keysRef.current.previous.includes(event.key) || keysRef.current.previous.includes(key) || keysRef.current.previous.includes(event.code);
          if (!next && !previous) return;
          event.preventDefault();
          turn(next ? 'next' : 'previous');
        };
        const handleSelection = (doc: Document, index: number) => {
          const selected = doc.getSelection();
          if (!selected?.rangeCount || selected.isCollapsed || !selected.toString().trim()) {
            setSelection(undefined);
            return false;
          }
          const range = selected.getRangeAt(0);
          const frame = doc.defaultView?.frameElement as HTMLElement | null;
          const frameRect = frame?.getBoundingClientRect();
          const rangeRect = range.getBoundingClientRect();
          setSelection({
            text: selected.toString().trim(),
            cfi: view!.getCFI(index, range),
            top: Math.max(68, Math.min(window.innerHeight - 190, (frameRect?.top ?? 0) + rangeRect.bottom + 8))
          });
          return true;
        };
        const onLoad = (event: Event) => {
          const detail = (event as CustomEvent<{ doc: Document; index: number }>).detail;
          const { doc, index } = detail;
          const keyListener = (e: KeyboardEvent) => handleKey(e);
          const scrollListener = () => markInput();
          const pointerListener = () => {
            const timer = window.setTimeout(() => {
              selectionTimers.delete(timer);
              if (live) handleSelection(doc, index);
            }, 0);
            selectionTimers.add(timer);
          };
          const clickListener = (e: MouseEvent) => {
            if (doc.getSelection()?.type === 'Range' || (e.target as Element | null)?.closest?.('a')) return;
            markInput();
            const frame = doc.defaultView?.frameElement as HTMLElement | null;
            const frameRect = frame?.getBoundingClientRect();
            const viewerRect = view?.getBoundingClientRect() ?? mountRef.current?.getBoundingClientRect();
            const ratio = readerTapRatio(e.clientX, doc.documentElement.clientWidth, frameRect, viewerRect);
            if (ratio < 1 / 3) turn('previous');
            else if (ratio > 2 / 3) turn('next');
            else setToolsVisible((value) => !value);
          };
          doc.addEventListener('keydown', keyListener);
          doc.addEventListener('scroll', scrollListener, { passive: true });
          doc.addEventListener('pointerup', pointerListener);
          doc.addEventListener('click', clickListener);
          listeners.push(() => {
            doc.removeEventListener('keydown', keyListener);
            doc.removeEventListener('scroll', scrollListener);
            doc.removeEventListener('pointerup', pointerListener);
            doc.removeEventListener('click', clickListener);
          });
          view!.renderer.setStyles?.(readerCss(styleRef.current.fontSize, styleRef.current.lineHeight, styleRef.current.fontFamily));
        };
        const onRelocate = (event: Event) => {
          const detail = (event as CustomEvent<FoliateRelocate>).detail;
          pendingLocationRef.current = detail;
          if (typeof detail.fraction === 'number') {
            progressRef.current = Math.max(0, Math.min(1, detail.fraction));
            setProgress(progressRef.current);
          }
          setChapter(detail.tocItem?.label ?? '');
          void persistLocation();
        };
        const onCreateOverlay = () => {
          for (const annotation of annotationsRef.current) void view!.addAnnotation(annotation);
        };
        const { Overlayer } = await import('../vendor/foliate-js/overlayer.js');
        const onDrawAnnotation = (event: Event) => {
          const detail = (event as CustomEvent<{ draw: (fn: unknown, options: unknown) => void; annotation: { kind?: string } }>).detail;
          detail.draw(Overlayer.underline, { color: detail.annotation.kind === 'edit' ? '#8b3b2f' : '#3a332e', width: 2 });
        };
        view.addEventListener('load', onLoad);
        view.addEventListener('relocate', onRelocate);
        view.addEventListener('create-overlay', onCreateOverlay);
        view.addEventListener('draw-annotation', onDrawAnnotation);
        window.addEventListener('keydown', handleKey);
        listeners.push(() => {
          view?.removeEventListener('load', onLoad);
          view?.removeEventListener('relocate', onRelocate);
          view?.removeEventListener('create-overlay', onCreateOverlay);
          view?.removeEventListener('draw-annotation', onDrawAnnotation);
          window.removeEventListener('keydown', handleKey);
        });
        await view.open(new File([epubFile.blob], epubFile.name, { type: epubFile.blob.type || 'application/epub+zip' }));
        if (!live) return;
        view.renderer.setAttribute('flow', 'paginated');
        view.renderer.setAttribute('margin', `${styleRef.current.margin}px`);
        view.renderer.removeAttribute('animated');
        setToc(view.book.toc ?? []);
        await view.init({ lastLocation: initialCfi ?? epubFile.lastCfi, showTextStart: true });
        if (live) scheduleIdle();
      } catch (reason) {
        if (live) setError(reason instanceof Error ? reason.message : 'epub을 열지 못했습니다.');
      }
    })();
    return () => {
      live = false;
      viewRef.current = undefined;
      listeners.forEach((remove) => remove());
      selectionTimers.forEach((timer) => window.clearTimeout(timer));
      selectionTimers.clear();
      if (idleRef.current) window.clearTimeout(idleRef.current);
      idleRef.current = undefined;
      if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = undefined;
      view?.close();
      view?.remove();
    };
  }, [book.id, epubFile.blob, epubFile.lastCfi, epubFile.name, initialCfi, markInput, persistLocation, scheduleIdle, turn]);

  useEffect(() => {
    const onVisibility = () => {
      clockRef.current = readerVisibility(clockRef.current, document.hidden, Date.now());
      void saveClock();
      if (!document.hidden) scheduleIdle();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [saveClock, scheduleIdle]);

  async function changeStyle(next: ReaderStyle) {
    styleRef.current = next;
    setStyle(next);
    viewRef.current?.renderer.setAttribute('margin', `${next.margin}px`);
    viewRef.current?.renderer.setStyles?.(readerCss(next.fontSize, next.lineHeight, next.fontFamily));
    await db.preferences.put({ key: 'readerStyle', value: next });
  }

  async function saveSelection() {
    if (!selection || !selectionMode) return;
    const id = crypto.randomUUID();
    if (selectionMode === 'quote') {
      const quote: Quote = { id, bookId: book.id, text: selection.text, cfi: selection.cfi, memo: memo.trim() || undefined, origin: 'highlight', createdAt: Date.now() };
      await db.quotes.put(quote);
      annotationsRef.current.push({ value: selection.cfi, kind: 'quote' });
      await viewRef.current?.addAnnotation({ value: selection.cfi, kind: 'quote' });
    } else {
      const note: EditNote = { id, bookId: book.id, cfi: selection.cfi, selectedText: selection.text, memo: memo.trim(), status: 'todo', createdAt: Date.now() };
      await db.editNotes.put(note);
      annotationsRef.current.push({ value: selection.cfi, kind: 'edit' });
      await viewRef.current?.addAnnotation({ value: selection.cfi, kind: 'edit' });
    }
    viewRef.current?.deselect();
    setSelection(undefined);
    setSelectionMode(undefined);
    setMemo('');
    await onChanged();
  }

  async function finish() {
    await persistLocation(true);
    const endedAt = Date.now();
    const result = finishReaderClock(clockRef.current, endedAt);
    const finalProgress = pendingLocationRef.current?.fraction ?? progressRef.current;
    await db.transaction('rw', db.sessions, db.books, db.activeTimers, async () => {
      if (result.keep) {
        await db.sessions.put({
          id: crypto.randomUUID(), bookId: book.id, startedAt: timer.startedAt, endedAt,
          activeSec: result.activeSec, pauses: result.pauses, mode: 'reader-auto',
          progressFrom: epubFile.progress ?? book.progress, progressTo: finalProgress
        });
      }
      const done = finalProgress >= 1 && book.status !== 'done'
        ? window.confirm('다 읽었어요로 표시할까요?') : false;
      await db.books.update(book.id, {
        progress: finalProgress, updatedAt: endedAt,
        status: done ? 'done' : book.status,
        finishedAt: done ? endedAt : book.finishedAt
      });
      await db.activeTimers.delete('current');
    });
    await onChanged();
    onExit();
  }

  function moveTo(href: string) {
    markInput();
    void viewRef.current?.goTo(href);
    setTocOpen(false);
  }

  return <div className="reader-screen">
    {toolsVisible && <header className="reader-toolbar reader-topbar">
      <button onClick={() => void finish()} aria-label="뷰어 나가기">← 나가기</button>
      <strong>{book.title}</strong>
      <button onClick={() => { setTocOpen((value) => !value); setStyleOpen(false); }}>목차</button>
      <button onClick={() => { setStyleOpen((value) => !value); setTocOpen(false); }}>글자 설정</button>
    </header>}
    <div ref={mountRef} className="reader-mount" aria-label={`${book.title} epub 본문`} />
    {error && <div className="reader-error" role="alert">{error}<button onClick={() => void finish()}>나가기</button></div>}
    {toolsVisible && <footer className="reader-toolbar reader-bottombar">
      <label><span>{Math.round(progress * 100)}%</span><input aria-label="읽기 진행률" type="range" min="0" max="1" step="0.001" value={progress} onChange={(event) => { const value = Number(event.target.value); progressRef.current = value; setProgress(value); markInput(); void viewRef.current?.goToFraction(value); }} /></label>
      <span>{chapter || '현재 장'}</span>
    </footer>}
    {tocOpen && <aside className="reader-panel reader-toc" aria-label="목차"><h2>목차</h2><TocList items={toc} onMove={moveTo} /><button onClick={() => setTocOpen(false)}>닫기</button></aside>}
    {styleOpen && <aside className="reader-panel reader-style" aria-label="글자 설정"><h2>글자 설정</h2>
      <label>글자 크기<select value={style.fontSize} onChange={(event) => void changeStyle({ ...style, fontSize: Number(event.target.value) })}>{FONT_SIZES.map((value, index) => <option key={value} value={value}>{index + 1}단계</option>)}</select></label>
      <label>줄간격<select value={style.lineHeight} onChange={(event) => void changeStyle({ ...style, lineHeight: Number(event.target.value) })}>{LINE_HEIGHTS.map((value, index) => <option key={value} value={value}>{index + 1}단계</option>)}</select></label>
      <label>여백<select value={style.margin} onChange={(event) => void changeStyle({ ...style, margin: Number(event.target.value) })}>{MARGINS.map((value, index) => <option key={value} value={value}>{index + 1}단계</option>)}</select></label>
      <label>글꼴<select value={style.fontFamily} onChange={(event) => void changeStyle({ ...style, fontFamily: event.target.value as ReaderStyle['fontFamily'] })}><option value="book">책 기본</option><option value="serif">명조 계열</option><option value="sans">고딕 계열</option></select></label>
      <button onClick={() => setStyleOpen(false)}>닫기</button>
    </aside>}
    {selection && !selectionMode && <div className="selection-actions" style={{ top: selection.top } as CSSProperties}>
      <button onClick={() => setSelectionMode('quote')}>필사함에 담기</button>
      <button onClick={() => setSelectionMode('edit')}>퇴고 메모</button>
    </div>}
    {selection && selectionMode && <div className="reader-dialog" role="dialog" aria-modal="true" aria-label={selectionMode === 'quote' ? '필사함에 담기' : '퇴고 메모'}>
      <p>{selection.text}</p><label>메모<textarea value={memo} onChange={(event) => setMemo(event.target.value)} rows={3} /></label>
      <div><button onClick={() => setSelectionMode(undefined)}>취소</button><button className="primary" onClick={() => void saveSelection()}>저장</button></div>
    </div>}
  </div>;
}

function TocList({ items, onMove }: { items: FoliateTocItem[]; onMove: (href: string) => void }) {
  return <ol>{items.map((item, index) => <li key={`${item.href}-${index}`}>{item.href ? <button onClick={() => onMove(item.href!)}>{item.label || '제목 없음'}</button> : <span>{item.label}</span>}{item.subitems?.length ? <TocList items={item.subitems} onMove={onMove} /> : null}</li>)}</ol>;
}
