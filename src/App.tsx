import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { db, exportBackup, importBackup } from './db';
import { activeSeconds, isPaused, localDayBounds } from './timer';
import { parseOptionalNumber, resolveProgress } from './progress';
import type { ActiveTimer, Book, BookSource, BookStatus, Quote, Session } from './types';
import { sourceLabels, statusLabels } from './types';
import alignData from '../public/art/cat/align.json';
import themeData from '../public/art/themes.json';

type MainTab = 'home' | 'library' | 'calendar' | 'quotes' | 'settings';
type Modal = 'add-book' | 'finish' | 'quote' | 'manual-session' | 'edit-book' | null;
type SortKey = 'recent' | 'created' | 'title' | 'progress';
type Pose = keyof typeof alignData.sprites;

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
  const [timer, setTimer] = useState<ActiveTimer>();
  const [tab, setTab] = useState<MainTab>('home');
  const [selectedBookId, setSelectedBookId] = useState<string>();
  const [modal, setModal] = useState<Modal>(null);
  const [themeId, setThemeId] = useState(themeData.default);
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    const [nextBooks, nextSessions, nextQuotes, nextTimer, themePref] = await Promise.all([
      db.books.toArray(), db.sessions.toArray(), db.quotes.toArray(),
      db.activeTimers.get('current'), db.preferences.get('theme')
    ]);
    setBooks(nextBooks);
    setSessions(nextSessions);
    setQuotes(nextQuotes);
    setTimer(nextTimer);
    if (typeof themePref?.value === 'string') setThemeId(themePref.value);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(''), 4_000);
    return () => window.clearTimeout(id);
  }, [notice]);

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
      await db.activeTimers.put({ id: 'current', bookId: book.id, startedAt, pauses: [] });
    });
    await refresh();
    setTab('home');
    setSelectedBookId(undefined);
  }

  async function togglePause() {
    if (!timer) return;
    const pauses = [...timer.pauses];
    const last = pauses.at(-1);
    if (last && last.until === undefined) last.until = Date.now();
    else pauses.push({ at: Date.now() });
    await db.activeTimers.put({ ...timer, pauses });
    await refresh();
  }

  async function discardTimer() {
    await db.activeTimers.delete('current');
    setModal(null);
    await refresh();
  }

  function openBook(book: Book) {
    setSelectedBookId(book.id);
    setTab('library');
  }

  const view = selectedBook && tab === 'library'
    ? <BookDetail book={selectedBook} sessions={sessions} quotes={quotes} onBack={() => setSelectedBookId(undefined)} onRefresh={refresh} onStart={() => void startReading(selectedBook)} onModal={setModal} />
    : tab === 'home'
      ? <Home books={books} sessions={sessions} timer={timer} currentBook={currentBook} elapsedSec={elapsedSec} paused={timerPaused} themeId={themeId} onStart={startReading} onPause={togglePause} onFinish={() => setModal('finish')} onQuote={() => setModal('quote')} onOpenBook={openBook} onAddBook={() => { setTab('library'); setModal('add-book'); }} />
      : tab === 'library'
        ? <Library books={books} onOpenBook={openBook} onAdd={() => setModal('add-book')} />
        : tab === 'calendar'
          ? <Calendar books={books} sessions={sessions} onOpenBook={openBook} />
          : tab === 'quotes'
            ? <QuotesView books={books} quotes={quotes} onOpenBook={openBook} />
            : <Settings themeId={themeId} setThemeId={async (id) => { await db.preferences.put({ key: 'theme', value: id }); setThemeId(id); }} onImported={refresh} setNotice={setNotice} />;

  return (
    <div className="app-shell">
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
      {modal === 'add-book' && <BookForm onClose={() => setModal(null)} onSaved={refresh} />}
      {modal === 'finish' && timer && currentBook && <FinishForm timer={timer} book={currentBook} onClose={() => setModal(null)} onSaved={refresh} onDiscard={discardTimer} />}
      {modal === 'quote' && currentBook && <QuoteForm book={currentBook} onClose={() => setModal(null)} onSaved={refresh} />}
      {modal === 'manual-session' && selectedBook && <ManualSessionForm book={selectedBook} onClose={() => setModal(null)} onSaved={refresh} />}
      {modal === 'edit-book' && selectedBook && <BookForm book={selectedBook} onClose={() => setModal(null)} onSaved={refresh} />}
    </div>
  );
}

