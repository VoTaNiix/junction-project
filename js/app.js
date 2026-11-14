import { load, subscribe, getState, resetDemo, onServerError, isServerMode } from './store.js';
import { tabNav, toast, confirmDialog, fmtDate, esc } from './ui.js';
import * as participantView from './views/participant.js';
import * as hostView from './views/host.js';
import * as organizerView from './views/organizer.js';
import * as guideView from './views/guide.js';
import { tr, getLang, setLang } from './i18n.js';
import { ACCOUNTS, activeAccount, accountForRole, activate, avatar } from './accounts.js';
import { switchAndGo } from './sides.js';

const VIEWS = {
  participant: participantView,
  host: hostView,
  organizer: organizerView,
  guide: guideView,
};


// Old links: #/recruiter/... is now the Employer side; the Privacy & EU AI Act view and the
// sign-in page were removed.
// Pages belong to accounts (accounts.js, accountForRole): Talent → Sam Virtanen, Employer →
// Lumivirta Energy, Event team → the event team account. The guide is open to everyone.
const ROUTE_ALIASES = { recruiter: 'host', privacy: 'participant', login: 'participant' };

const main = document.getElementById('main');
const contextbar = document.getElementById('contextbar');
const accountSlot = document.getElementById('account');

const L = (en, fi, sv, vars) => tr({ en, fi, sv }, vars);

function parseRoute() {
  const [, role, tab, arg] = (location.hash || '').split('/');
  const view = VIEWS[role] ? role : null;
  return { role: view, tab: tab || null, arg: arg ? decodeURIComponent(arg) : null };
}

let lastRouteKey = '';
let menuOpen = false;

/** Header, footer and other fixed texts in index.html, in the chosen language. */
function paintChrome() {
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('skip-link', L('Skip to content', 'Siirry sisältöön', 'Hoppa till innehållet'));
  set('guide-link', L('Guide', 'Opas', 'Guide'));
  set('reset-demo', L('Reset demo data', 'Palauta demodata', 'Återställ demodata'));
  set('lang-label', L('Language', 'Kieli', 'Språk'));
  set('footer-note', L(
    'Prototype. No algorithm ranks, scores or filters people or teams. Demo data stays on this computer.',
    'Prototyyppi. Mikään algoritmi ei järjestä, pisteytä tai suodata ihmisiä tai tiimejä. Demodata pysyy tällä tietokoneella.',
    'Prototyp. Ingen algoritm rangordnar, poängsätter eller filtrerar personer eller team. Demodata stannar på den här datorn.',
  ));
  document.getElementById('home-link').setAttribute('aria-label', L('Skillink home', 'Skillink, etusivu', 'Skillink, startsida'));
  document.getElementById('ui-lang').value = getLang();
  paintAccount();
}

// ---------- account menu (switch like Google accounts) ----------
// Both demo accounts count as logged in: the menu switches between them in one click.
function paintAccount() {
  const acc = activeAccount();
  const others = ACCOUNTS.filter((a) => a.id !== acc.id);
  accountSlot.innerHTML = `
    <button type="button" class="account__btn" id="account-btn" aria-expanded="${menuOpen}" aria-controls="account-menu">
      ${avatar(acc, 28)}<span class="account__name">${esc(acc.name)}</span><span aria-hidden="true">▾</span>
      <span class="sr-only">${esc(L('Switch account', 'Vaihda tiliä', 'Byt konto'))}</span>
    </button>
    <div class="account__menu" id="account-menu" ${menuOpen ? '' : 'hidden'}>
      <div class="account__me">
        ${avatar(acc, 56)}
        <p class="account__me-name">${esc(acc.name)}</p>
        <p class="small muted">${esc(acc.subtitle)}</p>
        ${acc.person ? `<p class="small muted">${esc(acc.person)}</p>` : ''}
        <p class="small muted">${esc(acc.email)}</p>
      </div>
      <ul class="account__others" aria-label="${esc(L('Switch account', 'Vaihda tiliä', 'Byt konto'))}">
        ${others.map((a) => `<li><button type="button" class="account__other" data-switch="${esc(a.id)}">
          ${avatar(a, 32)}<span><strong>${esc(a.name)}</strong><span class="small muted">${esc(a.subtitle)}</span></span>
        </button></li>`).join('')}
      </ul>
    </div>`;
  accountSlot.querySelector('#account-btn').addEventListener('click', () => {
    menuOpen = !menuOpen;
    paintAccount();
    if (menuOpen) accountSlot.querySelector('.account__other')?.focus();
  });
  accountSlot.querySelectorAll('[data-switch]').forEach((b) =>
    b.addEventListener('click', () => {
      menuOpen = false;
      switchAndGo(b.dataset.switch);
    }),
  );
}

document.addEventListener('click', (e) => {
  // composedPath() is fixed when the click starts, so it still holds the account slot even
  // though the button that opened the menu was re-painted (and detached) in the meantime.
  if (menuOpen && !e.composedPath().includes(accountSlot)) {
    menuOpen = false;
    paintAccount();
  }
});
document.addEventListener('keydown', (e) => {
  if (menuOpen && e.key === 'Escape') {
    menuOpen = false;
    paintAccount();
    accountSlot.querySelector('#account-btn')?.focus();
  }
});

