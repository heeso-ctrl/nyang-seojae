import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { db } from './db';
import { ensureFoliate, readerCss, type FoliateRelocate, type FoliateTocItem, type FoliateViewElement } from './epub';
import { leaveReader, openPause, readerAutoPause, readerInput, readerVisibility, READER_IDLE_MS, type ReaderClock } from './readerSession';
import { readerTapRatio } from './readerTap';
import { defaultReaderStyle, migrateReaderStyle } from './readerStyle';
import type { ActiveTimer, Book, DisplayMode, EditNote, EpubFile, Quote, ReaderKeys, ReaderStyle } from './types';

const DEFAULT_KEYS: ReaderKeys = {
  next: ['PageDown', 'ArrowRight', 'ArrowDown', ' ', 'Space'],
  previous: ['PageUp', 'ArrowLeft', 'ArrowUp'],
  swapped: false
};

interface SelectionInfo {
  text: string;
  cfi: string;
  top: number;
}

export function ReaderView({ book, epubFile, timer, displayMode, initialCfi, onExit, onBackground, onChanged }: {
  book: Book;
  epubFile: EpubFile;
  timer: ActiveTimer;
  displayMode: DisplayMode;
  initialCfi?: string;
  onExit: () => void;
  onBackground: () => void;
  onChanged: () => Promise<void>;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<FoliateViewElement | undefined>(undefined);
  const clockRef = useRef<ReaderClock>({ timer, lastInputAt: Date.now() });
  const idleRef = useRef<number | undefined>(undefined);
  const pendingLocationRef = useRef<FoliateRelocate | undefined>(undefined);
  const persistTimerRef = useRef<number | undefined>(undefined);
  const styleTimerRef = useRef<number | undefined>(undefined);
  const lastPersistRef = useRef(0);
  const keysRef = useRef(DEFAULT_KEYS);
  const styleRef = useRef(defaultReaderStyle(displayMode));
  const annotationsRef = useRef<Array<{ value: string; kind: 'quote' | 'edit' }>>([]);
  const progressRef = useRef(epubFile.progress ?? book.progress ?? 0);
  const [toolsVisible, setToolsVisible] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [style, setStyle] = useState(() => defaultReaderStyle(displayMode));
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

  const handleTap = useCallback((ratio: number) => {
    if (ratio < 1 / 3) turn('previous');
    else if (ratio > 2 / 3) turn('next');
    else {
      markInput();
      setToolsVisible((value) => !value);
    }
  }, [markInput, turn]);

  const handleViewerClick = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const hasSelection = window.getSelection()?.type === 'Range'
      || viewRef.current?.renderer.getContents?.().some(({ doc }) => doc.getSelection()?.type === 'Range');
    if (hasSelection) return;
    const target = event.target as Element | null;
    if (target?.closest?.('a, button, input, select, textarea, [role="dialog"], .reader-toolbar, .reader-panel')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    handleTap((event.clientX - bounds.left) / Math.max(1, bounds.width));
  }, [handleTap]);

  // 안드로이드 앱: BOOX 페이지 버튼(음량 키)을 앱이 'nyang-page' 이벤트로 넘겨준다. 화면 오류는 백지 대신 메시지로 보인다.
  useEffect(() => {
    const bridge = (window as unknown as { NyangAndroid?: { setReaderActive?: (active: boolean) => void } }).NyangAndroid;
    bridge?.setReaderActive?.(true);
    const onPage = (event: Event) => {
      // DEVICE-CHECK: BOOX 옆면 버튼(위=이전, 아래=다음)으로 넘어가는지
      turn((event as CustomEvent<string>).detail === 'previous' ? 'previous' : 'next');
    };
    const onError = (event: ErrorEvent) => {
      // 브라우저가 흔히 내는 무해한 경고는 화면에 띄우지 않는다.
      if (/ResizeObserver loop/i.test(event.message)) return;
      console.error('[nyang-error]', event.message, event.filename, event.lineno);
      setError(`화면 오류: ${event.message}`);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
      console.error('[nyang-error]', message);
      setError(`화면 오류: ${message}`);
    };
    window.addEventListener('nyang-page', onPage);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      bridge?.setReaderActive?.(false);
      window.removeEventListener('nyang-page', onPage);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [turn]);

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
        const migratedStyle = migrateReaderStyle(stylePref?.value, displayMode);
        styleRef.current = migratedStyle;
        setStyle(migratedStyle);
        if (stylePref?.value) void db.preferences.put({ key: 'readerStyle', value: migratedStyle });
        annotationsRef.current = [
          ...quotes.filter((item) => item.cfi).map((item) => ({ value: item.cfi!, kind: 'quote' as const })),
          ...editNotes.map((item) => ({ value: item.cfi, kind: 'edit' as const }))
        ];
        console.info('[nyang-reader] start', epubFile.name, epubFile.blob.size, epubFile.blob.type, window.innerWidth, window.innerHeight);
        await ensureFoliate();
        console.info('[nyang-reader] foliate ready');
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
            const frame = doc.defaultView?.frameElement as HTMLElement | null;
            const frameRect = frame?.getBoundingClientRect();
            const viewerRect = view?.getBoundingClientRect() ?? mountRef.current?.getBoundingClientRect();
            const ratio = readerTapRatio(e.clientX, doc.documentElement.clientWidth, frameRect, viewerRect);
            handleTap(ratio);
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
          view!.renderer.setStyles?.(readerCss(styleRef.current, displayMode));
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
        console.info('[nyang-reader] opened', (view.book as unknown as { sections?: unknown[] })?.sections?.length, JSON.stringify(view.getBoundingClientRect()));
        if (!live) return;
        view.renderer.setAttribute('flow', 'paginated');
        view.renderer.setAttribute('margin', `${styleRef.current.margin}px`);
        view.renderer.removeAttribute('animated');
        setToc(view.book.toc ?? []);
        await view.init({ lastLocation: initialCfi ?? epubFile.lastCfi, showTextStart: true });
        console.info('[nyang-reader] init done', JSON.stringify(view.getBoundingClientRect()), JSON.stringify(mountRef.current?.getBoundingClientRect()));
        if (live) scheduleIdle();
      } catch (reason) {
        console.error('[nyang-reader] failed', reason instanceof Error ? `${reason.name}: ${reason.message}\n${reason.stack}` : String(reason));
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
      if (styleTimerRef.current) window.clearTimeout(styleTimerRef.current);
      styleTimerRef.current = undefined;
      view?.close();
      view?.remove();
    };
  }, [book.id, displayMode, epubFile.blob, epubFile.lastCfi, epubFile.name, handleTap, initialCfi, markInput, persistLocation, scheduleIdle, turn]);

  useEffect(() => {
    const pauseForBackground = async () => {
      clockRef.current = readerVisibility(clockRef.current, true);
      await saveClock();
    };
    const onVisibility = () => {
      if (document.hidden) { void pauseForBackground(); return; }
      if (openPause(clockRef.current.timer)?.reason === 'background') {
        void (async () => { await onChanged(); onBackground(); })();
      }
    };
    const onPageHide = () => { void pauseForBackground(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [onBackground, onChanged, saveClock]);

  function applyStyle(next: ReaderStyle) {
    styleRef.current = next;
    viewRef.current?.renderer.setAttribute('margin', `${next.margin}px`);
    viewRef.current?.renderer.setStyles?.(readerCss(next, displayMode));
  }

  function changeStyle(next: ReaderStyle) {
    setStyle(next);
    void db.preferences.put({ key: 'readerStyle', value: next });
    if (styleTimerRef.current) window.clearTimeout(styleTimerRef.current);
    styleTimerRef.current = window.setTimeout(() => {
      styleTimerRef.current = undefined;
      applyStyle(next);
    }, 400);
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

  async function leave() {
    await persistLocation(true);
    clockRef.current = leaveReader(clockRef.current);
    await saveClock();
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
      <button onClick={() => void leave()} aria-label="뷰어 나가기">← 나가기</button>
      <strong>{book.title}</strong>
      <button onClick={() => { setTocOpen((value) => !value); setStyleOpen(false); }}>목차</button>
      <button onClick={() => { setStyleOpen((value) => !value); setTocOpen(false); }}>글자 설정</button>
    </header>}
    <div ref={mountRef} className="reader-mount" aria-label={`${book.title} epub 본문`} onClick={handleViewerClick} />
    {error && <div className="reader-error" role="alert">{error}<button onClick={() => void leave()}>나가기</button></div>}
    {toolsVisible && <footer className="reader-toolbar reader-bottombar">
      <label><span>{Math.round(progress * 100)}%</span><input aria-label="읽기 진행률" type="range" min="0" max="1" step="0.001" value={progress} onChange={(event) => { const value = Number(event.target.value); progressRef.current = value; setProgress(value); markInput(); void viewRef.current?.goToFraction(value); }} /></label>
      <span>{chapter || '현재 장'}</span>
    </footer>}
    {tocOpen && <aside className="reader-panel reader-toc" aria-label="목차"><h2>목차</h2><TocList items={toc} onMove={moveTo} /><button onClick={() => setTocOpen(false)}>닫기</button></aside>}
    {styleOpen && <aside className="reader-panel reader-style" aria-label="글자 설정"><div className="reader-style-head"><h2>글자 설정</h2><button onClick={() => setStyleOpen(false)}>닫기</button></div>
      <StyleRange label="글자 크기" value={style.fontSize} min={12} max={40} step={1} unit="px" onChange={(value) => changeStyle({ ...style, fontSize: value })} />
      <StyleRange label="줄간격" value={style.lineHeight} min={1} max={3} step={0.05} digits={2} onChange={(value) => changeStyle({ ...style, lineHeight: value })} />
      <StyleRange label="문단 간격" value={style.paragraphSpacing} min={0} max={3} step={0.1} digits={1} unit="em" onChange={(value) => changeStyle({ ...style, paragraphSpacing: value })} />
      <StyleRange label="들여쓰기" value={style.indent} min={0} max={3} step={0.1} digits={1} unit="em" emptyLabel="책 기본" onChange={(value) => changeStyle({ ...style, indent: value })} onClear={() => changeStyle({ ...style, indent: undefined })} />
      <StyleRange label="좌우 여백" value={style.margin} min={0} max={80} step={2} unit="px" onChange={(value) => changeStyle({ ...style, margin: value })} />
      <fieldset className="style-choice"><legend>글자 굵기</legend><div>{([{ value: 400, label: '보통' }, { value: 500, label: '조금 굵게' }, { value: 600, label: '굵게' }, { value: 700, label: '아주 굵게' }] as const).map((item) => <button key={item.value} className={style.fontWeight === item.value ? 'active' : ''} onClick={() => changeStyle({ ...style, fontWeight: item.value })}>{item.label}</button>)}</div></fieldset>
      <label>글꼴<select value={style.fontFamily} onChange={(event) => changeStyle({ ...style, fontFamily: event.target.value as ReaderStyle['fontFamily'] })}><option value="book">책 기본</option><option value="serif">명조</option><option value="sans">고딕</option></select></label>
      <button onClick={() => changeStyle(defaultReaderStyle(displayMode))}>기본값으로</button>
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

function StyleRange({ label, value, min, max, step, unit = '', digits = 0, emptyLabel, onChange, onClear }: {
  label: string; value?: number; min: number; max: number; step: number; unit?: string; digits?: number; emptyLabel?: string;
  onChange: (value: number) => void; onClear?: () => void;
}) {
  const shown = value === undefined ? emptyLabel ?? '' : `${value.toFixed(digits)}${unit}`;
  const numeric = value ?? min;
  const adjust = (direction: -1 | 1) => onChange(Number(Math.max(min, Math.min(max, Math.round((numeric + direction * step) / step) * step)).toFixed(digits)));
  return <div className="style-range"><div className="style-range-title"><strong>{label}</strong><output>{shown}</output></div><div className="style-range-controls"><button onClick={() => adjust(-1)} aria-label={`${label} 줄이기`}>−</button><input aria-label={label} type="range" min={min} max={max} step={step} value={numeric} onChange={(event) => onChange(Number(event.target.value))} /><button onClick={() => adjust(1)} aria-label={`${label} 늘리기`}>＋</button></div>{onClear && <button className="style-book-default" onClick={onClear}>책 기본</button>}</div>;
}

function TocList({ items, onMove }: { items: FoliateTocItem[]; onMove: (href: string) => void }) {
  return <ol>{items.map((item, index) => <li key={`${item.href}-${index}`}>{item.href ? <button onClick={() => onMove(item.href!)}>{item.label || '제목 없음'}</button> : <span>{item.label}</span>}{item.subitems?.length ? <TocList items={item.subitems} onMove={onMove} /> : null}</li>)}</ol>;
}
