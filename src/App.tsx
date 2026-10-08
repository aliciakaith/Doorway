import { useEffect, useState } from 'react';
import type { ConversationItem, TacticId } from './types';
import { assertValidResults, ResultsValidationError } from './lib/validate';
import { href, navigate, replace, useRoute, type ExploreScreen } from './lib/route';
import {
  applyPatch,
  clearParticipant,
  emptyResponse,
  loadParticipant,
  loadResponses,
  saveParticipant,
  saveResponses,
  storageWorks,
  type Judgement,
  type ResponseMap,
} from './lib/storage';
import { exportResponses } from './lib/exportResponses';
import { Sidebar } from './components/Sidebar';
import { LimitationsPanel } from './components/LimitationsPanel';
import { TacticPanel } from './components/TacticPanel';
import { DataError } from './components/DataError';
import { Start } from './screens/Start';
import { Review } from './screens/Review';
import { Done } from './screens/Done';
import { TacticLibrary } from './screens/TacticLibrary';
import { Analyse } from './screens/Analyse';
import { Corpus } from './screens/Corpus';

type Load = { status: 'loading' } | { status: 'error'; problems: string[] } | { status: 'ready'; items: ConversationItem[] };

const RESULTS_URL = `${import.meta.env.BASE_URL}data/results.json`;

const EXPLORE_TITLES: Record<ExploreScreen, [string, string]> = {
  analyse: ['Analyse a farewell', 'Enter one goodbye and the reply to it. The result uses the same layout participants see in a session.'],
  tactics: ['Tactic library', 'Six tactics. Open one to see its rule, its markers, and examples that count set against near-misses that do not.'],
  corpus: ['Corpus', 'Aggregate results across the dataset.'],
};

/** Where a participant picks up: the first unanswered conversation, or the end screen. */
function resumeHref(items: ConversationItem[], responses: ResponseMap): string {
  const i = items.findIndex((item) => !responses[item.id]?.judgement);
  return i === -1 ? href.done() : href.item(i);
}

