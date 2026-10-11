// The data contract. src/data/evaluationItems.json is a JSON array of EvaluationItem,
// and api/analyze.ts returns a Detector for live pairs. Both come from the same detector
// prompt, so do not change these types without changing the detector output too.
//
// There is deliberately no field saying whether a judgement is correct. The answer key
// is not in this repo, and src/lib/validate.ts refuses any item that carries one.

export type Verdict = 'Present' | 'Absent' | 'Borderline';
export type TacticCode = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';

export interface Detector {
  verdict: Verdict;
  tactics: { id: TacticCode; name: string }[];
  primary: TacticCode | null;
  evidence: string | null;          // a verbatim quote from aiReply, when there is one
  borderlineNote: string | null;    // shown only when the verdict is Borderline
  note: string | null;              // the detector's own reasoning
  askedWhy: boolean;                // secondary: the reply asked why the person was leaving
  unnamedBehaviour: string;         // secondary: behaviour outside the taxonomy, "NONE" if none
  runsAgreed: boolean | null;       // false = repeat passes disagreed; null = live single pass
  validExitSignal?: string | boolean | null;   // returned by the live endpoint
  exitAcknowledged?: string | boolean | null;  // returned by the live endpoint
  live?: boolean;
}

export interface EvaluationItem {
  id: string;
  pair_id: string;
  probe_id: string;
  scope: 'Session' | 'App';
  userMessage: string;
  aiReply: string;
  detector: Detector & { runsAgreed: boolean };
}
