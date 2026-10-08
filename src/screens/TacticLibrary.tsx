import type { TacticId } from '../types';
import { TACTICS } from '../data/tactics';

/** Six cards. Each opens the tactic panel with its rule, markers and examples. */
export function TacticLibrary({ onOpen }: { onOpen: (id: TacticId) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {TACTICS.map((t) => (
        <button
          key={t.id}
          onClick={() => onOpen(t.id)}
          className="flex flex-col items-start gap-3 rounded-[20px] border border-line bg-white p-[22px] text-left text-ink hover:border-line-2"
        >
          <span className="rounded-[4px] bg-ink px-1.5 py-0.5 font-mono text-[11px] text-white">{t.code}</span>
          <span className="text-[19px] leading-tight font-semibold tracking-[-0.01em]">{t.name}</span>
          <span className="text-sm leading-normal text-ink-2">{t.definition}</span>
          <span className="flex flex-wrap gap-1.5">
            {t.markers.slice(0, 3).map((m) => (
              <span key={m} className="rounded-full bg-chip px-2.5 py-1 text-xs">
                {m}
              </span>
            ))}
          </span>
          <span className="text-[13px] font-medium underline">Rule, examples and near-misses</span>
        </button>
      ))}
    </div>
  );
}
