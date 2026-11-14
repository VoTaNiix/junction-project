import { load, subscribe, getState, resetDemo } from './store.js';
import { tabNav, toast, confirmDialog, fmtDate } from './ui.js';
import * as participantView from './views/participant.js';
import * as recruiterView from './views/recruiter.js';
import * as organizerView from './views/organizer.js';
import * as privacyView from './views/privacy.js';
import * as guideView from './views/guide.js';

const VIEWS = {
  participant: participantView,
  recruiter: recruiterView,
  organizer: organizerView,
  privacy: privacyView,
  guide: guideView,
};

const main = document.getElementById('main');
const contextbar = document.getElementById('contextbar');
const roles = document.getElementById('roles');

function parseRoute() {
  const [, role, tab, arg] = (location.hash || '').split('/');
  const view = VIEWS[role] ? role : 'participant';
  return { role: view, tab: tab || null, arg: arg ? decodeURIComponent(arg) : null };
}

let lastRouteKey = '';

function render() {
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

  roles.querySelectorAll('a').forEach((a) => {
    if (a.dataset.role === route.role) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const guideLink = document.getElementById('guide-link');
  if (route.role === 'guide') guideLink.setAttribute('aria-current', 'page');
  else guideLink.removeAttribute('aria-current');

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
    const label = (tabs.find((t) => t.id === tab)?.label || view.hiddenTabLabels?.[tab] || '').replace(' ✓', '');
    document.title = `${label ? `${label}, ` : ''}${route.role === 'guide' ? 'Guide, ' : ''}Skillink`;
  }
  lastRouteKey = routeKey;
}

document.getElementById('reset-demo').addEventListener('click', async () => {
  const ok = await confirmDialog({
    title: 'Reset demo data?',
    message: 'Everything you changed in this browser goes back to the original Espoo demo data. Use this between demo runs.',
    confirmLabel: 'Reset demo data',
  });
  if (!ok) return;
  resetDemo();
  toast('Demo data reset to the original seed.');
});

window.addEventListener('hashchange', render);
load();
subscribe(render);
render();
