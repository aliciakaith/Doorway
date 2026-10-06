import type { Route } from '../lib/route';
import { href } from '../lib/route';

interface Props {
  route: Route;
  currentIndex: number;
  participant: string | null;
  answered: boolean[];
  storageOk: boolean;
  onSwitchParticipant: () => void;
  onExport: () => void;
  onOpenLimits: () => void;
}

export function Sidebar({ route, currentIndex, participant, answered, storageOk, onSwitchParticipant, onExport, onOpenLimits }: Props) {
  // Design order, except Analyse: it is not wired and is a way out of the fixed set,
  // so it sits last, below a divider, in muted type.
  const nav: { key: Route['screen']; label: string; to: string }[] = [
    { key: 'result', label: 'Result', to: href.item(currentIndex) },
    { key: 'set', label: 'Evaluation set', to: href.set() },
    { key: 'tactics', label: 'Tactic library', to: href.tactic('premature_exit') },
    { key: 'corpus', label: 'Corpus', to: href.corpus() },
  ];
  const analyseActive = route.screen === 'analyse';
  const answeredCount = answered.filter(Boolean).length;

  return (
    <aside className="flex flex-col gap-[22px] rounded-[22px] bg-white px-3.5 py-5 md:sticky md:top-[34px] md:h-[calc(100vh-68px)] md:overflow-auto">
      <div className="flex items-center gap-2.5 px-1.5">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-ink">
          <div className="h-[9px] w-[9px] rotate-45 bg-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-[-0.01em]">Doorway</span>
          <span className="text-[11px] text-ink-4">Disengagement resistance</span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Screens">
        {nav.map((n) => {
          const active = route.screen === n.key;
          return (
            <a
              key={n.key}
              href={n.to}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm text-ink no-underline ${active ? 'bg-chip font-semibold' : 'hover:bg-wash'}`}
            >
              <span className={`h-2 w-2 rounded-[2px] ${active ? 'bg-ink' : 'bg-line-2'}`} />
              <span className="flex-1">{n.label}</span>
            </a>
          );
        })}
        <div className="mx-2.5 my-2 h-px bg-line" aria-hidden="true" />
        <a
          href={href.analyse()}
          aria-current={analyseActive ? 'page' : undefined}
          className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] no-underline ${analyseActive ? 'bg-chip font-semibold text-ink' : 'text-ink-4 hover:bg-wash'}`}
        >
          <span className={`h-2 w-2 rounded-[2px] ${analyseActive ? 'bg-ink' : 'border border-line-2'}`} />
          <span className="flex-1">Analyse</span>
        </a>
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col gap-2.5 rounded-2xl bg-shell p-3.5">
        <div className="flex items-center justify-between gap-2 text-xs text-ink-3">
          <span>
            Participant <span className="font-mono text-ink">{participant ?? '—'}</span>
          </span>
          <button onClick={onSwitchParticipant} className="border-0 bg-transparent p-0 text-xs text-ink-3 underline">
            Switch
          </button>
        </div>
        <div className="text-sm font-semibold" aria-live="polite">
          {answeredCount} of {answered.length} answered
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${answered.length}, 1fr)` }} aria-hidden="true">
          {answered.map((a, i) => (
            <div key={i} className={`h-1.5 rounded-[3px] ${a ? 'bg-ink' : 'bg-line-2'}`} />
          ))}
        </div>
        {!storageOk && (
          <p className="m-0 rounded-lg border-[1.5px] border-ink bg-white p-2 text-xs leading-snug">
            This browser is blocking local storage. Answers will be lost on refresh. Export before closing.
          </p>
        )}
        <button
          onClick={onExport}
          className="rounded-full border border-line-2 bg-white px-3 py-2 text-xs font-medium text-ink"
        >
          Export responses
        </button>
      </div>

      <button
        onClick={onOpenLimits}
        className="flex items-center justify-between rounded-full border border-line-2 bg-white px-3.5 py-[11px] text-[13px] font-medium text-ink"
      >
        What this tool cannot do
        <span className="text-ink-4" aria-hidden="true">→</span>
      </button>
    </aside>
  );
}
