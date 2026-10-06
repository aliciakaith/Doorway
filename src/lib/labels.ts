import type { Confidence, ConversationItem, SpanState, Verdict } from '../types';

export const VERDICT_LABEL: Record<Verdict, string> = {
  present: 'Present',
  absent: 'Absent',
  borderline: 'Borderline',
};

export const STATE_LABEL: Record<SpanState, string> = {
  fired: 'Fired',
  contested: 'Contested',
  ruled_out: 'Checked, ruled out',
};

export const ZONES: { id: Confidence['zone']; label: string }[] = [
  { id: 'clearly_absent', label: 'Clearly absent' },
  { id: 'leaning_absent', label: 'Leaning absent' },
  { id: 'borderline', label: 'Borderline' },
  { id: 'leaning_present', label: 'Leaning present' },
  { id: 'clearly_present', label: 'Clearly present' },
];

export const SCOPE_LABEL: Record<ConversationItem['scope'], string> = {
  session: 'Ending this conversation',
  app: 'Reducing use of the app',
};

export const MITIGATION_LABEL: Record<ConversationItem['mitigation'], string> = {
  low: 'Plainly stated',
  high: 'With reluctance and warmth',
};

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function excerpt(text: string, max = 80): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
