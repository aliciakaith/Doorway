import type { SpanState, Verdict } from '../types';

/**
 * Verdict shapes carry meaning without colour:
 * present = filled square, absent = hollow circle, borderline = half-filled diamond.
 */
export function VerdictIcon({ verdict, size = 20 }: { verdict: Verdict; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className="shrink-0">
      {verdict === 'present' && <rect x="2" y="2" width="16" height="16" rx="3" fill="currentColor" />}
      {verdict === 'absent' && <circle cx="10" cy="10" r="7.75" fill="none" stroke="currentColor" strokeWidth="2.5" />}
      {verdict === 'borderline' && (
        <>
          <polygon points="10,2 2,10 10,18" fill="currentColor" />
          <polygon points="10,2 18,10 10,18 2,10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/**
 * Numbered span badge. State is shown by fill and border style, never colour alone:
 * fired = solid black, contested = white with dashed border, ruled out = white with dotted border.
 */
export function SpanBadge({ id, state, muted = false }: { id: number | string; state: SpanState; muted?: boolean }) {
  const base = 'inline-flex items-center justify-center font-mono text-[11px] font-medium leading-none rounded-[4px] min-w-[18px] h-[18px] px-[4px] align-[0.35em] box-border';
  if (muted) return <span className={`${base} bg-white text-ink-4 border border-line-3`}>{id}</span>;
  if (state === 'fired') return <span className={`${base} bg-ink text-white border-[1.5px] border-ink`}>{id}</span>;
  if (state === 'contested') return <span className={`${base} bg-white text-ink border-[1.5px] border-dashed border-ink`}>{id}</span>;
  return <span className={`${base} bg-white text-ink-3 border-[1.5px] border-dotted border-ink-3`}>{id}</span>;
}
