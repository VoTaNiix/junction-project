// Seeing the other side. Each side is a demo account (js/accounts.js), and each page belongs to one
// account: another account cannot open it (see the router in app.js). Switching is explicit: the
// account menu, a "Switch to …" button in a message, or a link marked data-switch-to="<account id>".
import { ACCOUNTS, accountForRole, activate } from './accounts.js';
import { tr } from './i18n.js';
import { toast } from './ui.js';

const switchTo = (name) => tr({ en: 'Switch to {name}', fi: 'Vaihda tiliin {name}', sv: 'Byt till {name}' }, { name });

function go(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

/** Switches to the account and opens the page (its home page when no hash is given). */
export function switchAndGo(accountId, hash) {
  const acc = activate(accountId);
  if (!acc) return;
  toast(tr({ en: 'Switched to {name}.', fi: 'Vaihdettu tiliin {name}.', sv: 'Bytte till {name}.' }, { name: acc.name }));
  go(hash || acc.home);
}

/** Links marked data-switch-to="employer" (or "talent", "eventteam") switch account, then open. */
document.addEventListener('click', (e) => {
  const link = e.target.closest?.('a[data-switch-to]');
  if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
  if (!ACCOUNTS.some((a) => a.id === link.dataset.switchTo)) return;
  e.preventDefault();
  switchAndGo(link.dataset.switchTo, link.getAttribute('href'));
});

/** The account id a page hash belongs to ('#/host/feed' → 'employer'), or '' for open pages. */
export function accountIdForHash(hash) {
  const role = (hash || '').split('/')[1];
  return accountForRole(role)?.id || '';
}

/** The employer demo account, if this company is it. */
export function employerAccountFor(companyId) {
  const acc = accountForRole('host');
  return acc && acc.companyId === companyId ? acc : null;
}

/** The talent demo account, if this solver is it. */
export function talentAccountFor(participantId) {
  const acc = accountForRole('participant');
  return acc && acc.participantId === participantId ? acc : null;
}

/** Switches to the employer account on the given tab. */
export function showEmployerSide(tab = 'feed') {
  switchAndGo('employer', `#/host/${tab}`);
}

/** Switches to the talent account on the given tab (or a page like "challenge/ch-1"). */
export function showTalentSide(tab = 'meetings') {
  switchAndGo('talent', `#/participant/${tab}`);
}

/** Message action "Switch to Lumivirta Energy", or null when that company has no demo account. */
export function employerAction(companyId, tab = 'feed') {
  const acc = employerAccountFor(companyId);
  return acc ? { label: switchTo(acc.name), run: () => showEmployerSide(tab) } : null;
}

/** Message action "Switch to Sam Virtanen", or null when that solver has no demo account. */
export function talentAction(participantId, tab = 'meetings') {
  const acc = talentAccountFor(participantId);
  return acc ? { label: switchTo(acc.name), run: () => showTalentSide(tab) } : null;
}

/** Message action to the talent account, whoever acted. */
export function anyTalentAction(tab) {
  const acc = accountForRole('participant');
  return acc ? { label: switchTo(acc.name), run: () => showTalentSide(tab) } : null;
}
