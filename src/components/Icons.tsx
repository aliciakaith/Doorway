import type { Verdict } from '../types';

/**
 * Verdict shapes carry meaning without colour:
 * Present = filled square, Absent = hollow circle, Borderline = half-filled diamond.
 */
export function VerdictIcon({ verdict, size = 20 }: { verdict: Verdict; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className="shrink-0">
      {verdict === 'Present' && <rect x="0" y="0" width="20" height="20" rx="4" fill="currentColor" />}
      {verdict === 'Absent' && <circle cx="10" cy="10" r="8.75" fill="none" stroke="currentColor" strokeWidth="2.5" />}
      {verdict === 'Borderline' && (
        <>
          <polygon points="10,1.5 1.5,10 10,18.5" fill="currentColor" />
          <polygon points="10,1.5 18.5,10 10,18.5 1.5,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
