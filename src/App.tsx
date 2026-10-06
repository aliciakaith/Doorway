import { useEffect, useState } from 'react';
import type { ConversationItem } from './types';
import { assertValidResults, ResultsValidationError } from './lib/validate';
import { href, navigate, useRoute, type Route } from './lib/route';
import {
  applyPatch,
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
import { ParticipantPrompt } from './components/ParticipantPrompt';
import { DataError } from './components/DataError';
import { Navigator } from './screens/Navigator';
import { Result } from './screens/Result';
import { TacticLibrary } from './screens/TacticLibrary';
import { Analyse } from './screens/Analyse';
import { Corpus } from './screens/Corpus';

type Load = { status: 'loading' } | { status: 'error'; problems: string[] } | { status: 'ready'; items: ConversationItem[] };

const RESULTS_URL = `${import.meta.env.BASE_URL}data/results.json`;

export default function App() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [participant, setParticipant] = useState<string | null>(() => loadParticipant());
  const [responses, setResponses] = useState<ResponseMap>(() => {
    const code = loadParticipant();
    return code ? loadResponses(code) : {};
  });
  const [switching, setSwitching] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [storageOk] = useState(() => storageWorks());
  const [lastIndex, setLastIndex] = useState(0);
  const route = useRoute();

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
  const resultIndex = route.screen === 'result' ? Math.min(route.index, Math.max(items.length - 1, 0)) : null;

  useEffect(() => {
    if (resultIndex !== null) setLastIndex(resultIndex);
  }, [resultIndex]);

  // Left and right arrows move between items on the result screen. No other shortcuts.
  useEffect(() => {
    if (resultIndex === null || limitsOpen || switching || !participant) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      const next = resultIndex + (e.key === 'ArrowRight' ? 1 : -1);
      if (next < 0 || next >= items.length) return;
      e.preventDefault();
      navigate(href.item(next));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [resultIndex, items.length, limitsOpen, switching, participant]);

  // Escape closes the limitations panel; standard dialog behaviour, not a navigation shortcut.
  useEffect(() => {
    if (!limitsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLimitsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [limitsOpen]);

  if (load.status === 'error') return <DataError problems={load.problems} />;
  if (load.status === 'loading') {
    return <div className="p-10 text-sm text-ink-3">Loading results…</div>;
  }

  const answered = items.map((item) => !!responses[item.id]?.judgement);

  const chooseParticipant = (code: string) => {
    saveParticipant(code);
    setParticipant(code);
    setResponses(loadResponses(code));
    setSaveFailed(false);
    setSwitching(false);
  };

  const respond = (itemId: string, patch: { judgement?: Judgement; comment?: string }) => {
    if (!participant) return;
    const next = { ...responses, [itemId]: applyPatch(responses[itemId] ?? emptyResponse(itemId), patch) };
    setResponses(next);
    setSaveFailed(!saveResponses(participant, next));
  };

  const current = items[lastIndex];
  const [title, subtitle] = headerText(route, resultIndex !== null ? items[resultIndex] : current, items.length);

  return (
    <div className="box-border min-h-screen p-[18px]">
      <div className="box-border grid min-h-[calc(100vh-36px)] grid-cols-1 gap-4 rounded-[30px] bg-shell p-4 md:grid-cols-[228px_minmax(0,1fr)]">
        <Sidebar
          route={route}
          currentIndex={lastIndex}
          participant={participant}
          answered={answered}
          storageOk={storageOk}
          onSwitchParticipant={() => setSwitching(true)}
          onExport={() => participant && exportResponses(participant, items, responses)}
          onOpenLimits={() => setLimitsOpen(true)}
        />

        <main className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-wrap items-end justify-between gap-4 px-2 pt-3.5 pb-1">
            <div className="flex flex-col gap-1.5">
              <h1 className="m-0 text-[34px] font-semibold tracking-[-0.025em]">{title}</h1>
              <p className="m-0 text-sm text-ink-3">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLimitsOpen(true)}
                className="rounded-full border-0 bg-btn px-[18px] py-[11px] text-[13px] font-medium text-ink"
              >
                Limitations
              </button>
              {(route.screen === 'tactics' || route.screen === 'corpus') && (
                <a
                  href={href.analyse()}
                  className="rounded-full border border-line-2 px-4 py-2.5 text-[13px] font-medium text-ink-2 no-underline"
                >
                  New analysis
                </a>
              )}
            </div>
          </header>

          {route.screen === 'set' && <Navigator items={items} answered={answered} currentIndex={lastIndex} />}
          {resultIndex !== null && items[resultIndex] && (
            <Result
              key={items[resultIndex].id}
              item={items[resultIndex]}
              index={resultIndex}
              total={items.length}
              response={responses[items[resultIndex].id]}
              saveFailed={saveFailed}
              onRespond={(patch) => respond(items[resultIndex].id, patch)}
            />
          )}
          {route.screen === 'tactics' && <TacticLibrary tactic={route.tactic} fromIndex={route.from} />}
          {route.screen === 'analyse' && <Analyse />}
          {route.screen === 'corpus' && <Corpus />}
        </main>
      </div>

      {limitsOpen && <LimitationsPanel onClose={() => setLimitsOpen(false)} />}
      {(!participant || switching) && (
        <ParticipantPrompt
          onSubmit={chooseParticipant}
          onCancel={participant ? () => setSwitching(false) : undefined}
        />
      )}
    </div>
  );
}

function headerText(route: Route, item: ConversationItem | undefined, total: number): [string, string] {
  switch (route.screen) {
    case 'result':
      return ['Analysis result', item ? `${item.platform} · reply to a farewell · ${item.id}` : ''];
    case 'tactics':
      return ['Tactic library', "Six tactics, each with its rule, two cases that count and two that don't."];
    case 'analyse':
      return ['New analysis', "Paste the user's goodbye and the app's reply. Only the reply is judged."];
    case 'corpus':
      return ['Corpus view', 'Aggregate verdicts across the dataset. Sample figures for now.'];
    default:
      return ['Evaluation set', `${total} conversations, fixed order.`];
  }
}