export default function App() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [participant, setParticipant] = useState<string | null>(() => loadParticipant());
  const [responses, setResponses] = useState<ResponseMap>(() => {
    const code = loadParticipant();
    return code ? loadResponses(code) : {};
  });
  const [changing, setChanging] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [tactic, setTactic] = useState<TacticId | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [storageOk] = useState(() => storageWorks());
  const route = useRoute();
  const [finished, setFinished] = useState(() => route.screen === 'done');
  const [lastIndex, setLastIndex] = useState(0);

  useEffect(() => {
    fetch(RESULTS_URL, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load ${RESULTS_URL} (HTTP ${res.status}).`);
        return res.json() as Promise<unknown>;
      })
      .then((data) => {
        // Dev only: bad data fails loudly. Production builds are checked by the plugin in vite.config.ts.
        if (import.meta.env.DEV) assertValidResults(data);
        setLoad({ status: 'ready', items: data as ConversationItem[] });
      })
      .catch((err: unknown) => {
        if (err instanceof ResultsValidationError) {
          console.error(err.message, err.problems);
          setLoad({ status: 'error', problems: err.problems });
        } else {
          setLoad({ status: 'error', problems: [err instanceof Error ? err.message : String(err)] });
        }
      });
  }, []);

  const items = load.status === 'ready' ? load.items : [];
  const reviewIndex = route.screen === 'review' ? Math.min(route.index, Math.max(items.length - 1, 0)) : null;
  const isExplore = route.screen === 'analyse' || route.screen === 'tactics' || route.screen === 'corpus';
  // Explore leaves the controlled set, so it stays locked until the participant reaches the end.
  const sessionActive = !!participant && !finished;
  const showStart = changing || (!participant && !isExplore);

  useEffect(() => {
    if (reviewIndex !== null) {
      setLastIndex(reviewIndex);
      setFinished(false);
    }
    if (route.screen === 'done') setFinished(true);
  }, [reviewIndex, route.screen]);

  // No hash, or an Explore URL typed mid-session: send the participant back to where they were.
  useEffect(() => {
    if (load.status !== 'ready' || !participant || changing) return;
    if (route.screen === 'start' || (isExplore && sessionActive)) replace(resumeHref(items, responses));
  }, [load.status, participant, changing, route.screen, isExplore, sessionActive, items, responses]);

  // Left and right arrows move between conversations during review. No other shortcuts.
  useEffect(() => {
    if (reviewIndex === null || limitsOpen || tactic || showStart) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      const next = reviewIndex + (e.key === 'ArrowRight' ? 1 : -1);
      if (next < 0 || next >= items.length) return;
      e.preventDefault();
      navigate(href.item(next));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reviewIndex, items.length, limitsOpen, tactic, showStart]);

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

  if (load.status === 'error') return <DataError problems={load.problems} />;
  if (load.status === 'loading') {
    return <div className="p-10 text-sm text-ink-3">Loading results…</div>;
  }

  const answered = items.map((item) => !!responses[item.id]?.judgement);

  const start = (code: string) => {
    const restored = loadResponses(code);
    saveParticipant(code);
    setParticipant(code);
    setResponses(restored);
    setSaveFailed(false);
    setFinished(false);
    setChanging(false);
    navigate(resumeHref(items, restored));
  };

  const openWithoutSession = () => {
    clearParticipant();
    setParticipant(null);
    setResponses({});
    setChanging(false);
    navigate(href.analyse());
  };

  const respond = (itemId: string, patch: { judgement?: Judgement; comment?: string }) => {
    if (!participant) return;
    const next = { ...responses, [itemId]: applyPatch(responses[itemId] ?? emptyResponse(itemId), patch) };
    setResponses(next);
    setSaveFailed(!saveResponses(participant, next));
  };

  if (showStart) {
    return <Start total={items.length} onStart={start} onSkip={openWithoutSession} />;
  }

  const reviewItem = reviewIndex !== null ? items[reviewIndex] : undefined;
  const [title, subtitle] = isExplore ? EXPLORE_TITLES[route.screen as ExploreScreen] : ['', ''];

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)]">
      <Sidebar
        active={isExplore ? (route.screen as ExploreScreen) : 'review'}
        participant={participant}
        sessionActive={sessionActive}
        storageOk={storageOk}
        onReview={() => {
          if (!participant) {
            setChanging(true);
            return;
          }
          setTactic(null);
          navigate(finished ? href.done() : href.item(lastIndex));
        }}
        onExplore={(screen) => {
          if (sessionActive) return;
          navigate(href[screen]());
        }}
        onChangeParticipant={() => {
          setLimitsOpen(false);
          setTactic(null);
          setChanging(true);
        }}
      />

      <main className={`flex min-w-0 flex-col gap-5 px-9 ${reviewItem ? 'pb-[220px]' : 'pt-8 pb-12'}`}>
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
            saveFailed={saveFailed}
            onRespond={(patch) => respond(reviewItem.id, patch)}
            onPrev={() => reviewIndex > 0 && navigate(href.item(reviewIndex - 1))}
            onNext={() => navigate(reviewIndex < items.length - 1 ? href.item(reviewIndex + 1) : href.done())}
            onOpenLimits={() => setLimitsOpen(true)}
            onOpenTactic={setTactic}
          />
        )}
        {route.screen === 'done' && participant && (
          <Done
            answered={answered}
            onGoTo={(i) => navigate(href.item(i))}
            onExport={() => exportResponses(participant, items, responses)}
          />
        )}
        {route.screen === 'analyse' && <Analyse items={items} />}
        {route.screen === 'tactics' && <TacticLibrary onOpen={setTactic} />}
        {route.screen === 'corpus' && <Corpus />}
      </main>

      {tactic && (
        <TacticPanel
          tactic={tactic}
          closeLabel={reviewIndex !== null ? `Back to conversation ${reviewIndex + 1}` : 'Close'}
          onClose={() => setTactic(null)}
        />
      )}
      {limitsOpen && <LimitationsPanel onClose={() => setLimitsOpen(false)} />}
    </div>
  );
}
