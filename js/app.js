import { load, subscribe, getState, resetDemo, onServerError, isServerMode } from './store.js';
import { tabNav, toast, confirmDialog, fmtDate } from './ui.js';
import * as participantView from './views/participant.js';
import * as hostView from './views/host.js';
import * as organizerView from './views/organizer.js';
import * as guideView from './views/guide.js';
import { counterpart } from './sides.js';

const VIEWS = {
  participant: participantView,
  host: hostView,
  organizer: organizerView,
  guide: guideView,
};

// Old links: #/recruiter/... is now the Employer side; the Privacy & EU AI Act view was removed.
const ROUTE_ALIASES = { recruiter: 'host', privacy: 'participant' };

const main = document.getElementById('main');
const contextbar = document.getElementById('contextbar');
const roles = document.getElementById('roles');

function parseRoute() {
  const [, role, tab, arg] = (location.hash || '').split('/');
  const view = VIEWS[role] ? role : 'participant';
  return { role: view, tab: tab || null, arg: arg ? decodeURIComponent(arg) : null };
}

let lastRouteKey = '';
let currentRoute = { role: 'participant', tab: 'board', arg: null };

// Switching sides from a challenge also selects that challenge's company on the Employer side.
roles.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-role]');
  if (!a || a.dataset.role === currentRoute.role) return;
  const target = counterpart(currentRoute, a.dataset.role);
  if (!target.run) return; // a plain link is enough
  e.preventDefault();
  target.run();
});

function render() {
  const [, rawRole, ...rest] = (location.hash || '').split('/');
  if (ROUTE_ALIASES[rawRole]) {
    location.replace(`#/${[ROUTE_ALIASES[rawRole], ...rest].join('/')}`);
    return;
  }
  const state = getState();
  const route = parseRoute();
  const view = VIEWS[route.role];
  const tabs = view.tabs(state);
  const tab = tabs.some((t) => t.id === route.tab) || (view.hiddenTabs || []).includes(route.tab) ? route.tab : tabs[0].id;
  const routeKey = `${route.role}/${tab}/${route.arg || ''}`;
  const sameRoute = routeKey === lastRouteKey;

  // Keep focus and scroll when re-rendering the same screen after a state change.
  const focusId = sameRoute && document.activeElement && document.activeElement.id;
  const scrollY = window.scrollY;

  // Talent / Employer switch: each link points at the matching screen on the other side.
  roles.querySelectorAll('a').forEach((a) => {
    const current = a.dataset.role === route.role;
    if (current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
    a.href = current ? location.hash : counterpart({ ...route, tab }, a.dataset.role).href;
  });
  [['guide-link', 'guide'], ['organizer-link', 'organizer']].forEach(([id, role]) => {
    const link = document.getElementById(id);
    if (route.role === role) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  currentRoute = { ...route, tab };

  contextbar.innerHTML = `<div class="persona">${view.context(state)}</div>${tabNav(route.role, tabs, tab)}`;
  main.innerHTML = view.render(state, tab, route.arg);
  const ctx = { tab, arg: route.arg, rerender: render };
  view.bind?.(main, ctx);
  view.bindContext?.(contextbar, ctx);

  document.getElementById('footer-event').textContent = `${state.event.name}, ${fmtDate(state.event.date, { weekday: true, year: true })}, ${state.event.venue}`;

  if (sameRoute) {
    window.scrollTo(0, scrollY);
    if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
  } else {
    window.scrollTo(0, 0);
    if (lastRouteKey) main.focus({ preventScroll: true });
    const label = (view.pageTitle?.(state, tab, route.arg) || tabs.find((t) => t.id === tab)?.label || view.hiddenTabLabels?.[tab] || '').replace(' ✓', '');
    document.title = `${label ? `${label}, ` : ''}${route.role === 'guide' ? 'Guide, ' : ''}Skillink`;
  }
  lastRouteKey = routeKey;
}

document.getElementById('reset-demo').addEventListener('click', async () => {
  const ok = await confirmDialog({
    title: 'Reset demo data?',
    message: 'Everything you changed goes back to the original Espoo demo data. Use this between demo runs.',
    confirmLabel: 'Reset demo data',
  });
  if (!ok) return;
  resetDemo();
  toast('Demo data reset to the original seed.');
});

window.addEventListener('hashchange', render);
onServerError((msg) => toast(msg, 'error'));
await load(); // the Scala server's state if it is running, otherwise this browser's
document.documentElement.dataset.mode = isServerMode() ? 'server' : 'offline';
subscribe(render);
render();
