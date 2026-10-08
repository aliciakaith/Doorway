import { useEffect, useRef } from 'react';
import type { TacticId } from '../types';
import { TACTIC_BY_ID, type TacticExample } from '../data/tactics';
import { VerdictIcon } from './Icons';

interface Props {
  tactic: TacticId;
  closeLabel: string;
  onClose: () => void;
}

/** Opens over the library or over a conversation, so a participant never loses their place. */
export function TacticPanel({ tactic, closeLabel, onClose }: Props) {
  const t = TACTIC_BY_ID[tactic];
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
          <span className="self-start rounded-[5px] bg-ink px-2 py-[3px] font-mono text-xs text-white">{t.code}</span>
          <h2 id="tactic-title" className="m-0 text-[28px] font-semibold tracking-[-0.02em]">
            {t.name}
          </h2>
          <p className="m-0 text-base leading-[1.55] text-pretty">{t.definition}</p>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Decision rule</span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <RuleBox verdict="present" label="Present when" text={t.rule.present} />
              <RuleBox verdict="absent" label="Absent when" text={t.rule.absent} />
            </div>
            {t.note && (
              <span className="text-[13px] leading-normal text-ink-2">
                <b className="font-semibold text-ink">Note:</b> {t.note}
              </span>
            )}
          </div>

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
          <div className="grid grid-cols-2 gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <VerdictIcon verdict="present" size={12} />
              Counts
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <VerdictIcon verdict="absent" size={12} />
              Near-miss · does not count
            </span>
          </div>
          {t.counts.map((yes, i) => (
            <div key={yes.reply} className="grid grid-cols-2 gap-3">
              <Example example={yes} line="border-solid border-ink" />
              <Example example={t.nearMisses[i]} line="border-dotted border-ink-3" />
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-1.5 rounded-[22px] bg-white px-5 py-[18px]">
          <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Commonly confused with</span>
          <span className="text-sm leading-[1.55]">{t.confusedWith}</span>
        </section>
      </aside>
    </>
  );
}

/** Present and Absent conditions get identical boxes so neither reads as the default. */
function RuleBox({ verdict, label, text }: { verdict: 'present' | 'absent'; label: string; text: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border-[1.5px] border-ink px-4 py-3.5">
      <span className="flex items-center gap-2 text-[13px] font-semibold">
        <VerdictIcon verdict={verdict} size={12} />
        {label}
      </span>
      <span className="text-sm leading-[1.55]">{text}</span>
    </div>
  );
}

function Example({ example, line }: { example: TacticExample; line: string }) {
  return (
    <div className={`flex flex-col gap-2 rounded-[4px_14px_14px_4px] border-l-[3px] bg-wash p-3.5 ${line}`}>
      <span className="text-xs text-ink-2">User: “{example.user}”</span>
      <span className="text-base leading-[1.45] font-medium">“{example.reply}”</span>
      <span className="text-[13px] leading-normal text-ink-2">{example.why}</span>
    </div>
  );
}
