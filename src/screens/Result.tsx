import { useState } from 'react';
import type { Confidence, ConversationItem, Span, TacticId } from '../types';
import { SpanBadge, VerdictIcon } from '../components/Icons';
import { STATE_LABEL, VERDICT_LABEL, ZONES } from '../lib/labels';
import { TACTIC_BY_ID } from '../data/tactics';
import { METHOD_STEPS } from '../data/method';
import { Transcript } from './Transcript';

interface Props {
  item: ConversationItem;
  stickyTop: string;
  onOpenTactic: (id: TacticId) => void;
}

/** Parent keys this by item id, so selection and the open trace reset on every item. */
export function Result({ item, stickyTop, onOpenTactic }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const toggle = (id: number) => setSelected((cur) => (cur === id ? null : id));

  return (
    <div className="grid grid-cols-1 items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Transcript item={item} selected={selected} onToggle={toggle} onClear={() => setSelected(null)} stickyTop={stickyTop} />

      <section aria-label="Judgement" className="flex min-w-0 flex-col gap-3">
        <VerdictPanel item={item} />
        <ConfidenceScale confidence={item.result.confidence} />
        <SpanList spans={item.result.spans} selected={selected} onToggle={toggle} onOpenTactic={onOpenTactic} />
        <HowJudged trace={item.result.decisionTrace} />
      </section>
    </div>
  );
}

/** Identical neutral panel for all three verdicts. Only the word and its shape differ. */
function VerdictPanel({ item }: { item: ConversationItem }) {
  const { verdict, summary, borderlineNote } = item.result;
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border-[1.5px] border-ink bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-[0.04em] text-ink-2 uppercase">Verdict</span>
        <span className="text-xs text-ink-2">A finding to examine</span>
      </div>
      <div className="flex items-center gap-3.5 text-ink">
        <VerdictIcon verdict={verdict} size={20} />
        <span className="text-[44px] leading-none font-semibold tracking-[-0.03em]">{VERDICT_LABEL[verdict]}</span>
      </div>
      <p className="m-0 text-[15px] leading-normal text-pretty">{summary}</p>
      {borderlineNote && (
        <p className="m-0 border-t border-line pt-3 text-[13px] leading-[1.55] text-ink-2">
          <b className="font-semibold text-ink">Why borderline:</b> {borderlineNote}
        </p>
      )}
    </div>
  );
}

function ConfidenceScale({ confidence }: { confidence: Confidence }) {
  const active = ZONES.findIndex((z) => z.id === confidence.zone);
  const pct = Math.max(4, Math.min(96, confidence.value * 100));
  // Keep the label pill inside the card at either end of the scale.
  const pillShift = pct < 12 ? 'translateX(-10px)' : pct > 88 ? 'translateX(calc(-100% + 10px))' : 'translateX(-50%)';

  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] bg-white p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-semibold">Confidence</span>
        <span className="text-xs text-ink-3">Position on a five-zone scale</span>
      </div>
      <div className="relative pt-[30px]" role="img" aria-label={`Confidence ${confidence.value.toFixed(2)}, zone ${ZONES[active]?.label}`}>
        <div
          className="absolute top-0 rounded-lg bg-ink px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white"
          style={{ left: `${pct}%`, transform: pillShift }}
        >
          {ZONES[active]?.label} · {confidence.value.toFixed(2)}
        </div>
        <div className="grid h-3 grid-cols-5 gap-[3px]">
          {ZONES.map((z, i) => (
            <div key={z.id} className={`rounded-[3px] ${i === active ? 'bg-ink' : i === 2 ? 'hatch-soft' : 'bg-track'}`} />
          ))}
        </div>
        <div
          className="absolute top-6 h-6 w-1 -translate-x-1/2 rounded-sm bg-ink shadow-[0_0_0_2px_#fff]"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-5 gap-[3px]">
        {ZONES.map((z, i) => (
          <span key={z.id} className={`text-[11px] leading-tight ${i === active ? 'font-semibold text-ink' : 'text-ink-3'}`}>
            {z.label}
          </span>
        ))}
      </div>
      <p className="m-0 text-[13px] leading-normal text-ink-2">
        {confidence.runsAgreeing} of {confidence.runsTotal} independent runs agreed. {confidence.note}
      </p>
    </div>
  );
}

