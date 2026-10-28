import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { db, exportBackup, importBackup } from './db';
import { activeSeconds, isPaused, localDayBounds } from './timer';
import { parseOptionalNumber, resolveProgress } from './progress';
import { computeArtLayout } from './artLayout';
import { dentBox, dentMarkup, type CushionDent } from './dent';
import { kakaoErrorMessage, searchKakaoBooks, type KakaoBookResult } from './kakao';
import { readEpubMetadata } from './epub';
import { ReaderView } from './ReaderView';
import { finishReaderClock, homeTimerPose, openPause, pauseReaderForBackground, resumeTimer, shouldAskAfterHidden } from './readerSession';
import type { ActiveTimer, Book, BookSource, BookStatus, DisplayMode, EditNote, EpubFile, Quote, ReaderKeys, Session } from './types';
import { sourceLabels, statusLabels } from './types';
import alignData from '../public/art/cat/align.json';
import themeData from '../public/art/themes.json';

type MainTab = 'home' | 'library' | 'calendar' | 'quotes' | 'settings';
type Modal = 'add-book' | 'finish' | 'quote' | 'manual-session' | 'edit-book' | null;
type SortKey = 'recent' | 'created' | 'title' | 'progress';
type Pose = keyof typeof alignData.sprites;
type ReaderTarget = { book: Book; epubFile: EpubFile; timer: ActiveTimer; cfi?: string };

const tabItems: Array<{ id: MainTab; label: string; symbol: string }> = [
  { id: 'home', label: '홈', symbol: '⌂' },
  { id: 'library', label: '서재', symbol: '▦' },
  { id: 'calendar', label: '기록', symbol: '□' },
  { id: 'quotes', label: '필사함', symbol: '“' },
  { id: 'settings', label: '설정', symbol: '⚙' }
];

const homeNotes = [
  '오늘 펼친 한 쪽이 내일의 서재를 만들어요.',
  '서두르지 않아도 괜찮아요. 한 문장씩 읽어요.',
  '고양이는 조용히 다음 장을 기다리고 있어요.'
];

function uid(): string {
  return crypto.randomUUID();
}

