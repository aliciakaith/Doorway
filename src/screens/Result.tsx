import { useState } from 'react';
import type { Confidence, ConversationItem, Span } from '../types';
import { SpanBadge, VerdictIcon } from '../components/Icons';
import { STATE_LABEL, VERDICT_LABEL, ZONES, formatTime } from '../lib/labels';
import { href } from '../lib/route';
import type { ItemResponse, Judgement } from '../lib/storage';
import { TACTIC_BY_ID } from '../data/tactics';
import { Transcript } from './Transcript';

interface Props {
  item: ConversationItem;
  index: number;
  total: number;
  response: ItemResponse | undefined;
  saveFailed: boolean;
  onRespond: (patch: { judgement?: Judgement; comment?: string }) => void;
}

/** Parent keys this by item id, so selection and the open trace reset on every item. */
export function Result({ item, index, total, response, saveFailed, onRespond }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const toggle = (id: number) => setSelected((cur) => (cur === id ? null : id));
  const { result } = item;

  return (
    <>
      <div className="flex flex-wrap items-center gap-[18px] rounded-[22px] bg-white px-[18px] py-3.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[22px] font-semibold tracking-[-0.02em]">
            Item {index + 1} of {total}
          </span>
          <span className="font-mono text-[13px] text-ink-3">{item.id}</span>
        </div>
        <div className="flex-1" />
        <a href={href.set()} className="text-[13px] text-ink-2">
          All items
        </a>
        <div className="flex gap-1.5">
          <a
            href={index > 0 ? href.item(index - 1) : undefined}
            aria-disabled={index === 0}
            className={`rounded-full bg-btn px-4 py-2.5 text-[13px] font-medium text-ink no-underline ${index === 0 ? 'pointer-events-none opacity-40' : ''}`}
          >
            ← Previous
          </a>
          <a
            href={index < total - 1 ? href.item(index + 1) : undefined}
            aria-disabled={index === total - 1}
            className={`rounded-full bg-ink px-[18px] py-2.5 text-[13px] font-medium text-white no-underline hover:text-white ${index === total - 1 ? 'pointer-events-none opacity-40' : ''}`}
          >
            Next →
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 min-[1180px]:grid-cols-2">
        <Transcript item={item} selected={selected} onToggle={toggle} onClear={() => setSelected(null)} />

        <section aria-label="Judgement" className="flex min-w-0 flex-col gap-3">
          <VerdictPanel item={item} />
          <ConfidenceScale confidence={result.confidence} />
          <SpanList item={item} index={index} selected={selected} onToggle={toggle} />
          <HowJudged trace={result.decisionTrace} />
          <Feedback response={response} saveFailed={saveFailed} onRespond={onRespond} />
        </section>
      </div>
    </>
  );
}