function Home(props: {
  books: Book[]; sessions: Session[]; timer?: ActiveTimer; currentBook?: Book; elapsedSec: number; paused: boolean; themeId: string;
  onStart: (book: Book) => Promise<void>; onPause: () => Promise<void>; onFinish: () => void; onQuote: () => void; onOpenBook: (book: Book) => void; onAddBook: () => void;
}) {
  const readingBooks = props.books.filter((book) => book.status === 'reading').sort((a, b) => b.updatedAt - a.updatedAt);
  const doneBooks = props.books.filter((book) => book.status === 'done').sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const theme = themeData.themes.find((item) => item.id === props.themeId) ?? themeData.themes[0];
  const pose: Pose = props.timer ? (props.paused ? 'resting' : 'reading') : (new Date().getHours() >= 23 ? 'sleeping' : 'idle');
  const sprite = alignData.sprites[pose];
  const [dayStart, dayEnd] = localDayBounds();
  const todaySec = props.sessions.filter((s) => s.startedAt >= dayStart && s.startedAt < dayEnd).reduce((sum, s) => sum + s.activeSec, 0) + props.elapsedSec;
  const note = homeNotes[new Date().getDate() % homeNotes.length];

  return <div className="page home-page">
    <section className="scene-card" aria-label={`${theme.name}에서 쉬는 고양이`}>
      <div className="scene-viewport">
        <div className="art-box">
          <img className="scene-bg" src={`${import.meta.env.BASE_URL}art/${theme.file}`} alt="" />
          <img
            className="cat-sprite"
            src={`${import.meta.env.BASE_URL}art/cat/${sprite.file}`}
            alt={pose === 'reading' ? '책 읽는 고양이' : pose === 'resting' ? '쉬는 고양이' : pose === 'sleeping' ? '자는 고양이' : '기다리는 고양이'}
            style={{ left: `${sprite.x}%`, top: `${sprite.y}%`, height: `${sprite.h}%`, transform: `translate(-50%, -100%)${sprite.flip ? ' scaleX(-1)' : ''}` }}
          />
        </div>
        <p className="paper-note">{note}</p>
      </div>
      <div className="timer-overlap">
        {props.timer && props.currentBook ? <>
          <div className="timer-line">
            <Cover book={props.currentBook} small />
            <div className="timer-title"><small>{props.paused ? '고양이와 쉬는 중…' : '고양이와 읽는 중…'}</small><strong>{props.currentBook.title}</strong><span>{props.currentBook.author || sourceLabels[props.currentBook.source]}</span></div>
            <div className="timer-minutes"><strong>{Math.floor(props.elapsedSec / 60)}</strong><small>분</small></div>
          </div>
          <Progress book={props.currentBook} />
          <div className="today-time">오늘의 독서 시간 <strong>{Math.floor(todaySec / 60)}분</strong></div>
          <div className="button-row three">
            <button onClick={() => void props.onPause()}>{props.paused ? '다시 읽기' : '일시 정지'}</button>
            <button onClick={props.onFinish}>독서 종료</button>
            <button onClick={props.onQuote}>문장 담기</button>
          </div>
        </> : <>
          <div className="empty-timer"><strong>무슨 책을 펼쳐 볼까요?</strong><span>읽고 있는 책에서 바로 시작할 수 있어요.</span></div>
          <div className="reading-shortlist">
            {readingBooks.length ? readingBooks.slice(0, 3).map((book) => <button key={book.id} onClick={() => void props.onStart(book)}><Cover book={book} small /><span>{book.title}</span><b>읽기 시작</b></button>) : <button onClick={props.onAddBook}>서재에서 책을 추가해 주세요</button>}
          </div>
        </>}
      </div>
    </section>
    <section className="shelf-strip section-block">
      <div className="section-title"><div><small>나의 기록</small><h2>책장에 꽂힌 책 ({doneBooks.length})</h2></div></div>
      {doneBooks.length ? <div className="cover-row">{doneBooks.map((book) => <button key={book.id} onClick={() => props.onOpenBook(book)}><Cover book={book} /><span>{book.title}</span></button>)}</div> : <p className="empty-copy">완독한 책이 이곳에 차곡차곡 놓여요.</p>}
    </section>
  </div>;
}

