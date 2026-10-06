import type { KeyboardEvent } from 'react';
import type { ConversationItem, Span } from '../types';
import { SpanBadge } from '../components/Icons';
import { MITIGATION_LABEL, SCOPE_LABEL, formatDate } from '../lib/labels';
import { segmentResponse } from '../lib/segments';
import { TACTIC_BY_ID } from '../data/tactics';

interface Props {
  item: ConversationItem;
  selected: number | null;
  onToggle: (spanId: number) => void;
  onClear: () => void;
}

// Line style carries the state alongside the badge, so the three states survive greyscale.
const ACTIVE_STYLE: Record<Span['state'], string> = {
  fired: 'bg-hl-strong decoration-solid decoration-ink px-[3px] py-[2px]',
  contested: 'bg-hl decoration-dashed decoration-ink px-[3px] py-[2px]',
  ruled_out: 'decoration-dotted decoration-ink-3',
};

export function Transcript({ item, selected, onToggle, onClear }: Props) {
  const segments = segmentResponse(item.aiResponse, item.result.spans);
  const selectedSpan = item.result.spans.find((s) => s.id === selected);

  const onKey = (e: KeyboardEvent, id: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(id);
    }
  };

  return (
    <section
      aria-label="Transcript"
      className="flex flex-col gap-[18px] self-start rounded-[22px] bg-white p-6 min-[1180px]:sticky min-[1180px]:top-4 min-[1180px]:max-h-[calc(100vh-32px)] min-[1180px]:overflow-auto"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="m-0 text-[15px] font-semibold">Transcript</h2>
        <div className="flex flex-wrap gap-1.5 text-xs text-ink-2">
          <span className="rounded-full bg-chip px-[11px] py-1.5">{item.platform}</span>
          <span className="rounded-full bg-chip px-[11px] py-1.5">Companion “{item.companion}”</span>
          <span className="rounded-full bg-chip px-[11px] py-1.5 font-mono">{item.id}</span>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-ink-3">
        <dt>Probe</dt>
        <dd className="m-0 font-mono text-ink-2">{item.probeId}</dd>
        <dt>Exit</dt>
        <dd className="m-0 text-ink-2">
          {SCOPE_LABEL[item.scope]} · {MITIGATION_LABEL[item.mitigation].toLowerCase()}
        </dd>
        <dt>Collected</dt>
        <dd className="m-0 text-ink-2">{formatDate(item.collectedOn)}</dd>
      </dl>

      <p className="m-0 border-l-2 border-line-2 pl-3 text-[13px] leading-normal text-ink-3">
        Preceded by a {item.warmUpTurns}-turn warm-up conversation on everyday topics. Not shown, and not part of the judgement.
      </p>

      <div className="flex max-w-[82%] flex-col items-end gap-[3px] self-end">
        <span className="text-[11px] text-ink-3">User · farewell</span>
        <div className="rounded-2xl bg-chip px-[15px] py-[11px] text-base leading-[1.55]">{item.userMessage}</div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-ink-3">{item.companion} · reply being judged</span>
        <div className="rounded-[18px] border-[1.5px] border-ink px-5 py-[18px] text-[21px] leading-[1.75] tracking-[-0.005em] text-pretty">
          {segments.map((seg, k) => {
            if (!seg.span) {
              return (
                <span key={k} className={selected !== null ? 'text-ink-4' : undefined}>
                  {seg.text}
                </span>
              );
            }
            const span = seg.span;
            const dimmed = selected !== null && selected !== span.id;
            return (
              <span
                key={k}
                role="button"
                tabIndex={0}
                aria-pressed={selected === span.id}
                aria-label={`Span ${span.id}, ${span.state.replace('_', ' ')}, ${TACTIC_BY_ID[span.tactic].name}: ${span.evidence}`}
                onClick={() => onToggle(span.id)}
                onKeyDown={(e) => onKey(e, span.id)}
                className={`clone-box cursor-pointer rounded-[5px] ${dimmed ? 'text-ink-4' : `underline decoration-2 underline-offset-[5px] ${ACTIVE_STYLE[span.state]}`}`}
              >
                {seg.text}
                <span className="ml-[3px]">
                  <SpanBadge id={span.id} state={span.state} muted={dimmed} />
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-2">
        <div className="flex flex-wrap gap-3.5">
          <Legend state="fired" label="Fired" line="border-b-2 border-solid border-ink bg-hl-strong" />
          <Legend state="contested" label="Contested" line="border-b-2 border-dashed border-ink bg-hl" />
          <Legend state="ruled_out" label="Checked, ruled out" line="border-b-2 border-dotted border-ink-3" />
        </div>
        {selectedSpan && (
          <button onClick={onClear} className="rounded-full bg-ink px-[13px] py-[7px] text-xs text-white">
            Isolating [{selectedSpan.id}] {TACTIC_BY_ID[selectedSpan.tactic].name} · Show all
          </button>
        )}
      </div>
    </section>
  );
}

function Legend({ state, label, line }: { state: Span['state']; label: string; line: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-[22px] ${line}`} />
      <SpanBadge id="n" state={state} />
      {label}
    </span>
  );
}