function progressOf(book: Book): number {
  if (book.progress !== undefined) return Math.max(0, Math.min(1, book.progress));
  if (book.totalPages && book.currentPage !== undefined) return Math.max(0, Math.min(1, book.currentPage / book.totalPages));
  return book.status === 'done' ? 1 : 0;
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [editNotes, setEditNotes] = useState<EditNote[]>([]);
  const [timer, setTimer] = useState<ActiveTimer>();
  const [tab, setTab] = useState<MainTab>('home');
  const [selectedBookId, setSelectedBookId] = useState<string>();
  const [libraryStatus, setLibraryStatus] = useState<BookStatus>('reading');
  const [modal, setModal] = useState<Modal>(null);
  const [themeId, setThemeId] = useState(themeData.default);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => (window as unknown as { NyangAndroid?: unknown }).NyangAndroid ? 'eink' : 'phone');
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState('');
  const [reader, setReader] = useState<ReaderTarget>();
  const [pendingReader, setPendingReader] = useState<{ book: Book; cfi?: string }>();
  const [backgroundPromptDismissed, setBackgroundPromptDismissed] = useState(false);
  const [manualAwayAt, setManualAwayAt] = useState<number>();
  const [finishEndedAt, setFinishEndedAt] = useState<number>();

  const refresh = useCallback(async () => {
    const [nextBooks, nextSessions, nextQuotes, nextEditNotes, nextTimer, themePref, displayPref, hiddenPref] = await Promise.all([
      db.books.toArray(), db.sessions.toArray(), db.quotes.toArray(),
      db.editNotes.toArray(), db.activeTimers.get('current'), db.preferences.get('theme'),
      db.preferences.get('displayMode'), db.preferences.get('hiddenAt')
    ]);
    setBooks(nextBooks);
    setSessions(nextSessions);
    setQuotes(nextQuotes);
    setEditNotes(nextEditNotes);
    setTimer(nextTimer);
    if (typeof themePref?.value === 'string') setThemeId(themePref.value);
    if (displayPref?.value === 'eink' || displayPref?.value === 'phone') setDisplayMode(displayPref.value);
    if (!document.hidden && nextTimer && nextTimer.mode !== 'reader-auto' && typeof hiddenPref?.value === 'number') {
      if (shouldAskAfterHidden(nextTimer, hiddenPref.value, Date.now())) setManualAwayAt(hiddenPref.value);
      else void db.preferences.delete('hiddenAt');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    // DEVICE-CHECK: 이북리더기 모드에서 앱 글자와 책 글자가 BOOX 기본 리더만큼 진한지
    document.documentElement.classList.toggle('display-eink', displayMode === 'eink');
    document.documentElement.classList.toggle('display-phone', displayMode === 'phone');
  }, [displayMode]);
  useEffect(() => {
    const url = new URL(window.location.href);
    const action = url.searchParams.get('action');
    if (action !== 'start' && action !== 'finish') return;
    url.searchParams.delete('action');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    void (async () => {
      const active = await db.activeTimers.get('current');
      if (action === 'finish') {
        await refresh();
        setTab('home');
        if (active) setModal('finish');
        return;
      }
      if (!active) {
        const reading = (await db.books.where('status').equals('reading').toArray()).sort((a, b) => b.updatedAt - a.updatedAt);
        if (reading[0]) {
          const startedAt = Date.now();
          await db.books.update(reading[0].id, { updatedAt: startedAt, startedAt: reading[0].startedAt ?? startedAt });
          if (reading[0].source === 'own-epub') {
            await beginReader(reading[0]);
            return;
          }
          await db.activeTimers.put({ id: 'current', bookId: reading[0].id, startedAt, pauses: [], mode: 'timer', progressFrom: progressOf(reading[0]) });
        } else {
          setLibraryStatus('reading');
          setTab('library');
        }
      } else {
        const activeBook = await db.books.get(active.bookId);
        if (activeBook?.source === 'own-epub') {
          await beginReader(activeBook);
          return;
        }
      }
      await refresh();
    })();
  }, [refresh]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(''), 4_000);
    return () => window.clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    const onHidden = async () => {
      const active = await db.activeTimers.get('current');
      if (!active) return;
      if (active.mode === 'reader-auto') {
        if (!reader) await db.activeTimers.put(pauseReaderForBackground(active, Date.now()));
      } else if (openPause(active)?.reason !== 'user') {
        const existing = await db.preferences.get('hiddenAt');
        if (typeof existing?.value !== 'number') await db.preferences.put({ key: 'hiddenAt', value: Date.now() });
      }
    };
    const onVisible = async () => {
      if (reader) return;
      const [active, hiddenPref] = await Promise.all([db.activeTimers.get('current'), db.preferences.get('hiddenAt')]);
      if (!active) { await db.preferences.delete('hiddenAt'); return; }
      if (active.mode === 'reader-auto') {
        setBackgroundPromptDismissed(false);
        setTab('home');
        await refresh();
        return;
      }
      if (typeof hiddenPref?.value === 'number' && shouldAskAfterHidden(active, hiddenPref.value, Date.now())) setManualAwayAt(hiddenPref.value);
      else await db.preferences.delete('hiddenAt');
    };
    const onVisibility = () => { void (document.hidden ? onHidden() : onVisible()); };
    const onPageHide = () => { void onHidden(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [reader, refresh]);

  const currentBook = books.find((book) => book.id === timer?.bookId);
  const selectedBook = books.find((book) => book.id === selectedBookId);
  const timerPaused = timer ? isPaused(timer) : false;
  const elapsedSec = timer ? activeSeconds(timer, now) : 0;

  async function startReading(book: Book) {
    if (timer && timer.bookId !== book.id) {
      setNotice('먼저 진행 중인 독서를 종료해 주세요.');
      setTab('home');
      return;
    }
    const startedAt = Date.now();
    await db.transaction('rw', db.books, db.activeTimers, async () => {
      await db.books.update(book.id, { status: 'reading', startedAt: book.startedAt ?? startedAt, updatedAt: startedAt });
      await db.activeTimers.put({ id: 'current', bookId: book.id, startedAt, pauses: [], mode: 'timer', progressFrom: progressOf(book) });
    });
    await db.preferences.delete('hiddenAt');
    await refresh();
    setTab('home');
    setSelectedBookId(undefined);
  }

  async function togglePause() {
    if (!timer) return;
    const pauses = [...timer.pauses];
    const last = pauses.at(-1);
    if (last && last.until === undefined) last.until = Date.now();
    else pauses.push({ at: Date.now(), reason: 'user' });
    await db.activeTimers.put({ ...timer, pauses });
    await refresh();
  }

  async function discardTimer() {
    await db.activeTimers.delete('current');
    await db.preferences.delete('hiddenAt');
    setModal(null);
    await refresh();
  }

  async function beginReader(book: Book, cfi?: string) {
    if (!book.fileId) { setNotice('epub 파일 다시 넣기가 필요합니다.'); return; }
    const epubFile = await db.epubFiles.get(book.fileId);
    if (!epubFile) { setNotice('epub 파일 다시 넣기가 필요합니다.'); return; }
    let active = await db.activeTimers.get('current');
    if (!active) {
      active = { id: 'current', bookId: book.id, startedAt: Date.now(), pauses: [], mode: 'reader-auto', progressFrom: progressOf(book) };
    } else {
      active = { ...resumeTimer(active, Date.now()), mode: 'reader-auto', progressFrom: active.progressFrom ?? progressOf(book) };
    }
    await db.activeTimers.put(active);
    setBackgroundPromptDismissed(false);
    setReader({ book, epubFile, timer: active, cfi });
    setPendingReader(undefined);
    await refresh();
  }

  async function openReader(book: Book, cfi?: string) {
    const active = await db.activeTimers.get('current');
    if (active && active.bookId !== book.id) {
      setPendingReader({ book, cfi });
      return;
    }
    await beginReader(book, cfi);
  }

  async function saveOtherTimerAndOpen() {
    if (!pendingReader) return;
    const active = await db.activeTimers.get('current');
    if (active) {
      const endedAt = Date.now();
      const result = finishReaderClock({ timer: active, lastInputAt: endedAt }, endedAt);
      await db.transaction('rw', db.sessions, db.activeTimers, async () => {
        if (result.keep) await db.sessions.put({ id: uid(), bookId: active.bookId, startedAt: active.startedAt, endedAt, activeSec: result.activeSec, pauses: result.pauses, mode: active.mode === 'reader-auto' ? 'reader-auto' : 'timer', progressFrom: active.progressFrom });
        await db.activeTimers.delete('current');
      });
      if (!result.keep) setNotice('1분이 안 돼서 기록하지 않았어요');
    }
    await beginReader(pendingReader.book, pendingReader.cfi);
  }

  function openBook(book: Book) {
    setSelectedBookId(book.id);
    setTab('library');
  }

  function openFinish(endedAt?: number) {
    setFinishEndedAt(endedAt);
    setModal('finish');
  }

  const readerRecovery = Boolean(timer?.mode === 'reader-auto' && openPause(timer)?.reason === 'background' && !backgroundPromptDismissed);

  const view = selectedBook && tab === 'library'
    ? <BookDetail book={selectedBook} sessions={sessions} quotes={quotes} editNotes={editNotes} onBack={() => setSelectedBookId(undefined)} onRefresh={refresh} onStart={() => void startReading(selectedBook)} onRead={(cfi) => void openReader(selectedBook, cfi)} onModal={setModal} setNotice={setNotice} />
    : tab === 'home'
      ? <Home books={books} sessions={sessions} timer={timer} currentBook={currentBook} elapsedSec={elapsedSec} paused={timerPaused} themeId={themeId} displayMode={displayMode} readerRecovery={readerRecovery} onStart={startReading} onRead={(book) => void openReader(book)} onPause={togglePause} onFinish={() => openFinish()} onQuote={() => setModal('quote')} onDismissRecovery={() => setBackgroundPromptDismissed(true)} onAddBook={() => { setLibraryStatus('reading'); setTab('library'); setModal('add-book'); }} onShowDone={() => { setLibraryStatus('done'); setTab('library'); }} />
      : tab === 'library'
        ? <Library books={books} status={libraryStatus} setStatus={setLibraryStatus} onOpenBook={openBook} onAdd={() => setModal('add-book')} />
        : tab === 'calendar'
          ? <Calendar books={books} sessions={sessions} onOpenBook={openBook} />
          : tab === 'quotes'
            ? <QuotesView books={books} quotes={quotes} onOpenBook={openBook} onOpenReader={(book, cfi) => void openReader(book, cfi)} />
            : <Settings themeId={themeId} displayMode={displayMode} setDisplayMode={async (mode) => { await db.preferences.put({ key: 'displayMode', value: mode }); setDisplayMode(mode); }} setThemeId={async (id) => { await db.preferences.put({ key: 'theme', value: id }); setThemeId(id); }} onImported={refresh} setNotice={setNotice} />;

  if (reader) return <ReaderView book={reader.book} epubFile={reader.epubFile} timer={reader.timer} displayMode={displayMode} initialCfi={reader.cfi} onChanged={refresh} onBackground={() => { setReader(undefined); setTab('home'); setBackgroundPromptDismissed(false); }} onExit={() => { setReader(undefined); setTab('home'); }} />;

  return (
    <div className={`app-shell ${tab === 'home' ? 'home-active' : ''}`}>
      <header className="topbar">
        <button className="brand" onClick={() => { setTab('home'); setSelectedBookId(undefined); }} aria-label="홈으로">냥서재</button>
        <span className="topbar-copy">고양이와 한 쪽씩</span>
      </header>
      <main>{view}</main>
      <nav className="bottom-nav" aria-label="주 메뉴">
        {tabItems.map((item) => (
          <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setSelectedBookId(undefined); }}>
            <span aria-hidden="true">{item.symbol}</span><small>{item.label}</small>
          </button>
        ))}
      </nav>
      {notice && <div className="toast" role="status">{notice}</div>}
      {modal === 'add-book' && <BookForm onClose={() => setModal(null)} onSaved={refresh} onOpenSettings={() => { setModal(null); setTab('settings'); }} onOpenBook={(book) => { setSelectedBookId(book.id); setTab('library'); }} setNotice={setNotice} />}
      {modal === 'finish' && timer && currentBook && <FinishForm timer={timer} book={currentBook} endedAt={finishEndedAt} onClose={() => { setModal(null); setFinishEndedAt(undefined); }} onSaved={async () => { setFinishEndedAt(undefined); await refresh(); }} onDiscard={discardTimer} setNotice={setNotice} />}
      {modal === 'quote' && currentBook && <QuoteForm book={currentBook} onClose={() => setModal(null)} onSaved={refresh} />}
      {modal === 'manual-session' && selectedBook && <ManualSessionForm book={selectedBook} onClose={() => setModal(null)} onSaved={refresh} />}
      {modal === 'edit-book' && selectedBook && <BookForm book={selectedBook} onClose={() => setModal(null)} onSaved={refresh} onOpenSettings={() => { setModal(null); setTab('settings'); }} onOpenBook={(next) => { setSelectedBookId(next.id); setTab('library'); }} setNotice={setNotice} />}
      {pendingReader && <Dialog title="다른 책을 읽는 중이에요" onClose={() => setPendingReader(undefined)}><p><strong>{books.find((item) => item.id === timer?.bookId)?.title ?? '다른 책'}</strong>의 기록을 저장하고 이 책을 열까요?</p><div className="form-actions"><button onClick={() => setPendingReader(undefined)}>취소</button><button className="primary" onClick={() => void saveOtherTimerAndOpen()}>그 책 기록 저장하고 이 책 읽기</button></div></Dialog>}
      {manualAwayAt && timer && timer.mode !== 'reader-auto' && openPause(timer)?.reason !== 'user' && <Dialog title="아직 읽는 중이에요?" onClose={() => setManualAwayAt(undefined)}><p>앱을 떠난 뒤 2시간이 넘었어요. 독서를 계속하고 있나요?</p><div className="form-actions"><button onClick={() => { void db.preferences.delete('hiddenAt'); setManualAwayAt(undefined); }}>계속 읽기</button><button className="primary" onClick={() => { void db.preferences.delete('hiddenAt'); const endedAt = manualAwayAt; setManualAwayAt(undefined); openFinish(endedAt); }}>앱을 떠난 시각에 종료</button></div></Dialog>}
    </div>
  );
}

