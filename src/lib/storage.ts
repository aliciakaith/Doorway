// Participant code and answers live in localStorage so a refresh mid-session loses nothing.
// Answers are keyed by participant code, then by item id (not position).

export type Judgement = 'agree' | 'disagree';

export interface ItemResponse {
  itemId: string;
  judgement: Judgement | null;
  comment: string;
  firstAnsweredAt: string | null;
  updatedAt: string;
  judgementHistory: { judgement: Judgement; at: string }[];
}

export type ResponseMap = Record<string, ItemResponse>;

const PARTICIPANT_KEY = 'doorway:participant';
const responsesKey = (code: string) => `doorway:responses:${code}`;

export function storageWorks(): boolean {
  try {
    const probe = 'doorway:probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function loadParticipant(): string | null {
  try {
    return localStorage.getItem(PARTICIPANT_KEY);
  } catch {
    return null;
  }
}

export function saveParticipant(code: string): void {
  try {
    localStorage.setItem(PARTICIPANT_KEY, code);
  } catch {
    // storageWorks() drives the visible warning in the sidebar
  }
}

/** "Researcher: open without a session". Answers stay stored under their code. */
export function clearParticipant(): void {
  try {
    localStorage.removeItem(PARTICIPANT_KEY);
  } catch {
    // nothing to clear if storage is blocked
  }
}

export function loadResponses(code: string): ResponseMap {
  try {
    const raw = localStorage.getItem(responsesKey(code));
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as ResponseMap) : {};
  } catch {
    return {};
  }
}

/** Returns false if the write failed, so the UI can say so. */
export function saveResponses(code: string, responses: ResponseMap): boolean {
  try {
    localStorage.setItem(responsesKey(code), JSON.stringify(responses));
    return true;
  } catch {
    return false;
  }
}

export function emptyResponse(itemId: string): ItemResponse {
  return { itemId, judgement: null, comment: '', firstAnsweredAt: null, updatedAt: new Date().toISOString(), judgementHistory: [] };
}

export function applyPatch(prev: ItemResponse, patch: { judgement?: Judgement; comment?: string }): ItemResponse {
  const now = new Date().toISOString();
  const next: ItemResponse = { ...prev, updatedAt: now };
  if (patch.comment !== undefined) next.comment = patch.comment;
  if (patch.judgement !== undefined && patch.judgement !== prev.judgement) {
    next.judgement = patch.judgement;
    next.firstAnsweredAt = prev.firstAnsweredAt ?? now;
    next.judgementHistory = [...prev.judgementHistory, { judgement: patch.judgement, at: now }];
  }
  return next;
}