function Library({ books, onOpenBook, onAdd }: { books: Book[]; onOpenBook: (book: Book) => void; onAdd: () => void }) {
  const [status, setStatus] = useState<BookStatus>('reading');
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

function BookDetail({ book, sessions, quotes, onBack, onRefresh, onStart, onModal }: { book: Book; sessions: Session[]; quotes: Quote[]; onBack: () => void; onRefresh: () => Promise<void>; onStart: () => void; onModal: (modal: Modal) => void }) {
  const [subtab, setSubtab] = useState<'info' | 'records'>('info');
  const [editing, setEditing] = useState<{ kind: 'session'; item: Session } | { kind: 'quote'; item: Quote }>();
  const bookSessions = sessions.filter((item) => item.bookId === book.id);
  const bookQuotes = quotes.filter((item) => item.bookId === book.id);
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

  return <div className="page detail-page">
    <button className="back" onClick={onBack}>← 서재</button>
    <section className="book-hero">
      <Cover book={book} />
      <div><span className="eyebrow">{sourceLabels[book.source]}{book.category ? ` · ${book.category}` : ''}</span><h1>{book.title}</h1><p>{book.author || '저자 미상'}</p><Progress book={book} /><span className="page-count">{book.currentPage ?? 0} / {book.totalPages ?? '?'}쪽</span></div>
    </section>
    <div className="detail-actions"><button className="primary" onClick={book.status === 'reading' ? onStart : cycleStatus}>{book.status === 'want' ? '독서 시작' : book.status === 'reading' ? '이어 읽기' : '다시 읽기'}</button><button onClick={() => onModal('edit-book')}>정보 수정</button></div>
    <div className="segmented detail-tabs"><button className={subtab === 'info' ? 'active' : ''} onClick={() => setSubtab('info')}>상세 정보</button><button className={subtab === 'records' ? 'active' : ''} onClick={() => setSubtab('records')}>기록 {bookSessions.length + bookQuotes.length}</button></div>
    {subtab === 'info' ? <section className="info-card">
      <div><span>상태</span><strong>{statusLabels[book.status]}</strong></div><div><span>별점</span><strong>{book.rating ? '★'.repeat(book.rating) : '아직 없음'}</strong></div><div><span>인생책</span><strong>{book.isLifeBook ? '내 인생책' : '표시 안 함'}</strong></div><div className="wide"><span>한 줄 후기</span><p>{book.review || '아직 남긴 후기가 없어요.'}</p></div>
      <button onClick={() => void cycleStatus()}>상태를 {book.status === 'done' ? '읽는 중' : '다 읽음'}으로 바꾸기</button>
    </section> : <section className="records">
      <div className="button-row"><button onClick={() => onModal('manual-session')}>＋ 독서 기록</button><button onClick={() => onModal('quote')}>＋ 문장 추가</button></div>
      {timeline.length ? timeline.map((entry) => <article key={`${entry.kind}-${entry.item.id}`} className="timeline-item">
        <div className="timeline-dot" />
        <div>{entry.kind === 'session' ? <><strong>{Math.max(1, Math.round(entry.item.activeSec / 60))}분 · {entry.item.pageFrom ? `p.${entry.item.pageFrom}` : '시작'}–{entry.item.pageTo ? `p.${entry.item.pageTo}` : '끝'}</strong><p>{entry.item.note || (entry.item.mode === 'manual' ? '수동 독서 기록' : '타이머 독서 기록')}</p></> : <><strong>“{entry.item.text}”</strong><p>{entry.item.page ? `p.${entry.item.page}` : '쪽수 없음'}{entry.item.memo ? ` · ${entry.item.memo}` : ''}</p></>}<small>{formatDateTime(entry.at)}</small></div>
        <div className="timeline-actions"><button className="text-button" onClick={() => setEditing(entry)}>수정</button><button className="text-button" onClick={() => void removeTimeline(entry.kind, entry.item.id)}>삭제</button></div>
      </article>) : <p className="empty-copy">독서 기록과 문장을 날짜순으로 모아 보여 드려요.</p>}
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

function QuotesView({ books, quotes, onOpenBook }: { books: Book[]; quotes: Quote[]; onOpenBook: (book: Book) => void }) {
  const sorted = [...quotes].sort((a, b) => b.createdAt - a.createdAt);
  return <div className="page quotes-page"><div className="page-heading"><div><small>직접 담은 문장</small><h1>필사함</h1></div><span className="count-badge">{quotes.length}개</span></div>
    <p className="stage-note">1단계에서는 직접 입력한 문장을 모아 봅니다. 이미지 OCR과 카드 저장은 다음 단계에서 추가됩니다.</p>
    {sorted.length ? <div className="quote-list">{sorted.map((quote) => { const book = books.find((b) => b.id === quote.bookId); return <button key={quote.id} onClick={() => book && onOpenBook(book)}><blockquote>“{quote.text}”</blockquote><span>{book?.title ?? '알 수 없는 책'}{quote.page ? ` · p.${quote.page}` : ''}</span></button>; })}</div> : <div className="empty-state"><b>아직 담은 문장이 없어요.</b><span>독서 중 ‘문장 담기’로 마음에 남은 구절을 기록하세요.</span></div>}
  </div>;
}

function Settings({ themeId, setThemeId, onImported, setNotice }: { themeId: string; setThemeId: (id: string) => Promise<void>; onImported: () => Promise<void>; setNotice: (message: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [persistResult, setPersistResult] = useState<string>();
  async function requestPersist() {
    // DEVICE-CHECK: BOOX 브라우저에서 허용 여부와 재부팅 뒤 유지 여부를 확인한다.
    if (!navigator.storage?.persist) { setPersistResult('이 브라우저는 영구 저장 요청을 지원하지 않아요.'); return; }
    const granted = await navigator.storage.persist();
    setPersistResult(granted ? '영구 저장이 허용되었습니다.' : '브라우저가 영구 저장을 허용하지 않았습니다.');
  }
  async function downloadBackup() {
    const blob = await exportBackup();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nyang-seojae-${new Date().toISOString().slice(0, 10)}.json`;
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
  return <div className="page settings-page"><div className="page-heading"><div><small>기기와 서재 관리</small><h1>설정</h1></div></div>
    <section className="settings-card"><h2>방 테마</h2><div className="theme-list">{themeData.themes.map((theme) => <button key={theme.id} className={theme.id === themeId ? 'active' : ''} onClick={() => void setThemeId(theme.id)}><img src={`${import.meta.env.BASE_URL}art/${theme.file}`} alt="" /><span>{theme.name}</span></button>)}</div></section>
    <section className="settings-card"><h2>내 데이터</h2><p>책, 기록, 문장과 표지를 JSON 파일 하나로 보관합니다.</p><div className="button-row"><button onClick={() => void downloadBackup()}>백업 내보내기</button><button onClick={() => fileRef.current?.click()}>백업 가져오기</button></div><input className="visually-hidden" ref={fileRef} type="file" accept="application/json,.json" onChange={(e) => void restore(e.target.files?.[0])} /></section>
    <section className="settings-card"><h2>저장소 보호</h2><p>브라우저가 공간을 정리할 때 냥서재 데이터를 지우지 않도록 요청합니다.</p><button onClick={() => void requestPersist()}>영구 보관 요청</button>{persistResult && <p className="result-text">{persistResult}</p>}</section>
  </div>;
}

function BookForm({ book, onClose, onSaved }: { book?: Book; onClose: () => void; onSaved: () => Promise<void> }) {
  const [cover, setCover] = useState<File>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const timestamp = Date.now();
    const totalPages = parseOptionalNumber(data.get('totalPages'));
    const currentPage = parseOptionalNumber(data.get('currentPage'));
    let coverBlobId = book?.coverBlobId;
    if (cover) { coverBlobId = uid(); await db.blobs.put({ id: coverBlobId, blob: cover, kind: 'cover' }); }
    const status = String(data.get('status')) as BookStatus;
    const next: Book = {
      ...book,
      id: book?.id ?? uid(), title: String(data.get('title')).trim(), author: String(data.get('author')).trim() || undefined,
      source: String(data.get('source')) as BookSource, status, category: String(data.get('category')).trim() || undefined,
      totalPages, currentPage, progress: resolveProgress({ progressInput: '', pageTo: currentPage, totalPages, previousProgress: book?.progress, done: status === 'done' }),
      rating: Number(data.get('rating')) || undefined, review: String(data.get('review')).trim() || undefined,
      isLifeBook: data.get('isLifeBook') === 'on', coverBlobId, createdAt: book?.createdAt ?? timestamp, updatedAt: timestamp,
      finishedAt: status === 'done' ? (book?.finishedAt ?? timestamp) : undefined
    };
    await db.books.put(next); await onSaved(); onClose();
  }
  return <Dialog title={book ? '책 정보 수정' : '책 추가'} onClose={onClose}><form onSubmit={submit} className="form-grid">
    <label>제목<input name="title" defaultValue={book?.title} required /></label><label>저자<input name="author" defaultValue={book?.author} /></label>
    <label>상태<select name="status" defaultValue={book?.status ?? 'want'}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <label>형태<select name="source" defaultValue={book?.source ?? 'paper'}>{Object.entries(sourceLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <label>카테고리<input name="category" defaultValue={book?.category} placeholder="소설, 에세이…" /></label><label>표지 이미지<input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0])} /></label>
    <label>전체 쪽수<input name="totalPages" type="number" min="1" defaultValue={book?.totalPages} /></label><label>현재 쪽<input name="currentPage" type="number" min="0" defaultValue={book?.currentPage} /></label>
    <label>별점<select name="rating" defaultValue={book?.rating ?? ''}><option value="">없음</option>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}점</option>)}</select></label><label className="check wide"><input name="isLifeBook" type="checkbox" defaultChecked={book?.isLifeBook} /> 인생책으로 표시</label>
    <label className="wide">한 줄 후기<textarea name="review" defaultValue={book?.review} rows={2} /></label><div className="form-actions wide"><button type="button" onClick={onClose}>취소</button><button className="primary" type="submit">저장</button></div>
  </form></Dialog>;
}

function FinishForm({ timer, book, onClose, onSaved, onDiscard }: { timer: ActiveTimer; book: Book; onClose: () => void; onSaved: () => Promise<void>; onDiscard: () => Promise<void> }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const endedAt = Date.now();
    const pageTo = parseOptionalNumber(data.get('pageTo')); const totalPages = book.totalPages;
    const done = data.get('done') === 'on';
    const progress = resolveProgress({ progressInput: String(data.get('progress') ?? ''), pageTo, totalPages, previousProgress: book.progress, done });
    await db.transaction('rw', db.sessions, db.books, db.activeTimers, async () => {
      await db.sessions.put({ id: uid(), bookId: book.id, startedAt: timer.startedAt, endedAt, activeSec: activeSeconds(timer, endedAt), pauses: timer.pauses.map((p) => p.until ? p : { ...p, until: endedAt }), mode: 'timer', pageFrom: book.currentPage, pageTo, progressFrom: book.progress, progressTo: progress, note: String(data.get('note')).trim() || undefined });
      await db.books.update(book.id, { currentPage: pageTo ?? book.currentPage, progress, status: done ? 'done' : 'reading', finishedAt: done ? endedAt : book.finishedAt, updatedAt: endedAt });
      await db.activeTimers.delete('current');
    });
    await onSaved(); onClose();
  }
  return <Dialog title="독서 종료" onClose={onClose}><form onSubmit={submit} className="form-grid"><p className="wide form-intro"><strong>{book.title}</strong><br />이번 독서 {Math.max(1, Math.round(activeSeconds(timer) / 60))}분을 기록할까요?</p><label>읽은 쪽<input name="pageTo" type="number" min="0" defaultValue={book.currentPage} /></label><label>진행률 %<input name="progress" type="number" min="0" max="100" placeholder={`현재 ${Math.round(progressOf(book) * 100)}%`} /></label><label className="wide">메모<textarea name="note" rows={3} /></label><label className="check wide"><input name="done" type="checkbox" /> 이 책을 다 읽었어요</label><div className="form-actions wide spread"><button className="danger" type="button" onClick={() => void onDiscard()}>기록 없이 버리기</button><span><button type="button" onClick={onClose}>계속 읽기</button><button className="primary" type="submit">기록 저장</button></span></div></form></Dialog>;
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
  useEffect(() => { let live = true; let objectUrl = ''; if (!book.coverBlobId) { setUrl(undefined); return; } void db.blobs.get(book.coverBlobId).then((item) => { if (item && live) { objectUrl = URL.createObjectURL(item.blob); setUrl(objectUrl); } }); return () => { live = false; if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [book.coverBlobId]);
  const className = `cover ${small ? 'small' : ''} ${tiny ? 'tiny' : ''}`;
  if (url) return <span className={className}><img src={url} alt={`${book.title} 표지`} /></span>;
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
