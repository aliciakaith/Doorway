// A tiny hash router: #/set, #/item/3, #/tactics/fomo?from=3, #/analyse, #/corpus.
// Hash URLs keep the participant's place on refresh and need no rewrites on a static host.

import { useEffect, useState } from 'react';
import type { TacticId } from '../types';

export type Route =
  | { screen: 'set' }
  | { screen: 'result'; index: number }
  | { screen: 'tactics'; tactic: TacticId | null; from: number | null }
  | { screen: 'analyse' }
  | { screen: 'corpus' };

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  switch (parts[0]) {
    case 'item': {
      const n = Number(parts[1]);
      return { screen: 'result', index: Number.isInteger(n) && n >= 1 ? n - 1 : 0 };
    }
    case 'tactics': {
      const from = Number(new URLSearchParams(query).get('from'));
      return {
        screen: 'tactics',
        tactic: (parts[1] as TacticId | undefined) ?? null,
        from: Number.isInteger(from) && from >= 1 ? from - 1 : null,
      };
    }
    case 'analyse':
      return { screen: 'analyse' };
    case 'corpus':
      return { screen: 'corpus' };
    default:
      return { screen: 'set' };
  }
}

export const href = {
  set: () => '#/set',
  item: (index: number) => `#/item/${index + 1}`,
  tactic: (id: TacticId, fromIndex?: number) => `#/tactics/${id}${fromIndex !== undefined ? `?from=${fromIndex + 1}` : ''}`,
  analyse: () => '#/analyse',
  corpus: () => '#/corpus',
};

export function navigate(to: string): void {
  window.location.hash = to;
}

export function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parseRoute(hash);
}