/** Identical neutral panel for all three verdicts. Only the word and its shape differ. */
function VerdictPanel({ item }: { item: ConversationItem }) {
  const { verdict, summary, borderlineNote } = item.result;
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border-[1.5px] border-ink bg-white p-[22px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-[0.04em] text-ink-2 uppercase">Verdict</span>
        <span className="text-xs text-ink-2">A finding to examine</span>
      </div>
      <div className="flex items-center gap-3.5 text-ink">
        <VerdictIcon verdict={verdict} size={22} />
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
  const pct = Math.max(1, Math.min(99, confidence.value * 100));
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

function SpanList({ item, index, selected, onToggle }: { item: ConversationItem; index: number; selected: number | null; onToggle: (id: number) => void }) {
  const spans = item.result.spans;
  return (
    <div className="flex flex-col gap-3 rounded-[22px] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[15px] font-semibold">{listTitle(spans)}</h2>
        <span className="text-xs text-ink-3">Select to isolate</span>
      </div>
      {spans.length === 0 && <p className="m-0 text-[13px] text-ink-3">No spans were examined in this reply.</p>}
      {spans.map((span) => {
        const tactic = TACTIC_BY_ID[span.tactic];
        const isSel = selected === span.id;
        return (
          <article
            key={span.id}
            onClick={() => onToggle(span.id)}
            className={`flex cursor-pointer flex-col gap-2 rounded-2xl border-[1.5px] px-4 py-3.5 ${isSel ? 'border-ink bg-[#fafafa]' : 'border-line bg-white hover:border-line-2'}`}
          >
            <button
              type="button"
              aria-pressed={isSel}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(span.id);
              }}
              className="flex items-start gap-2.5 border-0 bg-transparent p-0 text-left text-ink"
            >
              <span className="pt-[5px]">
                <SpanBadge id={span.id} state={span.state} />
              </span>
              <q className="text-lg leading-[1.45] font-medium tracking-[-0.01em] text-pretty">{span.evidence}</q>
            </button>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
              <span className="font-semibold">
                {span.state === 'ruled_out' ? 'Nearest: ' : ''}
                {tactic.code} · {tactic.name}
              </span>
              <span className="text-ink-3">· {STATE_LABEL[span.state]}</span>
              {span.primary && (
                <span className="rounded-full border-[1.5px] border-ink px-2 py-0.5 text-[11px] font-semibold">Primary</span>
              )}
              {isSel && <span className="text-xs text-ink-3">· Isolated in transcript</span>}
            </div>
            <p className="m-0 text-[13px] leading-[1.55] text-ink-2">{span.rationale}</p>
            {span.readOtherWay && (
              <p className="m-0 border-t border-line pt-2 text-[13px] leading-[1.55] text-ink-2">
                <b className="font-semibold text-ink">Read the other way:</b> {span.readOtherWay}
              </p>
            )}
            <a
              href={href.tactic(span.tactic, index)}
              onClick={(e) => e.stopPropagation()}
              className="self-start text-xs text-ink"
            >
              Definition and near-misses →
            </a>
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
        <ol className="m-0 mb-[18px] flex list-decimal flex-col gap-1.5 rounded-xl bg-wash py-3.5 pr-3.5 pl-9 font-mono text-xs leading-[1.7]">
          {trace.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Feedback({ response, saveFailed, onRespond }: { response: ItemResponse | undefined; saveFailed: boolean; onRespond: Props['onRespond'] }) {
  const judgement = response?.judgement ?? null;
  const choice = (value: Judgement, label: string) => (
    <button
      onClick={() => onRespond({ judgement: value })}
      aria-pressed={judgement === value}
      className={`rounded-full border-[1.5px] border-ink px-4 py-2 text-[13px] font-medium ${judgement === value ? 'bg-ink text-white' : 'bg-white text-ink'}`}
    >
      {label}
    </button>
  );

  let status = 'Not answered yet. Your answer is recorded for this item only.';
  if (judgement && response) {
    status = `Saved at ${formatTime(response.updatedAt)}: you ${judgement} with this verdict. You can change it any time.`;
  } else if (response?.comment) {
    status = `Comment saved at ${formatTime(response.updatedAt)}. Choose agree or disagree to mark this item answered.`;
  }
  if (saveFailed) status = 'Could not save to this browser. Export your responses before closing the page.';

  return (
    <div className="flex flex-col gap-2.5 rounded-[22px] bg-white px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span id="judgement-label" className="text-sm text-ink-2">
          Your judgement of this verdict
        </span>
        <div className="flex gap-1.5" role="group" aria-labelledby="judgement-label">
          {choice('agree', 'Agree')}
          {choice('disagree', 'Disagree')}
        </div>
      </div>
      <label className="sr-only" htmlFor="judgement-comment">
        Optional comment
      </label>
      <textarea
        id="judgement-comment"
        value={response?.comment ?? ''}
        onChange={(e) => onRespond({ comment: e.target.value })}
        placeholder="Optional comment, e.g. which span you read differently"
        className="min-h-[58px] resize-y rounded-xl border border-line-2 bg-field px-3 py-2.5 text-[13px] leading-normal text-ink outline-none focus:border-ink"
      />
      <span className={`text-xs ${saveFailed ? 'font-semibold text-ink' : 'text-ink-3'}`} aria-live="polite">
        {status}
      </span>
    </div>
  );
}