function listTitle(spans: Span[]): string {
  const states = new Set(spans.map((s) => s.state));
  if (spans.length === 0) return 'Spans examined (0)';
  if (states.size === 1) {
    const [only] = states;
    if (only === 'fired') return `Tactics detected (${spans.length})`;
    if (only === 'contested') return `Contested spans (${spans.length})`;
    return `Spans checked, ruled out (${spans.length})`;
  }
  return `Spans examined (${spans.length})`;
}

interface SpanListProps {
  spans: Span[];
  selected: number | null;
  onToggle: (id: number) => void;
  onOpenTactic: (id: TacticId) => void;
}

function SpanList({ spans, selected, onToggle, onOpenTactic }: SpanListProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[22px] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold">{listTitle(spans)}</h2>
        <span className="text-xs text-ink-3">Select a card to isolate its span</span>
      </div>
      {spans.length === 0 && <p className="m-0 text-[13px] text-ink-3">No spans were examined in this reply.</p>}
      {spans.map((span) => {
        const tactic = TACTIC_BY_ID[span.tactic];
        const isSel = selected === span.id;
        const dimmed = selected !== null && !isSel;
        return (
          <article
            key={span.id}
            onClick={() => onToggle(span.id)}
            className={`flex cursor-pointer flex-col gap-2 rounded-2xl border-[1.5px] px-[18px] py-4 ${isSel ? 'border-ink bg-[#fafafa]' : 'border-line bg-white hover:border-line-2'} ${dimmed ? 'opacity-55' : ''}`}
          >
            <button
              type="button"
              aria-pressed={isSel}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(span.id);
              }}
              className="flex flex-wrap items-center gap-2 border-0 bg-transparent p-0 text-left text-ink"
            >
              <SpanBadge id={span.id} />
              <span className="text-xs text-ink-2">{STATE_LABEL[span.state]}</span>
              {span.primary && (
                <span className="rounded-full border-[1.5px] border-ink px-2 py-0.5 text-[11px] font-semibold">Primary</span>
              )}
            </button>
            <q className="text-[19px] leading-[1.45] font-medium tracking-[-0.01em] text-pretty">{span.evidence}</q>
            <div className="text-[13px] font-semibold">
              {span.state === 'ruled_out' ? 'Nearest: ' : ''}
              {tactic.name}
            </div>
            <p className="m-0 text-[13px] leading-[1.55] text-ink-2">{span.rationale}</p>
            {span.readOtherWay && (
              <p className="m-0 border-t border-line pt-2 text-[13px] leading-[1.55] text-ink-2">
                <b className="font-semibold text-ink">Read the other way:</b> {span.readOtherWay}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTactic(span.tactic);
              }}
              className="self-start border-0 bg-transparent p-0 text-xs text-ink-2 underline"
            >
              What counts as {tactic.name}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function HowJudged({ trace }: { trace: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[22px] bg-white px-5 py-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-0 bg-transparent py-3.5 text-[15px] font-semibold text-ink"
      >
        How this was judged
        <span className="font-mono text-base" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-3.5 pb-[18px]">
          <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
            {METHOD_STEPS.map((step, i) => (
              <li key={step.heading} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2.5 text-[13px] leading-[1.55] text-ink-2">
                <span className="box-border flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-ink font-mono text-[11px] text-ink">
                  {i + 1}
                </span>
                <span>
                  <b className="font-semibold text-ink">{step.heading}.</b> {step.body}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-1.5 rounded-xl bg-wash px-3.5 py-3 text-[13px] leading-[1.55]">
            <b className="font-semibold">Applied to this reply:</b>
            {trace.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
