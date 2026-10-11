import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EvaluationItem, TacticCode } from './types';
import rawItems from './data/evaluationItems.json';
import { validateResults, unmatchedEvidence } from './lib/validate';
import { href, navigate, replace, useRoute, type ExploreScreen } from './lib/route';
import { emptyResponse, type ItemResponse, type Judgement, type ResponseMap } from './lib/session';
import { seededShuffle } from './lib/shuffle';
import { saveResponse, type SaveState } from './lib/saveResponse';
import { exportResponses } from './lib/exportResponses';
import { LOCKED_IN_SESSION, Sidebar } from './components/Sidebar';
import { LimitationsPanel } from './components/LimitationsPanel';
import { TacticPanel } from './components/TacticPanel';
import { DataError } from './components/DataError';
import { Start } from './screens/Start';
import { Review } from './screens/Review';
import { Done } from './screens/Done';
import { TacticLibrary } from './screens/TacticLibrary';
import { Analyse } from './screens/Analyse';
import { Corpus } from './screens/Corpus';

// Dev only: bad data fails loudly. Production builds are checked by the plugin in vite.config.ts.
const PROBLEMS = import.meta.env.DEV ? validateResults(rawItems) : [];
const ITEMS = rawItems as EvaluationItem[];
if (import.meta.env.DEV) unmatchedEvidence(ITEMS).forEach((w) => console.warn(w));

const EXPLORE_TITLES: Record<ExploreScreen, [string, string]> = {
  analyse: ['Analyse a farewell', 'Enter one goodbye and the reply to it. The result uses the same layout participants see in a session.'],
  tactics: ['Tactic library', 'Six tactics. Open one to see its markers and what does not count.'],
  corpus: ['Corpus', 'Detector labels across every collected farewell.'],
};

const COMMENT_SAVE_DELAY_MS = 800;

