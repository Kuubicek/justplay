import { writable, derived } from 'svelte/store';

const readHash = () => window.location.hash.replace(/^#/, '') || '/';
const parseHash = (raw) => {
  const safe = raw || '/';
  const [pathPart, queryPart] = safe.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryPart || ''));
  return { path: pathPart || '/', query };
};

const routeState = writable(parseHash(readHash()));
const onHash = () => routeState.set(parseHash(readHash()));

window.addEventListener('hashchange', onHash);
window.addEventListener('load', onHash);

export const path = derived(routeState, ($route) => $route.path);
export const query = derived(routeState, ($route) => $route.query);

export const params = derived(path, ($p) => {
  const matchGame = $p.match(/^\/game\/([^/]+)$/);
  const matchProfile = $p.match(/^\/profile\/([^/]+)$/);
  return {
    gameId: matchGame ? matchGame[1] : undefined,
    profileId: matchProfile ? matchProfile[1] : undefined
  };
});

export const goto = (to) => {
  if (!to.startsWith('/')) to = '/' + to;
  window.location.hash = to;
};
