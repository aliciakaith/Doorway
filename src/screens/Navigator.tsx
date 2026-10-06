import type { ConversationItem } from '../types';
import { excerpt } from '../lib/labels';
import { href } from '../lib/route';

interface Props {
  items: ConversationItem[];
  answered: boolean[];
  currentIndex: number;
}

/** The fixed evaluation set. Never shows the verdict. */
export function Navigator({ items, answered, currentIndex }: Props) {
  const firstOpen = answered.findIndex((a) => !a);
  const resumeAt = firstOpen === -1 ? currentIndex : firstOpen;

  return (
    <div className="flex flex-col gap-[18px] rounded-[22px] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold">Fixed order</span>
          <span className="text-[13px] text-ink-3">
            Every participant sees these {items.length} conversations in the same order. You can revisit and change an answer.
          </span>
        </div>
        <a
          href={href.item(resumeAt)}
          className="rounded-full bg-ink px-5 py-[11px] text-[13px] font-medium text-white no-underline hover:text-white"
        >
          {firstOpen === -1 ? `Return to item ${resumeAt + 1}` : `Continue at item ${resumeAt + 1}`}
        </a>
      </div>

      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-0">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={href.item(i)}
              aria-current={i === currentIndex ? 'true' : undefined}
              className={`flex h-full flex-col gap-3.5 rounded-[18px] border-[1.5px] bg-wash p-[18px] text-ink no-underline ${i === currentIndex ? 'border-ink' : 'border-transparent hover:border-line-2'}`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[28px] font-semibold tracking-[-0.02em]">{i + 1}</span>
                <span className="font-mono text-[11px] text-ink-3">{item.id}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{item.platform}</span>
                <span className="text-[13px] leading-snug text-ink-2">“{excerpt(item.userMessage, 70)}”</span>
              </div>
              <div className="mt-auto flex items-center gap-[7px] text-xs">
                <span
                  className={`box-border h-2.5 w-2.5 rounded-full ${answered[i] ? 'bg-ink' : 'border-[1.5px] border-ink-4 bg-white'}`}
                  aria-hidden="true"
                />
                {answered[i] ? 'Answered' : 'Not yet answered'}
              </div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