export default function App() {
  const [participant, setParticipant] = useState<string | null>(null);
  // In memory only. Each change is also sent to /api/responses; everything is exported at the end.
  const [responses, setResponses] = useState<ResponseMap>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [changing, setChanging] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [tactic, setTactic] = useState<TacticCode | null>(null);
  const route = useRoute();
  const [finished, setFinished] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);

  // Each participant gets their own order, reproducible from their ID.
  const order = useMemo(() => (participant ? seededShuffle(ITEMS, participant) : ITEMS), [participant]);

  const reviewIndex = route.screen === 'review' ? Math.min(route.index, order.length - 1) : null;
  const reviewItem = participant && reviewIndex !== null ? order[reviewIndex] : undefined;
  const isExplore = route.screen === 'analyse' || route.screen === 'tactics' || route.screen === 'corpus';
  const isLockedScreen = isExplore && LOCKED_IN_SESSION.includes(route.screen as ExploreScreen);
  // Analyse and Corpus leave the controlled set, so they stay locked until the participant reaches the end.
  const sessionActive = !!participant && !finished;
  const showStart = changing || (!participant && !isExplore);

  // ---- saving ----------------------------------------------------------------------------
  const responsesRef = useRef(responses);
  responsesRef.current = responses;
  const commentTimers = useRef<Record<string, number>>({});

  const pushToServer = useCallback(
    (r: ItemResponse) => {
      if (!participant) return;
      setSaveStates((s) => ({ ...s, [r.itemId]: 'saving' }));
      void saveResponse(participant, r).then((ok) => setSaveStates((s) => ({ ...s, [r.itemId]: ok ? 'saved' : 'failed' })));
    },
    [participant],
  );

  const update = useCallback((itemId: string, change: (r: ItemResponse) => ItemResponse): ItemResponse => {
    const pos = order.findIndex((it) => it.id === itemId);
    const prev = responsesRef.current[itemId] ?? emptyResponse(itemId, order[pos].pair_id, pos + 1);
    const next = change(prev);
    responsesRef.current = { ...responsesRef.current, [itemId]: next };
    setResponses(responsesRef.current);
    return next;
  }, [order]);

  // ---- time on item ----------------------------------------------------------------------
  // Counts only while the conversation is on screen and the tab is visible.
  const timer = useRef<{ itemId: string; since: number } | null>(null);

  const flushTime = useCallback(() => {
    const t = timer.current;
    if (!t) return null;
    const elapsed = (performance.now() - t.since) / 1000;
    t.since = performance.now();
    return update(t.itemId, (r) => ({ ...r, timeOnItemSeconds: r.timeOnItemSeconds + elapsed }));
  }, [update]);

  const currentId = reviewItem?.id ?? null;
  useEffect(() => {
    if (!currentId) return;
    timer.current = { itemId: currentId, since: performance.now() };
    return () => {
      const r = flushTime();
      timer.current = null;
      if (r && r.judgement) pushToServer(r);
    };
  }, [currentId, flushTime, pushToServer]);

  useEffect(() => {
    const onVisibility = () => {
      if (!timer.current) return;
      if (document.hidden) {
        const r = flushTime();
        if (r && r.judgement) pushToServer(r);
      } else {
        timer.current.since = performance.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [flushTime, pushToServer]);

  // ---- routing ---------------------------------------------------------------------------
  useEffect(() => {
    if (reviewIndex !== null) {
      setLastIndex(reviewIndex);
      setFinished(false);
    }
    if (route.screen === 'done') setFinished(true);
  }, [reviewIndex, route.screen]);

  // No hash, or a locked Explore URL typed mid-session: send the participant back to where they were.
  useEffect(() => {
    if (!participant || changing) return;
    if (route.screen === 'start' || (isLockedScreen && sessionActive)) replace(href.item(lastIndex));
  }, [participant, changing, route.screen, isLockedScreen, sessionActive, lastIndex]);

  const answered = order.map((item) => !!responses[item.id]?.judgement);

  // Left and right arrows move between conversations during review. No other shortcuts.
  // Moving forward needs an answer, the same as the Next button.
  useEffect(() => {
    if (reviewIndex === null || !reviewItem || limitsOpen || tactic || showStart) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      const forward = e.key === 'ArrowRight';
      if (forward && !responsesRef.current[reviewItem.id]?.judgement) return;
      const next = reviewIndex + (forward ? 1 : -1);
      if (next < 0 || next >= order.length) return;
      e.preventDefault();
      navigate(href.item(next));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reviewIndex, reviewItem, order.length, limitsOpen, tactic, showStart]);

  // Escape closes the side panels; standard dialog behaviour, not a navigation shortcut.
  useEffect(() => {
    if (!limitsOpen && !tactic) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setLimitsOpen(false);
      setTactic(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [limitsOpen, tactic]);

  if (PROBLEMS.length > 0) return <DataError problems={PROBLEMS} />;

  const start = (code: string) => {
    // Re-entering the same code (e.g. after "Change" by mistake) keeps this session's answers.
    if (code !== participant) {
      setResponses({});
      responsesRef.current = {};
      setSaveStates({});
    }
    setParticipant(code);
    setFinished(false);
    setChanging(false);
    navigate(href.item(0));
  };

  const openWithoutSession = () => {
    setParticipant(null);
    setResponses({});
    responsesRef.current = {};
    setChanging(false);
    navigate(href.analyse());
  };

  const respond = (itemId: string, patch: { judgement?: Judgement; comment?: string }) => {
    flushTime();
    const next = update(itemId, (r) => ({ ...r, ...patch }));
    window.clearTimeout(commentTimers.current[itemId]);
    if (!next.judgement) return; // nothing worth storing until there is an answer
    if (patch.judgement !== undefined) pushToServer(next);
    else commentTimers.current[itemId] = window.setTimeout(() => pushToServer(responsesRef.current[itemId]), COMMENT_SAVE_DELAY_MS);
  };

  if (showStart) {
    return <Start total={ITEMS.length} onStart={start} onSkip={openWithoutSession} />;
  }

  const [title, subtitle] = isExplore ? EXPLORE_TITLES[route.screen as ExploreScreen] : ['', ''];

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)]">
      <Sidebar
        active={isExplore ? (route.screen as ExploreScreen) : 'review'}
        participant={participant}
        sessionActive={sessionActive}
        onReview={() => {
          if (!participant) {
            setChanging(true);
            return;
          }
          setTactic(null);
          navigate(finished ? href.done() : href.item(lastIndex));
        }}
        onExplore={(screen) => {
          if (sessionActive && LOCKED_IN_SESSION.includes(screen)) return;
          navigate(href[screen]());
        }}
        onChangeParticipant={() => {
          setLimitsOpen(false);
          setTactic(null);
          setChanging(true);
        }}
      />

      <main className={`flex min-w-0 flex-col gap-5 px-9 ${reviewItem ? 'pb-[240px]' : 'pt-8 pb-12'}`}>
        {isExplore && (
          <header className="flex items-start justify-between gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <h1 className="m-0 text-[32px] font-semibold tracking-[-0.025em]">{title}</h1>
              <p className="m-0 max-w-[720px] text-sm text-ink-3">{subtitle}</p>
            </div>
            <button
              onClick={() => setLimitsOpen(true)}
              className="border-0 bg-transparent pt-1.5 text-[13px] whitespace-nowrap text-ink-2 underline"
            >
              What this tool cannot do
            </button>
          </header>
        )}

        {reviewItem && reviewIndex !== null && (
          <Review
            item={reviewItem}
            index={reviewIndex}
            answered={answered}
            response={responses[reviewItem.id]}
            saveState={saveStates[reviewItem.id] ?? 'idle'}
            onRespond={(patch) => respond(reviewItem.id, patch)}
            onPrev={() => reviewIndex > 0 && navigate(href.item(reviewIndex - 1))}
            onNext={() => {
              if (!responsesRef.current[reviewItem.id]?.judgement) return;
              navigate(reviewIndex < order.length - 1 ? href.item(reviewIndex + 1) : href.done());
            }}
            onOpenLimits={() => setLimitsOpen(true)}
            onOpenTactic={setTactic}
          />
        )}
        {route.screen === 'done' && participant && (
          <Done
            answered={answered}
            onGoTo={(i) => navigate(href.item(i))}
            onExport={() => exportResponses(participant, order, responsesRef.current)}
          />
        )}
        {route.screen === 'analyse' && <Analyse items={ITEMS} onOpenTactic={setTactic} />}
        {route.screen === 'tactics' && <TacticLibrary onOpen={setTactic} />}
        {route.screen === 'corpus' && <Corpus />}
      </main>

      {tactic && (
        <TacticPanel
          tactic={tactic}
          closeLabel={reviewIndex !== null && reviewItem ? `Back to conversation ${reviewIndex + 1}` : 'Close'}
          onClose={() => setTactic(null)}
        />
      )}
      {limitsOpen && <LimitationsPanel onClose={() => setLimitsOpen(false)} />}
    </div>
  );
}