// ---------- page access ----------
// Every Talent, Employer and Event team page belongs to one account. Another account sees this
// page instead, with a button to switch (both demo accounts count as logged in).
function noAccess(owner) {
  const me = activeAccount();
  return `<section class="access panel" aria-labelledby="access-h">
    ${avatar(owner, 56)}
    <h1 id="access-h">${esc(L('This page is for {name}', 'Tämä sivu on tilille {name}', 'Den här sidan är för {name}', { name: owner.name }))}</h1>
    <p>${esc(L(
      "You're using the account {me}, which can't open it. Switch accounts to see this side of the event.",
      'Käytät tiliä {me}, jolla sitä ei voi avata. Vaihda tiliä nähdäksesi tämän puolen tapahtumasta.',
      'Du använder kontot {me}, som inte kan öppna den. Byt konto för att se den här sidan av evenemanget.',
      { me: me.name },
    ))}</p>
    <div class="row">
      <a class="btn btn--primary" href="${esc(location.hash)}" data-switch-to="${esc(owner.id)}">${esc(L('Switch to {name}', 'Vaihda tiliin {name}', 'Byt till {name}', { name: owner.name }))}</a>
      <a class="btn btn--ghost" href="${esc(me.home)}">${esc(L('Back to {name}', 'Takaisin tiliin {name}', 'Tillbaka till {name}', { name: me.name }))}</a>
    </div>
  </section>`;
}

// ---------- router ----------
function render() {
  const [, rawRole, ...rest] = (location.hash || '').split('/');
  if (ROUTE_ALIASES[rawRole]) {
    location.replace(`#/${[ROUTE_ALIASES[rawRole], ...rest].join('/')}`);
    return;
  }
  let route = parseRoute();
  // No page chosen: go to the active account's home.
  if (!route.role) {
    location.replace(activeAccount().home);
    return;
  }
  const state = getState();
  const owner = accountForRole(route.role);
  if (owner && owner.id !== activeAccount().id) {
    paintChrome();
    contextbar.innerHTML = '';
    main.innerHTML = noAccess(owner);
    document.title = `${L('Not available for this account', 'Ei käytettävissä tällä tilillä', 'Inte tillgänglig för det här kontot')}, Skillink`;
    window.scrollTo(0, 0);
    lastRouteKey = `noaccess/${location.hash}/${activeAccount().id}`;
    return;
  }

  const view = VIEWS[route.role];
  const tabs = view.tabs(state);
  const tab = tabs.some((t) => t.id === route.tab) || (view.hiddenTabs || []).includes(route.tab) ? route.tab : tabs[0].id;
  const routeKey = `${route.role}/${tab}/${route.arg || ''}/${activeAccount().id}`;
  const sameRoute = routeKey === lastRouteKey;

  // Keep focus and scroll when re-rendering the same screen after a state change.
  const focusId = sameRoute && document.activeElement && document.activeElement.id;
  const scrollY = window.scrollY;

  const guideLink = document.getElementById('guide-link');
  if (route.role === 'guide') guideLink.setAttribute('aria-current', 'page');
  else guideLink.removeAttribute('aria-current');

  paintChrome();
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
  }
  const label = (view.pageTitle?.(state, tab, route.arg) || tabs.find((t) => t.id === tab)?.label || view.hiddenTabLabels?.[tab] || '').replace(' ✓', '');
  const guide = route.role === 'guide' ? `${L('Guide', 'Opas', 'Guide')}, ` : '';
  document.title = `${label ? `${label}, ` : ''}${guide}Skillink`;
  lastRouteKey = routeKey;
}

document.getElementById('reset-demo').addEventListener('click', async () => {
  const ok = await confirmDialog({
    title: L('Reset demo data?', 'Palautetaanko demodata?', 'Återställa demodata?'),
    message: esc(L(
      'Everything you changed goes back to the original Espoo demo data. Use this between demo runs.',
      'Kaikki muutokset palautetaan Espoon alkuperäiseen demodataan. Käytä tätä demokertojen välillä.',
      'Allt du har ändrat återgår till Esbos ursprungliga demodata. Använd det mellan demokörningar.',
    )),
    confirmLabel: L('Reset demo data', 'Palauta demodata', 'Återställ demodata'),
  });
  if (!ok) return;
  resetDemo();
  activate(activeAccount().id);
  toast(L('Demo data reset to the original seed.', 'Demodata palautettu alkuperäiseksi.', 'Demodata återställd till originalet.'));
});

// Interface language: the whole page re-renders in the chosen language.
setLang(getLang());
document.getElementById('ui-lang').addEventListener('change', (e) => {
  setLang(e.target.value);
  render();
});

window.addEventListener('hashchange', render);
onServerError((msg) => toast(msg, 'error'));
await load(); // the Scala server's state if it is running, otherwise this browser's
document.documentElement.dataset.mode = isServerMode() ? 'server' : 'offline';
activate(activeAccount().id); // point the shared state at this viewer's account
subscribe(render);
render();
