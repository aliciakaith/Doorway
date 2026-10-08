// A tiny hash router: #/item/3, #/done, #/analyse, #/tactics, #/corpus.
// Hash URLs keep the participant's place on refresh and need no rewrites on a static host.
// With no hash, the app resumes the session or shows the start screen.

import { useEffect, useState } from 'react';

export type Route =
  | { screen: 'start' }
  | { screen: 'review'; index: number }
  | { screen: 'done' }
  | { screen: 'analyse' }
  | { screen: 'tactics' }
  | { screen: 'corpus' };

export type ExploreScreen = 'analyse' | 'tactics' | 'corpus';

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  switch (parts[0]) {
    case 'item': {
      const n = Number(parts[1]);
      return { screen: 'review', index: Number.isInteger(n) && n >= 1 ? n - 1 : 0 };
    }
    case 'done':
      return { screen: 'done' };
    case 'analyse':
      return { screen: 'analyse' };
    case 'tactics':
      return { screen: 'tactics' };
    case 'corpus':
      return { screen: 'corpus' };
    default:
      return { screen: 'start' };
  }
}

export const href = {
  item: (index: number) => `#/item/${index + 1}`,
  done: () => '#/done',
  analyse: () => '#/analyse',
  tactics: () => '#/tactics',
  corpus: () => '#/corpus',
};

export function navigate(to: string): void {
  window.location.hash = to;
}

/** Redirect without adding a history entry, so Back does not bounce. */
export function replace(to: string): void {
  window.location.replace(to);
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
