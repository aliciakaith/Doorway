import { useEffect, useRef } from 'react';
import type { TacticCode } from '../types';
import { TACTIC_BY_CODE } from '../data/tactics';
import { VerdictIcon } from './Icons';

interface Props {
  tactic: TacticCode;
  closeLabel: string;
  onClose: () => void;
}

/** Opens over the library or over a conversation, so a participant never loses their place. */
export function TacticPanel({ tactic, closeLabel, onClose }: Props) {
  const t = TACTIC_BY_CODE[tactic];
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), [tactic]);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-30 bg-ink/20" aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="tactic-title"
        className="fixed top-4 right-4 bottom-4 z-[31] box-border flex w-[820px] max-w-[calc(100vw-32px)] flex-col gap-3.5 overflow-auto rounded-[26px] bg-shell p-[22px] shadow-[0_20px_60px_rgba(20,20,20,0.16)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Tactic definition</span>
          <button ref={closeRef} onClick={onClose} className="rounded-full border-0 bg-ink px-4 py-[9px] text-[13px] text-white">
            {closeLabel}
          </button>
        </div>

        <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6">
          <span className="self-start rounded-[5px] bg-ink px-2 py-[3px] font-mono text-xs text-white">{t.id}</span>
          <h2 id="tactic-title" className="m-0 text-[28px] font-semibold tracking-[-0.02em]">
            {t.name}
          </h2>
          <p className="m-0 text-base leading-[1.55] text-pretty">{t.description}</p>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Linguistic markers</span>
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {t.markers.map((m) => (
                <li key={m} className="rounded-full bg-chip px-3 py-[5px] text-[13px]">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-[22px] bg-white p-5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <VerdictIcon verdict="Absent" size={12} />
            Does not count
          </span>
          {t.notThis.map((n) => (
            <div key={n} className="rounded-[4px_14px_14px_4px] border-l-[3px] border-dotted border-ink-3 bg-wash px-3.5 py-3 text-sm leading-[1.55]">
              {n}
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-1.5 rounded-[22px] bg-white px-5 py-[18px]">
          <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Note</span>
          <span className="text-sm leading-[1.55]">{t.note}</span>
        </section>
      </aside>
    </>
  );
}
