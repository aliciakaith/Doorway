// Responses live in memory only (no localStorage or sessionStorage). Each change is also
// sent to /api/responses so a closed tab does not lose the session, and the participant
// exports everything as JSON at the end.

export type Judgement = 'agree' | 'disagree';

export interface ItemResponse {
  itemId: string;
  shownOrder: number;            // 1-based position this participant saw it at
  judgement: Judgement | null;
  comment: string;
  timeOnItemSeconds: number;
}

export type ResponseMap = Record<string, ItemResponse>;

export function emptyResponse(itemId: string, shownOrder: number): ItemResponse {
  return { itemId, shownOrder, judgement: null, comment: '', timeOnItemSeconds: 0 };
}
