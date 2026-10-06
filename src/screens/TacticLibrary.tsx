import type { TacticId } from '../types';
import { VerdictIcon } from '../components/Icons';
import { TACTICS, TACTIC_BY_ID, type TacticExample } from '../data/tactics';
import { href } from '../lib/route';

interface Props {
  tactic: TacticId | null;
  fromIndex: number | null;
}

export function TacticLibrary({ tactic, fromIndex }: Props) {
  const t = (tactic && TACTIC_BY_ID[tactic]) || TACTICS[0];
  const from = fromIndex ?? undefined;

  return (
    <div className="flex flex-wrap items-start gap-4">
      <nav aria-label="Tactics" className="flex max-w-full flex-[1_1_240px] flex-col gap-1 rounded-[22px] bg-white p-3">
        {TACTICS.map((x) => {
          const active = x.id === t.id;
          return (
            <a
              key={x.id}
              href={href.tactic(x.id, from)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-start gap-2.5 rounded-[14px] p-3 text-ink no-underline ${active ? 'bg-chip' : 'hover:bg-wash'}`}
            >
              <span className="mt-0.5 rounded bg-ink px-1.5 py-0.5 font-mono text-[11px] text-white">{x.code}</span>
              <span className={`text-sm leading-snug ${active ? 'font-semibold' : ''}`}>{x.name}</span>
            </a>
          );
        })}
        {fromIndex !== null && (
          <a
            href={href.item(fromIndex)}
            className="mt-2 rounded-full bg-btn px-3.5 py-2.5 text-center text-[13px] font-medium text-ink no-underline"
          >
            ← Back to item {fromIndex + 1}
          </a>
        )}
      </nav>

      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-[22px] bg-white p-[26px]">
          <div className="flex items-center gap-2.5">
            <span className="rounded-[5px] bg-ink px-2 py-[3px] font-mono text-xs text-white">{t.code}</span>
            <span className="text-xs text-ink-3">Restriction order {t.restrictionOrder} of 6</span>
          </div>
          <h2 className="m-0 text-[30px] font-semibold tracking-[-0.02em]">{t.name}</h2>
          <p className="m-0 max-w-[720px] text-[17px] leading-[1.55] text-pretty">{t.definition}</p>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Decision rule</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RuleBox verdict="present" label="Present when" text={t.rule.present} />
              <RuleBox verdict="absent" label="Absent when" text={t.rule.absent} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Linguistic markers</span>
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {t.markers.map((m) => (
                <li key={m} className="rounded-full bg-chip px-3 py-1.5 font-mono text-xs text-ink-2">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
          <ExampleColumn title="Counts" verdict="present" tone="bg-yes" examples={t.counts} />
          <ExampleColumn title="Near-misses · do not count" verdict="absent" tone="bg-no" examples={t.nearMisses} />
        </div>

        <section className="flex flex-col gap-2 rounded-[22px] bg-white p-[22px]">
          <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Commonly confused with</span>
          <a href={href.tactic(t.confusedWith.tactic, from)} className="self-start text-[15px] font-semibold">
            {TACTIC_BY_ID[t.confusedWith.tactic].code} · {TACTIC_BY_ID[t.confusedWith.tactic].name}
          </a>
          <p className="m-0 text-sm leading-relaxed text-ink-2">{t.confusedWith.note}</p>
        </section>
      </div>
    </div>
  );
}

/** PRESENT and ABSENT conditions get identical boxes so neither reads as the default. */
function RuleBox({ verdict, label, text }: { verdict: 'present' | 'absent'; label: string; text: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border-[1.5px] border-line-2 bg-wash px-4 py-3.5">
      <span className="flex items-center gap-2 text-[13px] font-semibold">
        <VerdictIcon verdict={verdict} size={14} />
        {label}
      </span>
      <p className="m-0 font-mono text-[13px] leading-[1.7]">{text}</p>
    </div>
  );
}

function ExampleColumn({ title, verdict, tone, examples }: { title: string; verdict: 'present' | 'absent'; tone: string; examples: TacticExample[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-white p-[22px]">
      <h3 className="m-0 flex items-center gap-2 text-[15px] font-semibold">
        <VerdictIcon verdict={verdict} size={13} />
        {title}
      </h3>
      {examples.map((e) => (
        <div key={e.reply} className={`flex flex-col gap-2 rounded-2xl p-4 ${tone}`}>
          <div className="text-xs text-ink-2">User: “{e.user}”</div>
          <div className="text-[17px] leading-[1.45] font-medium">“{e.reply}”</div>
          <div className="text-[13px] leading-normal text-ink-2">{e.why}</div>
        </div>
      ))}
    </section>
  );
}
