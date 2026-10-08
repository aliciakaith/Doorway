import { IS_SAMPLE_DATA, SCOPE_BY_MITIGATION, TACTIC_RATE_BY_PLATFORM, type VerdictSplit } from '../data/corpus';
import { TACTIC_BY_ID } from '../data/tactics';
import { MITIGATION_LABEL } from '../lib/labels';

/** Front end only. Figures come from src/data/corpus.ts. */
export function Corpus() {
  const total = SCOPE_BY_MITIGATION.reduce((sum, row) => sum + row.low.n + row.high.n, 0);
  const maxRate = Math.max(25, ...TACTIC_RATE_BY_PLATFORM.flatMap((r) => [r.replika, r.characterAI]));
  const tag = IS_SAMPLE_DATA ? ' · sample' : '';

  return (
    <>
      {IS_SAMPLE_DATA && (
        <div role="note" className="flex flex-wrap items-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-[#9a9aa0] bg-white px-4 py-3 text-[13px]">
          <span className="text-xs font-semibold tracking-[0.04em] uppercase">Sample data</span>
          <span className="text-ink-2">Figures on this page are illustrative placeholders, not study results.</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 text-base font-semibold">Verdicts by how people left</h2>
            <span className="text-xs text-ink-3">
              {total.toLocaleString('en-GB')} farewells{tag}
            </span>
          </div>
          <div className="grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] gap-2.5">
            <div />
            <div className="text-xs font-semibold text-ink-2">{MITIGATION_LABEL.low}</div>
            <div className="text-xs font-semibold text-ink-2">{MITIGATION_LABEL.high}</div>
            {SCOPE_BY_MITIGATION.map((row) => (
              <Row key={row.scope} label={row.label} low={row.low} high={row.high} />
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
            <span className="text-xs text-ink-3">Share of farewells where each tactic fired{tag}</span>
          </div>
          <div className="flex gap-3.5 text-xs text-ink-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3.5 rounded-sm bg-ink" />
              Replika
            </span>
            <span className="flex items-center gap-1.5">
              <span className="hatch-v box-border h-2 w-3.5 rounded-sm border border-ink" />
              Character.AI
            </span>
          </div>
          {TACTIC_RATE_BY_PLATFORM.map((r) => {
            const t = TACTIC_BY_ID[r.tactic];
            return (
              <div key={r.tactic} className="flex flex-col gap-[5px]">
                <span className="text-[13px] font-medium">
                  {t.code} · {t.name}
                </span>
                <div className="grid grid-cols-[86px_1fr_34px] items-center gap-2 text-[11px] text-ink-2">
                  <span>Replika</span>
                  <div className="h-2 rounded bg-chip">
                    <div className="h-2 rounded bg-ink" style={{ width: `${(r.replika / maxRate) * 100}%` }} />
                  </div>
                  <span className="text-right font-mono">{r.replika}%</span>
                  <span>Character.AI</span>
                  <div className="h-2 rounded bg-chip">
                    <div className="hatch-v box-border h-2 rounded border border-ink" style={{ width: `${(r.characterAI / maxRate) * 100}%` }} />
                  </div>
                  <span className="text-right font-mono">{r.characterAI}%</span>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}

function Row({ label, low, high }: { label: string; low: VerdictSplit; high: VerdictSplit }) {
  return (
    <>
      <div className="pt-4 text-xs font-semibold text-ink-2">{label}</div>
      <Cell split={low} />
      <Cell split={high} />
    </>
  );
}

function Cell({ split }: { split: VerdictSplit }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-wash p-4">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[30px] font-semibold tracking-[-0.02em]">{split.present}%</span>
        <span className="text-xs text-ink-2">present</span>
      </div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]" aria-hidden="true">
        <div className="bg-ink" style={{ width: `${split.present}%` }} />
        <div className="hatch" style={{ width: `${split.borderline}%` }} />
        <div className="flex-1 bg-[#dedee2]" />
      </div>
      <div className="flex justify-between text-xs text-ink-2">
        <span>{split.borderline}% borderline</span>
        <span className="font-mono">n={split.n}</span>
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