function Home(props: {
  books: Book[]; sessions: Session[]; timer?: ActiveTimer; currentBook?: Book; elapsedSec: number; paused: boolean; themeId: string; displayMode: DisplayMode; readerRecovery: boolean;
  onStart: (book: Book) => Promise<void>; onRead: (book: Book) => void; onPause: () => Promise<void>; onFinish: () => void; onQuote: () => void; onDismissRecovery: () => void; onAddBook: () => void; onShowDone: () => void;
}) {
  const readingBooks = props.books.filter((book) => book.status === 'reading').sort((a, b) => b.updatedAt - a.updatedAt);
  const doneCount = props.books.filter((book) => book.status === 'done').length;
  const theme = themeData.themes.find((item) => item.id === props.themeId) ?? themeData.themes[0];
  const actualPose: Pose = props.timer ? homeTimerPose(props.timer) : (new Date().getHours() >= 23 ? 'sleeping' : 'idle');
  const [previewPose, setPreviewPose] = useState<Pose>();
  const pose = previewPose ?? actualPose;
  const sprite = alignData.sprites[pose];
  const dent = (sprite as typeof sprite & { dent?: CushionDent }).dent;
  const dentPosition = dent ? dentBox(dent) : undefined;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(() => computeArtLayout(1, 1));
  const [dayStart, dayEnd] = localDayBounds();
  const todaySec = props.sessions.filter((s) => s.startedAt >= dayStart && s.startedAt < dayEnd).reduce((sum, s) => sum + s.activeSec, 0) + props.elapsedSec;
  const note = homeNotes[new Date().getDate() % homeNotes.length];
  const einkFile = (theme as typeof theme & { einkFile?: string }).einkFile;
  const backgroundFile = props.displayMode === 'eink' && einkFile ? einkFile : theme.file;

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () => setLayout(computeArtLayout(element.clientWidth, element.clientHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setPreviewPose(undefined); }, [actualPose]);
  useEffect(() => {
    if (!previewPose) return;
    const timeout = window.setTimeout(() => setPreviewPose(undefined), 60_000);
    return () => window.clearTimeout(timeout);
  }, [previewPose]);

  function previewNextPose() {
    const poses: Pose[] = ['reading', 'resting', 'idle', 'sleeping'];
    setPreviewPose(poses[(poses.indexOf(pose) + 1) % poses.length]);
  }

  return <div className="page home-page">
    <section className="scene-card" aria-label={`${theme.name}에서 쉬는 고양이`}>
      <div className="scene-viewport" ref={viewportRef}>
        <div className="art-box" style={{ width: layout.width, height: layout.height, left: layout.left, top: layout.top }}>
          <img className="scene-bg" src={`${import.meta.env.BASE_URL}art/${backgroundFile}`} alt="" />
          {/* DEVICE-CHECK: BOOX 컬러 e잉크에서 눌림 자국이 너무 진하거나 얼룩처럼 보이지 않는지 */}
          {/* DEVICE-CHECK: mix-blend-mode: multiply가 BOOX Chrome에서 적용되는지(안 되면 연한 회색 면으로 보임) */}
          {dent && dentPosition && <svg
            className="cushion-dent"
            aria-hidden="true"
            viewBox="0 0 260 100"
            preserveAspectRatio="none"
            style={{ left: `${dentPosition.left}%`, top: `${dentPosition.top}%`, width: `${dentPosition.width}%`, height: `${dentPosition.height}%` }}
            dangerouslySetInnerHTML={{ __html: dentMarkup(dent) }}
          />}
          <button className="cat-hit" onClick={previewNextPose} aria-label="고양이 자세 미리보기" style={{ left: `${sprite.x}%`, top: `${sprite.y}%`, height: `${sprite.h}%`, transform: `translate(-50%, -100%)${sprite.flip ? ' scaleX(-1)' : ''}` }}>
            <img className="cat-sprite" src={`${import.meta.env.BASE_URL}art/cat/${sprite.file}`} alt={pose === 'reading' ? '책 읽는 고양이' : pose === 'resting' ? '쉬는 고양이' : pose === 'sleeping' ? '자는 고양이' : '기다리는 고양이'} />
          </button>
        </div>
        <p className="paper-note">{note}</p>
        <button className="shelf-count" onClick={props.onShowDone}>책장 {doneCount}권</button>
        <div className={`timer-overlap ${props.timer ? 'running' : 'waiting'}`}>
          {props.timer && props.currentBook && props.readerRecovery ? <div className="reader-recovery" role="status">
            <strong>‘{props.currentBook.title}’ {Math.round(progressOf(props.currentBook) * 100)}%까지 읽다 멈췄어요 (이번에 {Math.floor(props.elapsedSec / 60)}분). 이어서 읽을까요?</strong>
            <div className="button-row three"><button onClick={() => props.onRead(props.currentBook!)}>이어 읽기</button><button onClick={props.onFinish}>여기서 종료</button><button onClick={props.onDismissRecovery}>나중에</button></div>
          </div> : props.timer && props.currentBook ? <>
            <div className="timer-line">
              <Cover book={props.currentBook} small />
              <div className="timer-title"><strong>{props.currentBook.title}</strong><span>오늘 {Math.floor(todaySec / 60)}분 · 진행 {Math.round(progressOf(props.currentBook) * 100)}%</span></div>
              <div className="timer-minutes"><strong>{Math.floor(props.elapsedSec / 60)}</strong><small>분</small></div>
            </div>
            {props.timer.mode === 'reader-auto' ? <div className="button-row three"><button onClick={() => props.onRead(props.currentBook!)}>이어 읽기</button><button onClick={props.onFinish}>독서 종료</button><button onClick={props.onQuote}>문장 담기</button></div>
              : <div className="button-row three"><button onClick={() => void props.onPause()}>{props.paused ? '다시 읽기' : '일시 정지'}</button><button onClick={props.onFinish}>독서 종료</button><button onClick={props.onQuote}>문장 담기</button></div>}
          </> : <>
            <div className="empty-timer"><strong>무슨 책을 펼쳐 볼까요?</strong><span>읽고 있는 책에서 바로 시작할 수 있어요.</span></div>
            <div className="reading-shortlist">
              {readingBooks.length ? readingBooks.slice(0, 2).map((book) => <button key={book.id} onClick={() => book.source === 'own-epub' ? props.onRead(book) : void props.onStart(book)}><Cover book={book} small /><span>{book.title}</span><b>{book.source === 'own-epub' ? '읽기' : '읽기 시작'}</b></button>) : <button onClick={props.onAddBook}>서재에서 책을 추가해 주세요</button>}
            </div>
          </>}
        </div>
      </div>
    </section>
  </div>;
}

