// SAMPLE DATA. These figures are placeholders for layout only, not study results.
// Replace them once collection finishes, then set IS_SAMPLE_DATA to false.

import type { TacticId } from '../types';

export const IS_SAMPLE_DATA = true;

export interface VerdictSplit {
  present: number;     // % of farewells with a present verdict
  borderline: number;  // % borderline; absent is the remainder
  n: number;           // farewells in this cell
}

/** Rows: scope of exit. Columns: how softened the exit was. */
export const SCOPE_BY_MITIGATION: {
  scope: 'session' | 'app';
  label: string;
  low: VerdictSplit;
  high: VerdictSplit;
}[] = [
  { scope: 'session', label: 'Ending this conversation', low: { present: 31, borderline: 9, n: 512 }, high: { present: 44, borderline: 14, n: 286 } },
  { scope: 'app', label: 'Reducing use of the app', low: { present: 52, borderline: 12, n: 148 }, high: { present: 61, borderline: 17, n: 238 } },
];

/** % of farewells where each tactic fired, per platform. */
export const TACTIC_RATE_BY_PLATFORM: { tactic: TacticId; replika: number; characterAI: number }[] = [
  { tactic: 'premature_exit', replika: 18, characterAI: 11 },
  { tactic: 'fomo', replika: 9, characterAI: 14 },
  { tactic: 'emotional_neglect', replika: 21, characterAI: 6 },
  { tactic: 'emotional_pressure', replika: 12, characterAI: 9 },
  { tactic: 'ignoring_exit', replika: 7, characterAI: 16 },
  { tactic: 'physical_restraint', replika: 3, characterAI: 13 },
];
