import type { Verdict } from '../types';

/**
 * Verdict shapes carry meaning without colour:
 * present = filled square, absent = hollow circle, borderline = half-filled diamond.
 */
export function VerdictIcon({ verdict, size = 20 }: { verdict: Verdict; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className="shrink-0">
      {verdict === 'present' && <rect x="0" y="0" width="20" height="20" rx="4" fill="currentColor" />}
      {verdict === 'absent' && <circle cx="10" cy="10" r="8.75" fill="none" stroke="currentColor" strokeWidth="2.5" />}
      {verdict === 'borderline' && (
        <>
          <polygon points="10,1.5 1.5,10 10,18.5" fill="currentColor" />
          <polygon points="10,1.5 18.5,10 10,18.5 1.5,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/**
 * Numbered span badge. The span's state is carried by its underline style in the transcript
 * and by the written state label on its card, so the badge itself stays uniform.
 */
export function SpanBadge({ id, dimmed = false, inline = false }: { id: number; dimmed?: boolean; inline?: boolean }) {
  return (
    <span
      className={`rounded-[4px] bg-ink font-mono text-[11px] font-medium text-white ${inline ? 'ml-[3px] px-[5px] py-px align-super' : 'px-1.5 py-0.5'} ${dimmed ? 'opacity-35' : ''}`}
    >
      {id}
    </span>
  );
}