function Library({ books, status, setStatus, onOpenBook, onAdd }: { books: Book[]; status: BookStatus; setStatus: (status: BookStatus) => void; onOpenBook: (book: Book) => void; onAdd: () => void }) {
  const [includePaused, setIncludePaused] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');
  const [query, setQuery] = useState('');
  const visible = useMemo(() => books.filter((book) => book.status === status || (includePaused && book.status === 'paused')).filter((book) => `${book.title} ${book.author ?? ''}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
    if (sort === 'created') return b.createdAt - a.createdAt;
    if (sort === 'title') return a.title.localeCompare(b.title, 'ko');
    if (sort === 'progress') return progressOf(b) - progressOf(a);
    return b.updatedAt - a.updatedAt;
  }), [books, includePaused, query, sort, status]);

  return <div className="page library-page">
    <div className="page-heading"><div><small>내가 고른 이야기</small><h1>서재</h1></div><span className="count-badge">{visible.length}권</span></div>
    <div className="segmented" role="tablist">
      {(['want', 'reading', 'done'] as BookStatus[]).map((item) => <button key={item} className={status === item ? 'active' : ''} onClick={() => setStatus(item)}>{statusLabels[item]}</button>)}
    </div>
    <div className="library-tools">
      <label className="search"><span>검색</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="제목이나 저자" /></label>
      <select aria-label="정렬" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
        <option value="recent">최근 읽은 순</option><option value="created">추가 순</option><option value="title">제목 순</option><option value="progress">진행률 순</option>
      </select>
      <label className="check"><input type="checkbox" checked={includePaused} onChange={(e) => setIncludePaused(e.target.checked)} /> 멈춘 책</label>
    </div>
    {visible.length ? <div className="book-grid">{visible.map((book) => <button className="book-tile" key={book.id} onClick={() => onOpenBook(book)}><Cover book={book} /><strong>{book.title}</strong><small>{book.author || sourceLabels[book.source]}</small><Progress book={book} compact /></button>)}</div> : <div className="empty-state"><b>이 칸은 아직 비어 있어요.</b><span>오른쪽 아래 + 버튼으로 첫 책을 놓아 보세요.</span></div>}
    {status === 'want' && books.some((b) => b.status === 'want') && <button className="recommend" onClick={() => onOpenBook(books.filter((b) => b.status === 'want')[Math.floor(Math.random() * books.filter((b) => b.status === 'want').length)])}>고양이에게 한 권 골라 달라고 하기</button>}
    <button className="fab" onClick={onAdd} aria-label="책 추가">＋</button>
  </div>;
}

function BookDetail({ book, sessions, quotes, editNotes, onBack, onRefresh, onStart, onRead, onModal, setNotice }: { book: Book; sessions: Session[]; quotes: Quote[]; editNotes: EditNote[]; onBack: () => void; onRefresh: () => Promise<void>; onStart: () => void; onRead: (cfi?: string) => void; onModal: (modal: Modal) => void; setNotice: (message: string) => void }) {
  const [subtab, setSubtab] = useState<'info' | 'records'>('info');
  const [editing, setEditing] = useState<{ kind: 'session'; item: Session } | { kind: 'quote'; item: Quote }>();
  const [hasEpub, setHasEpub] = useState(book.source !== 'own-epub');
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const bookSessions = sessions.filter((item) => item.bookId === book.id);
  const bookQuotes = quotes.filter((item) => item.bookId === book.id);
  const bookEditNotes = editNotes.filter((item) => item.bookId === book.id).sort((a, b) => b.createdAt - a.createdAt);
  const timeline = [...bookSessions.map((item) => ({ kind: 'session' as const, at: item.startedAt, item })), ...bookQuotes.map((item) => ({ kind: 'quote' as const, at: item.createdAt, item }))].sort((a, b) => b.at - a.at);

  async function cycleStatus() {
    const next: BookStatus = book.status === 'want' ? 'reading' : book.status === 'reading' ? 'done' : 'reading';
    const timestamp = Date.now();
    await db.books.update(book.id, { status: next, progress: next === 'done' ? 1 : book.progress, finishedAt: next === 'done' ? timestamp : undefined, updatedAt: timestamp });
    await onRefresh();
  }

  async function removeTimeline(kind: 'session' | 'quote', id: string) {
    if (kind === 'session') await db.sessions.delete(id); else await db.quotes.delete(id);
    await onRefresh();
  }

  useEffect(() => {
    if (book.source !== 'own-epub' || !book.fileId) { setHasEpub(book.source !== 'own-epub'); return; }
    void db.epubFiles.get(book.fileId).then((item) => setHasEpub(Boolean(item)));
  }, [book.fileId, book.source]);

  async function replaceEpub(file?: File) {
    if (!file) return;
    try {
      const metadata = await readEpubMetadata(file);
      const fileId = book.fileId ?? uid();
      let coverBlobId = book.coverBlobId;
      if (metadata.cover) {
        coverBlobId = uid();
        await db.blobs.put({ id: coverBlobId, blob: metadata.cover, kind: 'cover' });
      }
      await db.transaction('rw', db.epubFiles, db.books, async () => {
        await db.epubFiles.put({ id: fileId, name: file.name, blob: file, addedAt: Date.now(), progress: book.progress });
        await db.books.update(book.id, { fileId, coverBlobId, updatedAt: Date.now() });
      });
      setHasEpub(true);
      setNotice(book.fileId ? 'epub 파일을 새 판으로 바꿨습니다. 독서 기록은 유지됩니다.' : 'epub 파일을 다시 연결했습니다.');
      await onRefresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'epub 파일을 읽지 못했습니다.'); }
    if (replaceFileRef.current) replaceFileRef.current.value = '';
  }

  async function toggleEditNote(note: EditNote) {
    await db.editNotes.update(note.id, { status: note.status === 'todo' ? 'done' : 'todo' });
    await onRefresh();
  }

  return <div className="page detail-page">
    <button className="back" onClick={onBack}>← 서재</button>
    <section className="book-hero">
      <Cover book={book} />
      <div><span className="eyebrow">{sourceLabels[book.source]}{book.category ? ` · ${book.category}` : ''}</span><h1>{book.title}</h1><p>{book.author || '저자 미상'}</p><Progress book={book} /><span className="page-count">{book.currentPage ?? 0} / {book.totalPages ?? '?'}쪽</span></div>
    </section>
    <div className="detail-actions"><button className="primary" onClick={book.source === 'own-epub' ? () => onRead() : book.status === 'reading' ? onStart : cycleStatus}>{book.source === 'own-epub' ? '읽기' : book.status === 'want' ? '독서 시작' : book.status === 'reading' ? '이어 읽기' : '다시 읽기'}</button><button onClick={() => onModal('edit-book')}>정보 수정</button>{book.source === 'own-epub' && <button onClick={() => replaceFileRef.current?.click()}>{hasEpub ? 'epub 파일 바꾸기' : 'epub 파일 다시 넣기'}</button>}<input ref={replaceFileRef} className="visually-hidden" type="file" accept="application/epub+zip,.epub" onChange={(event) => void replaceEpub(event.target.files?.[0])} /></div>
    {book.source === 'own-epub' && !hasEpub && <p className="missing-epub" role="status">epub 파일 다시 넣기 필요</p>}
    <div className="segmented detail-tabs"><button className={subtab === 'info' ? 'active' : ''} onClick={() => setSubtab('info')}>상세 정보</button><button className={subtab === 'records' ? 'active' : ''} onClick={() => setSubtab('records')}>기록 {bookSessions.length + bookQuotes.length}</button></div>
    {subtab === 'info' ? <section className="info-card">
      <div><span>상태</span><strong>{statusLabels[book.status]}</strong></div><div><span>별점</span><strong>{book.rating ? '★'.repeat(book.rating) : '아직 없음'}</strong></div><div><span>인생책</span><strong>{book.isLifeBook ? '내 인생책' : '표시 안 함'}</strong></div><div><span>출판사</span><strong>{book.publisher || '정보 없음'}</strong></div><div className="wide"><span>ISBN</span><strong>{book.isbn || '정보 없음'}</strong></div><div className="wide"><span>한 줄 후기</span><p>{book.review || '아직 남긴 후기가 없어요.'}</p></div>
      <button onClick={() => void cycleStatus()}>상태를 {book.status === 'done' ? '읽는 중' : '다 읽음'}으로 바꾸기</button>
    </section> : <section className="records">
      <div className="button-row"><button onClick={() => onModal('manual-session')}>＋ 독서 기록</button><button onClick={() => onModal('quote')}>＋ 문장 추가</button></div>
      {timeline.length ? timeline.map((entry) => <article key={`${entry.kind}-${entry.item.id}`} className="timeline-item">
        <div className="timeline-dot" />
        <div>{entry.kind === 'session' ? <><strong>{Math.max(1, Math.round(entry.item.activeSec / 60))}분 · {entry.item.pageFrom ? `p.${entry.item.pageFrom}` : '시작'}–{entry.item.pageTo ? `p.${entry.item.pageTo}` : '끝'}</strong><p>{entry.item.note || (entry.item.mode === 'manual' ? '수동 독서 기록' : entry.item.mode === 'reader-auto' ? 'epub 자동 독서 기록' : '타이머 독서 기록')}</p></> : <>{entry.item.cfi ? <button className="quote-location" onClick={() => onRead(entry.item.cfi)}><strong>“{entry.item.text}”</strong></button> : <strong>“{entry.item.text}”</strong>}<p>{entry.item.page ? `p.${entry.item.page}` : entry.item.cfi ? 'epub 위치 연결됨' : '쪽수 없음'}{entry.item.memo ? ` · ${entry.item.memo}` : ''}</p></>}<small>{formatDateTime(entry.at)}</small></div>
        <div className="timeline-actions"><button className="text-button" onClick={() => setEditing(entry)}>수정</button><button className="text-button" onClick={() => void removeTimeline(entry.kind, entry.item.id)}>삭제</button></div>
      </article>) : <p className="empty-copy">독서 기록과 문장을 날짜순으로 모아 보여 드려요.</p>}
      {book.source === 'own-epub' && <section className="edit-notes"><h2>퇴고 메모</h2>{bookEditNotes.length ? bookEditNotes.map((note) => <article key={note.id}><button className="note-location" onClick={() => onRead(note.cfi)}><strong>{note.selectedText}</strong><span>{note.memo || '메모 없음'}</span></button><button onClick={() => void toggleEditNote(note)}>{note.status === 'todo' ? '완료로 표시' : '할 일로 되돌리기'}</button></article>) : <p>아직 퇴고 메모가 없어요.</p>}</section>}
    </section>}
    {editing && <TimelineEditDialog entry={editing} onClose={() => setEditing(undefined)} onSaved={async () => { await onRefresh(); setEditing(undefined); }} />}
  </div>;
}

function TimelineEditDialog({ entry, onClose, onSaved }: { entry: { kind: 'session'; item: Session } | { kind: 'quote'; item: Quote }; onClose: () => void; onSaved: () => Promise<void> }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (entry.kind === 'session') {
      const minutes = Math.max(1, Number(data.get('minutes')) || 1);
      await db.sessions.update(entry.item.id, {
        activeSec: minutes * 60,
        endedAt: entry.item.startedAt + minutes * 60_000,
        pageFrom: parseOptionalNumber(data.get('pageFrom')),
        pageTo: parseOptionalNumber(data.get('pageTo')),
        note: String(data.get('note')).trim() || undefined
      });
    } else {
      await db.quotes.update(entry.item.id, {
        text: String(data.get('text')).trim(),
        page: parseOptionalNumber(data.get('page')),
        memo: String(data.get('memo')).trim() || undefined
      });
    }
    await onSaved();
  }
  return <Dialog title={entry.kind === 'session' ? '독서 기록 수정' : '문장 수정'} onClose={onClose}><form onSubmit={submit} className="form-grid">
    {entry.kind === 'session' ? <>
      <label>읽은 시간(분)<input name="minutes" type="number" min="1" defaultValue={Math.max(1, Math.round(entry.item.activeSec / 60))} required /></label><span />
      <label>시작 쪽<input name="pageFrom" type="number" min="0" defaultValue={entry.item.pageFrom} /></label><label>마지막 쪽<input name="pageTo" type="number" min="0" defaultValue={entry.item.pageTo} /></label>
      <label className="wide">메모<textarea name="note" rows={3} defaultValue={entry.item.note} /></label>
    </> : <>
      <label className="wide">문장<textarea name="text" rows={5} defaultValue={entry.item.text} required /></label><label>쪽수<input name="page" type="number" min="0" defaultValue={entry.item.page} /></label><label>메모<input name="memo" defaultValue={entry.item.memo} /></label>
    </>}
    <div className="form-actions wide"><button type="button" onClick={onClose}>취소</button><button className="primary" type="submit">수정 저장</button></div>
  </form></Dialog>;
}

function Calendar({ books, sessions, onOpenBook }: { books: Book[]; sessions: Session[]; onOpenBook: (book: Book) => void }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const firstDay = cursor.getDay();
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + days) / 7) * 7 }, (_, index) => index - firstDay + 1);
  const monthSessions = sessions.filter((session) => { const d = new Date(session.startedAt); return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth(); });
  const previous = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const next = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  return <div className="page calendar-page">
    <div className="page-heading"><div><small>읽은 날의 발자국</small><h1>기록</h1></div></div>
    <section className="calendar-card">
      <div className="month-nav"><button onClick={previous} aria-label="이전 달">←</button><h2>{cursor.getFullYear()}년 {cursor.getMonth() + 1}월</h2><button onClick={next} aria-label="다음 달">→</button></div>
      <div className="weekdays">{['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{cells.map((day, index) => {
        const daySessions = day > 0 && day <= days ? monthSessions.filter((session) => new Date(session.startedAt).getDate() === day) : [];
        const dayBooks = [...new Set(daySessions.map((session) => session.bookId))].map((id) => books.find((book) => book.id === id)).filter(Boolean) as Book[];
        const doodle = day > 0 && dayBooks.length === 0 && [5, 16, 25].includes(day);
        return <div className={`calendar-day ${day < 1 || day > days ? 'outside' : ''}`} key={index}><span>{day > 0 && day <= days ? day : ''}</span>{doodle && <b className="doodle" aria-label="고양이 발자국">·ω·</b>}<div className="calendar-covers">{dayBooks.slice(0, 3).map((book) => <button key={book.id} onClick={() => onOpenBook(book)} aria-label={book.title}><Cover book={book} tiny /></button>)}</div></div>;
      })}</div>
    </section>
    <div className="month-summary"><strong>{monthSessions.length ? new Set(monthSessions.map((s) => s.bookId)).size : 0}권</strong><span>이달에 읽은 책</span><strong>{Math.round(monthSessions.reduce((sum, s) => sum + s.activeSec, 0) / 60)}분</strong><span>이달의 독서 시간</span></div>
  </div>;
}

function QuotesView({ books, quotes, onOpenBook, onOpenReader }: { books: Book[]; quotes: Quote[]; onOpenBook: (book: Book) => void; onOpenReader: (book: Book, cfi: string) => void }) {
  const sorted = [...quotes].sort((a, b) => b.createdAt - a.createdAt);
  return <div className="page quotes-page"><div className="page-heading"><div><small>직접 담은 문장</small><h1>필사함</h1></div><span className="count-badge">{quotes.length}개</span></div>
    <p className="stage-note">직접 입력하거나 epub 본문에서 선택한 문장을 모아 봅니다.</p>
    {sorted.length ? <div className="quote-list">{sorted.map((quote) => { const book = books.find((b) => b.id === quote.bookId); return <button key={quote.id} onClick={() => { if (!book) return; if (quote.cfi && book.source === 'own-epub') onOpenReader(book, quote.cfi); else onOpenBook(book); }}><blockquote>“{quote.text}”</blockquote><span>{book?.title ?? '알 수 없는 책'}{quote.page ? ` · p.${quote.page}` : quote.cfi ? ' · epub 위치' : ''}</span></button>; })}</div> : <div className="empty-state"><b>아직 담은 문장이 없어요.</b><span>독서 중 ‘문장 담기’로 마음에 남은 구절을 기록하세요.</span></div>}
  </div>;
}

function Settings({ themeId, displayMode, setDisplayMode, setThemeId, onImported, setNotice }: { themeId: string; displayMode: DisplayMode; setDisplayMode: (mode: DisplayMode) => Promise<void>; setThemeId: (id: string) => Promise<void>; onImported: () => Promise<void>; setNotice: (message: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [persistResult, setPersistResult] = useState<string>();
  const [kakaoKey, setKakaoKey] = useState('');
  const [showKakaoKey, setShowKakaoKey] = useState(false);
  const [kakaoResult, setKakaoResult] = useState('');
  const [includeEpubFiles, setIncludeEpubFiles] = useState(false);
  useEffect(() => { void db.preferences.get('kakaoRestKey').then((item) => setKakaoKey(typeof item?.value === 'string' ? item.value : '')); }, []);
  async function requestPersist() {
    // DEVICE-CHECK: BOOX 브라우저에서 허용 여부와 재부팅 뒤 유지 여부를 확인한다.
    if (!navigator.storage?.persist) { setPersistResult('이 브라우저는 영구 저장 요청을 지원하지 않아요.'); return; }
    const granted = await navigator.storage.persist();
    setPersistResult(granted ? '영구 저장이 허용되었습니다.' : '브라우저가 영구 저장을 허용하지 않았습니다.');
  }
  async function downloadBackup() {
    const blob = await exportBackup(includeEpubFiles);
    const fileName = `nyang-seojae-${new Date().toISOString().slice(0, 10)}.json`;
    // 안드로이드 앱(android/) 안에서는 WebView 가 blob 다운로드를 못 하므로 앱이 넣어 준 저장 통로를 쓴다.
    const bridge = (window as unknown as { NyangAndroid?: { saveFile(name: string, mime: string, base64: string): boolean } }).NyangAndroid;
    if (bridge) {
      const base64 = await blobToBase64(blob);
      // DEVICE-CHECK: 안드로이드 앱에서 백업 파일이 '다운로드/냥서재' 폴더에 저장되는지
      setNotice(bridge.saveFile(fileName, 'application/json', base64) ? '백업 파일을 다운로드/냥서재 폴더에 저장했습니다.' : '백업 파일을 저장하지 못했습니다.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.append(anchor);
    // DEVICE-CHECK: BOOX 기본 브라우저에서 JSON 파일이 다운로드 폴더에 저장되는지
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setNotice('백업 파일을 저장했습니다.');
  }
  async function restore(file?: File) {
    if (!file) return;
    if (!window.confirm('현재 서재 데이터를 백업 내용으로 바꿀까요? 이 작업 전에 기존 데이터를 내보내 두는 것을 권장합니다.')) { if (fileRef.current) fileRef.current.value = ''; return; }
    try { await importBackup(file); await onImported(); setNotice('백업을 가져왔습니다.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : '백업을 읽지 못했습니다.'); }
    if (fileRef.current) fileRef.current.value = '';
  }
  async function saveKakaoKey() {
    if (kakaoKey.trim()) await db.preferences.put({ key: 'kakaoRestKey', value: kakaoKey.trim() });
    else await db.preferences.delete('kakaoRestKey');
    setNotice(kakaoKey.trim() ? '카카오 REST API 키를 저장했습니다.' : '카카오 REST API 키를 지웠습니다.');
  }
  async function clearKakaoKey() {
    setKakaoKey('');
    await db.preferences.delete('kakaoRestKey');
    setKakaoResult('키를 지웠습니다.');
  }
  async function testKakaoConnection() {
    setKakaoResult('연결 시험 중…');
    try {
      const result = await searchKakaoBooks('어린 왕자', kakaoKey, 1);
      setKakaoResult(result.length ? `성공: ${result[0].title}` : '성공: 검색 결과가 없습니다.');
    } catch (error) { setKakaoResult(kakaoErrorMessage(error)); }
  }
  const poses: Pose[] = ['reading', 'resting', 'idle', 'sleeping'];
  return <div className="page settings-page"><div className="page-heading"><div><small>기기와 서재 관리</small><h1>설정</h1></div></div>
    <section className="settings-card"><h2>화면 모드</h2><div className="display-mode" role="group" aria-label="화면 모드"><button className={displayMode === 'eink' ? 'active' : ''} onClick={() => void setDisplayMode('eink')}>이북리더기</button><button className={displayMode === 'phone' ? 'active' : ''} onClick={() => void setDisplayMode('phone')}>휴대폰</button></div><p>이북리더기 모드는 흰 바탕과 진한 검정 글자로 표시합니다.</p></section>
    <section className="settings-card"><h2>방 테마</h2><div className="theme-list">{themeData.themes.map((theme) => { const einkFile = (theme as typeof theme & { einkFile?: string }).einkFile; const file = displayMode === 'eink' && einkFile ? einkFile : theme.file; return <button key={theme.id} className={theme.id === themeId ? 'active' : ''} onClick={() => void setThemeId(theme.id)}><img src={`${import.meta.env.BASE_URL}art/${file}`} alt="" /><span>{theme.name}</span></button>; })}</div><h3>고양이 자세 미리보기</h3><div className="pose-list">{poses.map((pose) => <figure key={pose}><img src={`${import.meta.env.BASE_URL}art/cat/${alignData.sprites[pose].file}`} alt="" /><figcaption>{{ reading: '읽는 중', resting: '쉬는 중', idle: '대기', sleeping: '자는 중' }[pose]}</figcaption></figure>)}</div></section>
    <section className="settings-card"><h2>책 검색(카카오)</h2><p>키는 이 기기에만 저장되고 백업 파일에도 들어가지 않습니다.</p><div className="secret-row"><label>REST API 키<input type={showKakaoKey ? 'text' : 'password'} value={kakaoKey} onChange={(event) => setKakaoKey(event.target.value)} autoComplete="off" /></label><button onClick={() => setShowKakaoKey((value) => !value)}>{showKakaoKey ? '숨기기' : '보기'}</button></div><div className="button-row"><button onClick={() => void saveKakaoKey()}>저장</button><button onClick={() => void clearKakaoKey()}>지우기</button><button onClick={() => void testKakaoConnection()}>연결 시험</button></div>{kakaoResult && <p className="result-text" role="status">{kakaoResult}</p>}</section>
    <ReaderKeySettings setNotice={setNotice} />
    <section className="settings-card"><h2>내 데이터</h2><p>책, 기록, 문장과 표지를 JSON 파일 하나로 보관합니다.</p><label className="check"><input type="checkbox" checked={includeEpubFiles} onChange={(event) => setIncludeEpubFiles(event.target.checked)} /> epub 파일 포함(백업 파일이 커질 수 있어요)</label><div className="button-row"><button onClick={() => void downloadBackup()}>백업 내보내기</button><button onClick={() => fileRef.current?.click()}>백업 가져오기</button></div><input className="visually-hidden" ref={fileRef} type="file" accept="application/json,.json" onChange={(e) => void restore(e.target.files?.[0])} /></section>
    <section className="settings-card"><h2>저장소 보호</h2><p>브라우저가 공간을 정리할 때 냥서재 데이터를 지우지 않도록 요청합니다.</p><button onClick={() => void requestPersist()}>영구 보관 요청</button>{persistResult && <p className="result-text">{persistResult}</p>}</section>
    <KeyTester />
  </div>;
}

function ReaderKeySettings({ setNotice }: { setNotice: (message: string) => void }) {
  const [keys, setKeys] = useState<ReaderKeys>({ next: ['PageDown', 'ArrowRight', 'ArrowDown', ' ', 'Space'], previous: ['PageUp', 'ArrowLeft', 'ArrowUp'], swapped: false });
  const [capturing, setCapturing] = useState<'next' | 'previous'>();
  useEffect(() => { void db.preferences.get('readerKeys').then((item) => { if (item?.value) setKeys((current) => ({ ...current, ...(item.value as Partial<ReaderKeys>) })); }); }, []);
  useEffect(() => {
    if (!capturing) return;
    const listener = (event: KeyboardEvent) => {
      event.preventDefault();
      const value = event.code || event.key;
      const next = { ...keys, [capturing]: [value] };
      setKeys(next);
      setCapturing(undefined);
      void db.preferences.put({ key: 'readerKeys', value: next });
      setNotice(`${capturing === 'next' ? '다음' : '이전'} 버튼을 ${value}(으)로 지정했습니다.`);
    };
    window.addEventListener('keydown', listener, { once: true });
    return () => window.removeEventListener('keydown', listener);
  }, [capturing, keys, setNotice]);
  async function toggleSwap() {
    const next = { ...keys, swapped: !keys.swapped };
    setKeys(next);
    await db.preferences.put({ key: 'readerKeys', value: next });
  }
  return <section className="settings-card"><h2>뷰어 버튼</h2>{/* DEVICE-CHECK: BOOX 물리 버튼으로 앞/뒤 넘김이 되는지, 방향이 맞는지 */}<label className="check"><input type="checkbox" checked={keys.swapped} onChange={() => void toggleSwap()} /> 앞/뒤 바꾸기</label><p>기본 다음: PageDown, →, ↓, Space<br />기본 이전: PageUp, ←, ↑</p><div className="button-row"><button onClick={() => setCapturing('next')}>{capturing === 'next' ? '다음 키를 눌러 주세요' : `다음 직접 지정: ${keys.next.join(', ')}`}</button><button onClick={() => setCapturing('previous')}>{capturing === 'previous' ? '이전 키를 눌러 주세요' : `이전 직접 지정: ${keys.previous.join(', ')}`}</button></div></section>;
}

function KeyTester() {
  const [active, setActive] = useState(false);
  const [events, setEvents] = useState<Array<{ key: string; code: string; keyCode: number }>>([]);
  useEffect(() => {
    if (!active) return;
    // DEVICE-CHECK: BOOX 페이지 넘김 버튼이 설치 앱에서 어떤 key/code로 들어오는지 확인한다.
    const listener = (event: KeyboardEvent) => setEvents((current) => [{ key: event.key, code: event.code, keyCode: event.keyCode }, ...current].slice(0, 10));
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [active]);
  return <section className="settings-card key-tester"><h2>기기 버튼 시험</h2><p>시험 모드에서는 키의 기본 동작을 막지 않고 최근 입력 10개를 보여 줍니다.</p>{active ? <><button onClick={() => setActive(false)}>시험 끝</button><ol>{events.map((item, index) => <li key={`${item.code}-${index}`}><code>key={item.key} · code={item.code} · keyCode={item.keyCode}</code></li>)}</ol></> : <button className="device-test-start" onClick={() => { setEvents([]); setActive(true); }}>기기 버튼 시험 시작</button>}</section>;
}

function BookForm({ book, onClose, onSaved, onOpenSettings, onOpenBook, setNotice }: { book?: Book; onClose: () => void; onSaved: () => Promise<void>; onOpenSettings: () => void; onOpenBook: (book: Book) => void; setNotice: (message: string) => void }) {
  const [cover, setCover] = useState<File>();
  const [epubDraft, setEpubDraft] = useState<{ file: File; cover?: Blob }>();
  const [epubMessage, setEpubMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const [metadata, setMetadata] = useState<Pick<Book, 'publisher' | 'isbn' | 'publishedYear' | 'coverUrl'>>({ publisher: book?.publisher, isbn: book?.isbn, publishedYear: book?.publishedYear, coverUrl: book?.coverUrl });
  function applySearchResult(result: KakaoBookResult) {
    const form = formRef.current;
    if (!form) return;
    const title = form.elements.namedItem('title');
    const author = form.elements.namedItem('author');
    if (title instanceof HTMLInputElement) title.value = result.title;
    if (author instanceof HTMLInputElement) author.value = result.author ?? '';
    setMetadata({ publisher: result.publisher, isbn: result.isbn, publishedYear: result.publishedYear, coverUrl: result.coverUrl });
  }
  async function chooseEpub(file?: File) {
    if (!file) return;
    setEpubMessage('epub 정보를 읽는 중…');
    try {
      const existingFile = (await db.epubFiles.toArray()).find((item) => item.name === file.name && item.blob.size === file.size);
      if (existingFile) {
        const existingBook = await db.books.filter((item) => item.fileId === existingFile.id).first();
        if (existingBook) {
          setNotice('이미 있는 책입니다. 기존 책을 열었습니다.');
          onClose();
          onOpenBook(existingBook);
          return;
        }
      }
      const metadataResult = await readEpubMetadata(file);
      const form = formRef.current;
      if (form) {
        const title = form.elements.namedItem('title');
        const author = form.elements.namedItem('author');
        const source = form.elements.namedItem('source');
        const status = form.elements.namedItem('status');
        if (title instanceof HTMLInputElement) title.value = metadataResult.title;
        if (author instanceof HTMLInputElement) author.value = metadataResult.author ?? '';
        if (source instanceof HTMLSelectElement) source.value = 'own-epub';
        if (status instanceof HTMLSelectElement) status.value = 'reading';
      }
      setEpubDraft({ file, cover: metadataResult.cover });
      setEpubMessage(`epub에서 제목${metadataResult.author ? '·저자' : ''}${metadataResult.cover ? '·표지' : ''}를 채웠습니다. 수정한 뒤 저장하세요.`);
    } catch (error) { setEpubMessage(error instanceof Error ? error.message : 'epub 파일을 읽지 못했습니다.'); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const timestamp = Date.now();
    const totalPages = parseOptionalNumber(data.get('totalPages'));
    const currentPage = parseOptionalNumber(data.get('currentPage'));
    let coverBlobId = book?.coverBlobId;
    const selectedCover = cover ?? epubDraft?.cover;
    if (selectedCover) { coverBlobId = uid(); await db.blobs.put({ id: coverBlobId, blob: selectedCover, kind: 'cover' }); }
    const status = String(data.get('status')) as BookStatus;
    const fileId = epubDraft ? uid() : book?.fileId;
    const next: Book = {
      ...book,
      id: book?.id ?? uid(), title: String(data.get('title')).trim(), author: String(data.get('author')).trim() || undefined,
      source: String(data.get('source')) as BookSource, status, category: String(data.get('category')).trim() || undefined,
      publisher: metadata.publisher, isbn: metadata.isbn, publishedYear: metadata.publishedYear, coverUrl: metadata.coverUrl,
      totalPages, currentPage, progress: resolveProgress({ progressInput: '', pageTo: currentPage, totalPages, previousProgress: book?.progress, done: status === 'done' }),
      rating: Number(data.get('rating')) || undefined, review: String(data.get('review')).trim() || undefined,
      isLifeBook: data.get('isLifeBook') === 'on', coverBlobId, fileId, createdAt: book?.createdAt ?? timestamp, updatedAt: timestamp,
      finishedAt: status === 'done' ? (book?.finishedAt ?? timestamp) : undefined
    };
    await db.transaction('rw', db.books, db.epubFiles, async () => {
      if (epubDraft && fileId) await db.epubFiles.put({ id: fileId, name: epubDraft.file.name, blob: epubDraft.file, addedAt: timestamp, progress: 0 });
      await db.books.put(next);
    });
    await onSaved(); onClose();
  }
  return <Dialog title={book ? '책 정보 수정' : '책 추가'} onClose={onClose}><form ref={formRef} onSubmit={submit} className="form-grid">
    {!book && <section className="epub-import wide"><strong>epub 파일로 추가</strong><input type="file" accept="application/epub+zip,.epub" onChange={(event) => void chooseEpub(event.target.files?.[0])} />{epubMessage && <p role="status">{epubMessage}</p>}</section>}
    <KakaoBookSearch onSelect={applySearchResult} onOpenSettings={onOpenSettings} />
    <label>제목<input name="title" defaultValue={book?.title} required /></label><label>저자<input name="author" defaultValue={book?.author} /></label>
    <label>상태<select name="status" defaultValue={book?.status ?? 'want'}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <label>형태<select name="source" defaultValue={book?.source ?? 'paper'}>{Object.entries(sourceLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <label>카테고리<input name="category" defaultValue={book?.category} placeholder="소설, 에세이…" /></label><label>표지 이미지<input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0])} /></label>
    <label>전체 쪽수<input name="totalPages" type="number" min="1" defaultValue={book?.totalPages} /></label><label>현재 쪽<input name="currentPage" type="number" min="0" defaultValue={book?.currentPage} /></label>
    <label>별점<select name="rating" defaultValue={book?.rating ?? ''}><option value="">없음</option>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}점</option>)}</select></label><label className="check wide"><input name="isLifeBook" type="checkbox" defaultChecked={book?.isLifeBook} /> 인생책으로 표시</label>
    <label className="wide">한 줄 후기<textarea name="review" defaultValue={book?.review} rows={2} /></label><div className="form-actions wide"><button type="button" onClick={onClose}>취소</button><button className="primary" type="submit">저장</button></div>
  </form></Dialog>;
}

function KakaoBookSearch({ onSelect, onOpenSettings }: { onSelect: (book: KakaoBookResult) => void; onOpenSettings: () => void }) {
  const [query, setQuery] = useState('');
  const [key, setKey] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<KakaoBookResult[]>([]);
  useEffect(() => { void db.preferences.get('kakaoRestKey').then((item) => setKey(typeof item?.value === 'string' ? item.value : '')); }, []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  async function search() {
    if (!query.trim()) { setMessage('검색어를 입력해 주세요.'); return; }
    setLoading(true); setMessage(''); setResults([]);
    try {
      const next = await searchKakaoBooks(query.trim(), key, 10);
      setResults(next); if (!next.length) setMessage('검색 결과가 없습니다.');
    } catch (error) { setMessage(kakaoErrorMessage(error)); }
    finally { setLoading(false); }
  }
  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void search();
  }
  if (!key) return <section className="book-search wide"><strong>책 검색</strong><p>설정에서 카카오 키를 넣으면 책 정보를 자동으로 채울 수 있어요.</p><button type="button" onClick={onOpenSettings}>설정으로 이동</button></section>;
  return <section className="book-search wide"><strong>책 검색</strong>{online ? <div className="book-search-row"><input aria-label="카카오 책 검색어" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleSearchKeyDown} /><button type="button" onClick={() => void search()}>찾기</button></div> : <p>인터넷 연결 시 사용 가능</p>}{loading && <p role="status">찾는 중…</p>}{message && <p role="status">{message}</p>}{results.length > 0 && <div className="search-results">{results.map((result, index) => <button type="button" key={`${result.isbn ?? result.title}-${index}`} onClick={() => { onSelect(result); setResults([]); setMessage('책 정보를 채웠습니다.'); }}>{result.coverUrl ? <img src={result.coverUrl} alt="" /> : <span className="search-cover-empty" aria-hidden="true" />}<span><b>{result.title}</b><small>{[result.author, result.publisher, result.publishedYear].filter(Boolean).join(' · ')}</small></span></button>)}</div>}<small className="search-credit">검색: 카카오</small></section>;
}

function FinishForm({ timer, book, endedAt: endedAtProp, onClose, onSaved, onDiscard, setNotice }: { timer: ActiveTimer; book: Book; endedAt?: number; onClose: () => void; onSaved: () => Promise<void>; onDiscard: () => Promise<void>; setNotice: (message: string) => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const endedAt = endedAtProp ?? Date.now();
    const pageTo = parseOptionalNumber(data.get('pageTo')); const totalPages = book.totalPages;
    let done = data.get('done') === 'on';
    const progress = resolveProgress({ progressInput: String(data.get('progress') ?? ''), pageTo, totalPages, previousProgress: book.progress, done });
    if (!done && (progress ?? progressOf(book)) >= 1 && book.status !== 'done') done = window.confirm('다 읽었어요로 표시할까요?');
    const result = finishReaderClock({ timer, lastInputAt: endedAt }, endedAt);
    await db.transaction('rw', db.sessions, db.books, db.activeTimers, db.preferences, async () => {
      if (result.keep) await db.sessions.put({ id: uid(), bookId: book.id, startedAt: timer.startedAt, endedAt, activeSec: result.activeSec, pauses: result.pauses, mode: timer.mode === 'reader-auto' ? 'reader-auto' : 'timer', pageFrom: timer.mode === 'reader-auto' ? undefined : book.currentPage, pageTo: timer.mode === 'reader-auto' ? undefined : pageTo, progressFrom: timer.progressFrom ?? book.progress, progressTo: progress, note: String(data.get('note')).trim() || undefined });
      await db.books.update(book.id, { currentPage: pageTo ?? book.currentPage, progress, status: done ? 'done' : 'reading', finishedAt: done ? endedAt : book.finishedAt, updatedAt: endedAt });
      await db.activeTimers.delete('current');
      await db.preferences.delete('hiddenAt');
    });
    if (!result.keep) setNotice('1분이 안 돼서 기록하지 않았어요');
    await onSaved(); onClose();
  }
  const previewEndedAt = endedAtProp ?? Date.now();
  const previewActiveSec = activeSeconds(timer, previewEndedAt);
  const intro = timer.mode === 'reader-auto' && previewActiveSec < 60
    ? '1분이 안 돼 기록되지 않아요'
    : `이번 독서 ${Math.max(1, Math.round(previewActiveSec / 60))}분을 기록할까요?`;
  return <Dialog title="독서 종료" onClose={onClose}><form onSubmit={submit} className="form-grid"><p className="wide form-intro"><strong>{book.title}</strong><br />{intro}</p>{timer.mode !== 'reader-auto' && <label>읽은 쪽<input name="pageTo" type="number" min="0" defaultValue={book.currentPage} /></label>}<label className={timer.mode === 'reader-auto' ? 'wide' : ''}>진행률 %<input name="progress" type="number" min="0" max="100" defaultValue={timer.mode === 'reader-auto' ? Math.round(progressOf(book) * 100) : undefined} placeholder={`현재 ${Math.round(progressOf(book) * 100)}%`} /></label><label className="wide">메모<textarea name="note" rows={3} /></label><label className="check wide"><input name="done" type="checkbox" /> 이 책을 다 읽었어요</label><div className="form-actions wide spread"><button className="danger" type="button" onClick={() => void onDiscard()}>기록 없이 버리기</button><span><button type="button" onClick={onClose}>계속 읽기</button><button className="primary" type="submit">기록 저장</button></span></div></form></Dialog>;
}

function ManualSessionForm({ book, onClose, onSaved }: { book: Book; onClose: () => void; onSaved: () => Promise<void> }) {
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const date = new Date(String(data.get('date'))); const minutes = Math.max(1, Number(data.get('minutes')) || 1); const startedAt = date.getTime(); await db.sessions.put({ id: uid(), bookId: book.id, startedAt, endedAt: startedAt + minutes * 60_000, activeSec: minutes * 60, pauses: [], mode: 'manual', pageFrom: parseOptionalNumber(data.get('pageFrom')), pageTo: parseOptionalNumber(data.get('pageTo')), note: String(data.get('note')).trim() || undefined }); await db.books.update(book.id, { updatedAt: Date.now() }); await onSaved(); onClose(); }
  return <Dialog title="독서 기록 추가" onClose={onClose}><form onSubmit={submit} className="form-grid"><label className="wide">날짜와 시각<input name="date" type="datetime-local" required defaultValue={toLocalInput(Date.now())} /></label><label>읽은 시간(분)<input name="minutes" type="number" min="1" required /></label><span /><label>시작 쪽<input name="pageFrom" type="number" min="0" /></label><label>마지막 쪽<input name="pageTo" type="number" min="0" /></label><label className="wide">메모<textarea name="note" rows={3} /></label><div className="form-actions wide"><button type="button" onClick={onClose}>취소</button><button className="primary" type="submit">저장</button></div></form></Dialog>;
}

function QuoteForm({ book, onClose, onSaved }: { book: Book; onClose: () => void; onSaved: () => Promise<void> }) {
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); await db.quotes.put({ id: uid(), bookId: book.id, text: String(data.get('text')).trim(), page: parseOptionalNumber(data.get('page')), memo: String(data.get('memo')).trim() || undefined, origin: 'typed', createdAt: Date.now() }); await onSaved(); onClose(); }
  return <Dialog title="문장 담기" onClose={onClose}><form onSubmit={submit} className="form-grid"><p className="wide form-intro">{book.title}</p><label className="wide">마음에 남은 문장<textarea name="text" rows={5} required autoFocus /></label><label>쪽수<input name="page" type="number" min="0" /></label><label>메모<input name="memo" /></label><div className="form-actions wide"><button type="button" onClick={onClose}>취소</button><button className="primary" type="submit">담기</button></div></form></Dialog>;
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="modal-head"><h2 id="dialog-title">{title}</h2><button onClick={onClose} aria-label="닫기">×</button></div>{children}</section></div>;
}

function Cover({ book, small, tiny }: { book: Book; small?: boolean; tiny?: boolean }) {
  const [url, setUrl] = useState<string>();
  const [remoteFailed, setRemoteFailed] = useState(false);
  useEffect(() => { let live = true; let objectUrl = ''; if (!book.coverBlobId) { setUrl(undefined); return; } void db.blobs.get(book.coverBlobId).then((item) => { if (item && live) { objectUrl = URL.createObjectURL(item.blob); setUrl(objectUrl); } }); return () => { live = false; if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [book.coverBlobId]);
  useEffect(() => setRemoteFailed(false), [book.coverUrl]);
  const className = `cover ${small ? 'small' : ''} ${tiny ? 'tiny' : ''}`;
  if (url) return <span className={className}><img src={url} alt={`${book.title} 표지`} /></span>;
  // DEVICE-CHECK: 한 번 본 카카오 표지가 비행기 모드에서도 서비스워커 캐시로 보이는지 확인한다.
  if (book.coverUrl && !remoteFailed) return <span className={className}><img src={book.coverUrl} alt={`${book.title} 표지`} onError={() => setRemoteFailed(true)} /></span>;
  const hue = [...book.title].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  return <span className={`${className} fallback c${hue}`}><b>{book.title}</b><small>{book.author || '냥서재'}</small></span>;
}

function Progress({ book, compact }: { book: Book; compact?: boolean }) {
  const percent = Math.round(progressOf(book) * 100);
  return <div className={`progress-wrap ${compact ? 'compact' : ''}`} aria-label={`진행률 ${percent}%`}><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><small>{percent}%</small></div>;
}

function formatDateTime(timestamp: number): string { return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(timestamp); }
function toLocalInput(timestamp: number): string { const d = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60_000); return d.toISOString().slice(0, 16); }

export default App;
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
