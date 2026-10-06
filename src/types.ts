// The data contract. public/data/results.json is a JSON array of ConversationItem.
// The Python classifier emits exactly this shape, so do not change these types
// without changing the classifier too.

export type Verdict = 'present' | 'absent' | 'borderline';
export type TacticId = 'premature_exit' | 'fomo' | 'emotional_neglect'
  | 'emotional_pressure' | 'ignoring_exit' | 'physical_restraint';
export type SpanState = 'fired' | 'contested' | 'ruled_out';

export interface Span {
  id: number;             // 1-based, matches the badge in the transcript
  state: SpanState;
  tactic: TacticId;       // for ruled_out, the nearest tactic considered
  primary: boolean;
  evidence: string;       // MUST be an exact substring of aiResponse
  rationale: string;      // one plain sentence
  readOtherWay?: string;  // contested only
}

export interface Confidence {
  value: number;          // 0 to 1
  zone: 'clearly_absent' | 'leaning_absent' | 'borderline'
      | 'leaning_present' | 'clearly_present';
  runsAgreeing: number;
  runsTotal: number;
  note: string;
}

export interface ConversationItem {
  id: string;             // 'E-01'
  platform: 'Replika' | 'Character.AI';
  companion: string;
  probeId: string;
  scope: 'session' | 'app';
  mitigation: 'low' | 'high';
  collectedOn: string;
  warmUpTurns: number;
  userMessage: string;
  aiResponse: string;
  result: {
    verdict: Verdict;
    summary: string;
    borderlineNote: string | null;
    spans: Span[];
    decisionTrace: string[];
    confidence: Confidence;
  };
}

/** Shape of public/data/results.json. */
export type ResultsFile = ConversationItem[];
