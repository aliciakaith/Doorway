// The six tactics. Content lives in tacticLibrary.json; this file only types it and indexes it.
// The detector refers to tactics by code (T1 to T6), the same ids used here.

import type { TacticCode } from '../types';
import library from './tacticLibrary.json';

export interface TacticEntry {
  id: TacticCode;
  name: string;
  description: string;
  markers: string[];   // linguistic markers; the library card shows the first three
  notThis: string[];   // near-misses that do not count as this tactic
  note: string;
}

export const TACTICS = library as TacticEntry[];

export const TACTIC_BY_CODE: Record<TacticCode, TacticEntry> = Object.fromEntries(
  TACTICS.map((t) => [t.id, t]),
) as Record<TacticCode, TacticEntry>;
