import corpus from '../data/corpusData.json';
import { formatBehaviour, MITIGATION_LABEL } from '../lib/labels';

/** Detector labels across the collected farewells. Figures come from src/data/corpusData.json. */

interface Split {
  n: number;
  presentPct: number;
  borderlinePct: number;
  absentPct: number;
}

const COLUMNS = [MITIGATION_LABEL.low, MITIGATION_LABEL.high] as const;

const pct = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)}%`;

/** Bars share one scale per chart, rounded up to the next 5%, so small rates stay readable. */
const scaleFor = (values: number[]) => Math.max(5, Math.ceil(Math.max(...values) / 5) * 5);

export function Corpus() {
  const { provenance, verdictsByExitType, platformComparison, overall, beyondTheTaxonomy } = corpus;
  const total = overall.present + overall.borderline + overall.absent;
  const platformMax = scaleFor(platformComparison.flatMap((r) => [r.Replika, r['Character.AI']]));
  const beyondMax = scaleFor(beyondTheTaxonomy.rows.flatMap((r) => [r.Session, r.App]));

  return (
    <>
      <div role="note" className="flex flex-col gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#9a9aa0] bg-white px-4 py-3 text-[13px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold tracking-[0.04em] uppercase">Automated labels</span>
          <span className="text-ink-2">{provenance.caveat}</span>
        </div>
        <span className="text-xs text-ink-3">
          {provenance.source} {provenance.model}. Collected {provenance.collected}.
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 text-base font-semibold">Verdicts by how people left</h2>
            <span className="text-xs text-ink-3">{provenance.total} farewells</span>
          </div>
          <div className="grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] gap-2.5">
            <div />
            {COLUMNS.map((c) => (
              <div key={c} className="text-xs font-semibold text-ink-2">
                {c}
              </div>
            ))}
            {verdictsByExitType.rows.map((row) => (
              <Row key={row.key} label={row.label} cells={COLUMNS.map((c) => (row.cells as Record<string, Split>)[c])} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3.5 text-xs text-ink-2">
            <Swatch className="bg-ink" label="Present" />
            <Swatch className="hatch" label="Borderline" />
            <Swatch className="bg-[#dedee2]" label="Absent" />
          </div>
        </section>

        <section className="flex flex-col gap-3.5 rounded-[22px] bg-white p-6">
          <div className="flex flex-col gap-1">
            <h2 className="m-0 text-base font-semibold">Replika and Character.AI compared</h2>
            <span className="text-xs text-ink-3">Share of farewells where each tactic fired · bars scaled 0 to {platformMax}%</span>
          </div>
          <PairLegend a="Replika" b="Character.AI" />
          {platformComparison.map((r) => (
            <PairBars key={r.id} title={`${r.id} · ${r.name}`} a={['Replika', r.Replika]} b={['Character.AI', r['Character.AI']]} max={platformMax} />
          ))}
        </section>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 text-base font-semibold">All farewells</h2>
            <span className="text-xs text-ink-3">{total} farewells</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <Count label="Present" n={overall.present} total={total} />
            <Count label="Borderline" n={overall.borderline} total={total} />
            <Count label="Absent" n={overall.absent} total={total} />
          </div>
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]" aria-hidden="true">
            <div className="bg-ink" style={{ width: `${(overall.present / total) * 100}%` }} />
            <div className="hatch" style={{ width: `${(overall.borderline / total) * 100}%` }} />
            <div className="flex-1 bg-[#dedee2]" />
          </div>
          <div className="flex flex-col gap-1.5 border-t border-line pt-3.5">
            <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Farewells where each tactic fired</span>
            {platformComparison.map((r) => (
              <div key={r.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span>
                  {r.id} · {r.name}
                </span>
                <span className="font-mono text-xs text-ink-2">{overall.tacticCounts[r.id as keyof typeof overall.tacticCounts]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3.5 rounded-[22px] bg-white p-6">
          <div className="flex flex-col gap-1">
            <h2 className="m-0 text-base font-semibold">Beyond the taxonomy</h2>
            <span className="text-xs text-ink-3">
              {beyondTheTaxonomy.note} Share of farewells · bars scaled 0 to {beyondMax}%
            </span>
          </div>
          <PairLegend a="Ending this conversation" b="Reducing use of the app" />
          {beyondTheTaxonomy.rows.map((r) => (
            <PairBars
              key={r.label}
              title={formatBehaviour(r.label)}
              meta={`n=${r.n}`}
              a={['Ending conversation', r.Session]}
              b={['Reducing use', r.App]}
              max={beyondMax}
            />
          ))}
        </section>
      </div>
    </>
  );
}

function Row({ label, cells }: { label: string; cells: Split[] }) {
  return (
    <>
      <div className="pt-4 text-xs font-semibold text-ink-2">{label}</div>
      {cells.map((c, i) => (
        <Cell key={i} split={c} />
      ))}
    </>
  );
}

function Cell({ split }: { split: Split }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-wash p-4">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[30px] font-semibold tracking-[-0.02em]">{pct(split.presentPct)}</span>
        <span className="text-xs text-ink-2">present</span>
      </div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]" aria-hidden="true">
        <div className="bg-ink" style={{ width: `${split.presentPct}%` }} />
        <div className="hatch" style={{ width: `${split.borderlinePct}%` }} />
        <div className="flex-1 bg-[#dedee2]" />
      </div>
      <div className="flex justify-between text-xs text-ink-2">
        <span>{pct(split.borderlinePct)} borderline</span>
        <span className="font-mono">n={split.n}</span>
      </div>
    </div>
  );
}

function Count({ label, n, total }: { label: string; n: number; total: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-wash p-4">
      <span className="text-[30px] font-semibold tracking-[-0.02em]">{n}</span>
      <span className="text-xs text-ink-2">
        {label} · {pct(Math.round((n / total) * 1000) / 10)}
      </span>
    </div>
  );
}

function PairLegend({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex flex-wrap gap-3.5 text-xs text-ink-2">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-3.5 rounded-sm bg-ink" />
        {a}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="hatch-v box-border h-2 w-3.5 rounded-sm border border-ink" />
        {b}
      </span>
    </div>
  );
}

interface PairBarsProps {
  title: string;
  meta?: string;
  a: [string, number];
  b: [string, number];
  max: number;
}

function PairBars({ title, meta, a, b, max }: PairBarsProps) {
  return (
    <div className="flex flex-col gap-[5px]">
      <span className="flex justify-between gap-2 text-[13px] font-medium">
        {title}
        {meta && <span className="font-mono text-[11px] font-normal text-ink-3">{meta}</span>}
      </span>
      <div className="grid grid-cols-[120px_1fr_40px] items-center gap-2 text-[11px] text-ink-2">
        <span>{a[0]}</span>
        <div className="h-2 rounded bg-chip">
          <div className="h-2 rounded bg-ink" style={{ width: `${(a[1] / max) * 100}%` }} />
        </div>
        <span className="text-right font-mono">{pct(a[1])}</span>
        <span>{b[0]}</span>
        <div className="h-2 rounded bg-chip">
          {b[1] > 0 && <div className="hatch-v box-border h-2 rounded border border-ink" style={{ width: `${(b[1] / max) * 100}%` }} />}
        </div>
        <span className="text-right font-mono">{pct(b[1])}</span>
      </div>
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-3.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
