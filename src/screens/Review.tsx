import type { ConversationItem, TacticId } from '../types';
import type { ItemResponse, Judgement } from '../lib/storage';
import { Result } from './Result';

interface Props {
  item: ConversationItem;
  index: number;
  answered: boolean[];
  response: ItemResponse | undefined;
  saveFailed: boolean;
  onRespond: (patch: { judgement?: Judgement; comment?: string }) => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenLimits: () => void;
  onOpenTactic: (id: TacticId) => void;
}

/** One conversation in the session: progress bar, the analysis, and the fixed answer bar. */
export function Review({ item, index, answered, response, saveFailed, onRespond, onPrev, onNext, onOpenLimits, onOpenTactic }: Props) {
  const total = answered.length;
  return (
    <>
      <div className="sticky top-0 z-10 -mx-9 flex flex-wrap items-center gap-5 border-b border-[#e1e1e4] bg-shell px-9 py-4">
        <span className="text-sm font-semibold whitespace-nowrap">
          Conversation {index + 1} of {total}
        </span>
        {/* Answered state only. The bar never hints at a verdict or at which items are expected to be right. */}
        <div className="grid w-[320px] max-w-full gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
          {answered.map((a, i) => (
            <div
              key={i}
              title={`Conversation ${i + 1}: ${a ? 'answered' : 'not yet answered'}`}
              className={`h-1.5 rounded-[3px] ${a ? 'bg-ink' : 'bg-line-2'} ${i === index ? 'shadow-[0_0_0_2px_#f4f4f5,0_0_0_3.5px_#141414]' : ''}`}
            />
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={onOpenLimits} className="border-0 bg-transparent p-0 text-[13px] text-ink-2 underline">
          What this tool cannot do
        </button>
      </div>

      <Result key={item.id} item={item} stickyTop="72px" onOpenTactic={onOpenTactic} />

      <AnswerBar
        index={index}
        total={total}
        response={response}
        saveFailed={saveFailed}
        onRespond={onRespond}
        onPrev={onPrev}
        onNext={onNext}
      />
    </>
  );
}

interface AnswerBarProps {
  index: number;
  total: number;
  response: ItemResponse | undefined;
  saveFailed: boolean;
  onRespond: Props['onRespond'];
  onPrev: () => void;
  onNext: () => void;
}

function AnswerBar({ index, total, response, saveFailed, onRespond, onPrev, onNext }: AnswerBarProps) {
  const judgement = response?.judgement ?? null;
  const status = saveFailed
    ? 'Could not save to this browser. Export your responses before closing the page.'
    : judgement
      ? 'Saved. You can change it.'
      : '';

  const choice = (value: Judgement, label: string) => (
    <button
      onClick={() => onRespond({ judgement: value })}
      aria-pressed={judgement === value}
      className={`w-[132px] rounded-full border-[1.5px] border-white py-[11px] text-sm font-medium ${judgement === value ? 'bg-white text-ink' : 'bg-transparent text-white'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed right-0 bottom-0 left-0 z-[15] flex flex-col gap-3 border-t-4 border-ink bg-bar px-9 py-[18px] text-white shadow-[0_-10px_34px_rgba(20,20,20,0.18)] md:left-[248px]">
      <div className="flex flex-wrap items-center gap-4">
        <span id="judgement-label" className="text-[17px] font-semibold">
          Do you agree with this judgement?
        </span>
        <div className="flex gap-2" role="group" aria-labelledby="judgement-label">
          {choice('agree', 'Agree')}
          {choice('disagree', 'Disagree')}
        </div>
        <span className={`text-xs ${saveFailed ? 'font-semibold text-white' : 'text-[#c9c9ce]'}`} aria-live="polite">
          {status}
        </span>
        <div className="flex-1" />
        <div className="h-7 w-px bg-[#3a3a40]" aria-hidden="true" />
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="rounded-full border-0 bg-bar-2 px-[18px] py-[11px] text-[13px] font-medium text-white disabled:opacity-40"
        >
          ← Previous
        </button>
        <button onClick={onNext} className="rounded-full border-0 bg-bar-2 px-[22px] py-[11px] text-[13px] font-medium text-white">
          {index < total - 1 ? 'Next →' : 'Finish →'}
        </button>
      </div>
      {(judgement || response?.comment) && (
        <>
          <label className="sr-only" htmlFor="judgement-comment">
            Optional comment
          </label>
          <textarea
            id="judgement-comment"
            value={response?.comment ?? ''}
            onChange={(e) => onRespond({ comment: e.target.value })}
            placeholder="Optional comment, e.g. which part you read differently"
            className="min-h-11 resize-y rounded-xl border border-bar-line bg-bar-3 px-3 py-2.5 text-[13px] leading-normal text-white outline-none placeholder:text-[#9a9aa0] focus:border-white"
          />
        </>
      )}
    </div>
  );
}
