import type { KeyboardEvent } from 'react';
import type { ConversationItem, Span } from '../types';
import { SpanBadge } from '../components/Icons';
import { STATE_LABEL } from '../lib/labels';
import { segmentResponse } from '../lib/segments';
import { TACTIC_BY_ID } from '../data/tactics';

interface Props {
  item: ConversationItem;
  selected: number | null;
  onToggle: (spanId: number) => void;
  onClear: () => void;
  stickyTop: string;
}

// Line style carries the state alongside the written label, so the three states survive greyscale.
const LINE: Record<Span['state'], string> = {
  fired: 'decoration-solid decoration-ink',
  contested: 'decoration-dashed decoration-ink',
  ruled_out: 'decoration-dotted decoration-ink-3',
};

const LEGEND_LINE: Record<Span['state'], string> = {
  fired: 'bg-hl border-b-2 border-solid border-ink',
  contested: 'bg-hl border-b-2 border-dashed border-ink',
  ruled_out: 'border-b-2 border-dotted border-ink-3',
};

/** Sticky so the highlights stay in view while the judgement column scrolls. */
export function Transcript({ item, selected, onToggle, onClear, stickyTop }: Props) {
  const segments = segmentResponse(item.aiResponse, item.result.spans);
  const states = (['fired', 'contested', 'ruled_out'] as const).filter((s) => item.result.spans.some((sp) => sp.state === s));

  const onKey = (e: KeyboardEvent, id: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(id);
    }
  };

  return (
    <section
      aria-label="Transcript"
      style={{ top: stickyTop }}
      className="box-border flex flex-col gap-5 self-start rounded-[22px] bg-white p-7 min-[1100px]:sticky"
    >
      <div className="flex flex-wrap gap-2 text-[13px] text-ink-3">
        <span>{item.platform}</span>
        <span aria-hidden="true">·</span>
        <span>Companion “{item.companion}”</span>
      </div>

      {item.warmUpTurns > 0 && (
        <p className="m-0 text-[13px] leading-normal text-ink-3">
          Preceded by a {item.warmUpTurns}-turn warm-up conversation on everyday topics. Not shown, and not part of the judgement.
        </p>
      )}

      <div className="flex max-w-[80%] flex-col items-end gap-1 self-end">
        <span className="text-[11px] text-ink-3">User · exit signal</span>
        <div className="rounded-2xl bg-chip px-[15px] py-[11px] text-base leading-[1.55]">{item.userMessage}</div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] text-ink-3">{item.companion} · reply being judged</span>
        <div className="rounded-[20px] border-[1.5px] border-ink px-[26px] py-6 text-[23px] leading-[1.8] tracking-[-0.005em] text-pretty">
          {segments.map((seg, k) => {
            if (!seg.span) {
              return (
                <span key={k} className={selected !== null ? 'text-ink-4' : undefined}>
                  {seg.text}
                </span>
              );
            }
            const span = seg.span;
            const show = selected === null || selected === span.id;
            const tinted = show && span.state !== 'ruled_out';
            return (
              <span
                key={k}
                role="button"
                tabIndex={0}
                aria-pressed={selected === span.id}
                aria-label={`Span ${span.id}, ${STATE_LABEL[span.state]}, ${TACTIC_BY_ID[span.tactic].name}: ${span.evidence}`}
                onClick={() => onToggle(span.id)}
                onKeyDown={(e) => onKey(e, span.id)}
                className={`clone-box cursor-pointer rounded-[5px] ${tinted ? 'bg-hl px-[3px] py-[2px]' : ''} ${show ? `text-ink underline decoration-2 underline-offset-[6px] ${LINE[span.state]}` : 'text-ink-4'}`}
              >
                {seg.text}
                <SpanBadge id={span.id} dimmed={!show} inline />
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-2">
        <div className="flex flex-wrap gap-3.5">
          {states.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`h-3 w-[22px] ${LEGEND_LINE[s]}`} />
              {STATE_LABEL[s]}
            </span>
          ))}
        </div>
        {selected !== null && (
          <button onClick={onClear} className="rounded-full border-0 bg-ink px-[13px] py-[7px] text-xs text-white">
            Showing span {selected} only · Show all
          </button>
        )}
      </div>
    </section>
  );
}
