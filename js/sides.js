// Switching between the Talent and Employer sides. One of Skillink's main demo functions is
// showing what an action looks like from the other side, so every switch tries to land on the
// matching screen: a challenge page opens that company's review dashboard, a conversation opens
// the other side's Conversations tab, and so on.
import { challenge, company, participant, setCurrentCompany, setCurrentParticipant, pseudoLabel } from './store.js';

function go(hash, select) {
  const same = location.hash === hash;
  select?.({ render: same });
  if (!same) location.hash = hash;
}

/** Opens the Employer side, acting as the given company. */
export function showEmployerSide(companyId, tab = 'feed') {
  go(`#/host/${tab}`, companyId && company(companyId) ? (o) => setCurrentCompany(companyId, o) : null);
}

/** Opens the Talent side, acting as the given demo solver. */
export function showTalentSide(participantId, tab = 'meetings') {
  go(`#/participant/${tab}`, participantId && participant(participantId) ? (o) => setCurrentParticipant(participantId, o) : null);
}

/** Toast action: "See it as Lumivirta Energy". */
export function employerAction(companyId, tab = 'feed') {
  const c = company(companyId);
  return { label: `See it as ${c ? c.name : 'the employer'}`, run: () => showEmployerSide(companyId, tab) };
}

/** Toast action: "See it as Solver #ESP-4821". */
export function talentAction(participantId, tab = 'meetings') {
  return { label: `See it as ${pseudoLabel(participantId)}`, run: () => showTalentSide(participantId, tab) };
}

/** Where the header switch should take you from the current screen. */
export function counterpart(route, target) {
  const { role, tab, arg } = route;
  if (target === 'host') {
    if (role !== 'participant') return { href: '#/host/feed' };
    const ch = (tab === 'challenge' || tab === 'write') && arg ? challenge(arg) : null;
    if (ch) return { href: '#/host/feed', run: () => showEmployerSide(ch.companyId, 'feed') };
    return { href: tab === 'meetings' ? '#/host/meetings' : '#/host/feed' };
  }
  if (target === 'participant') {
    if (role !== 'host') return { href: '#/participant/board' };
    return { href: tab === 'meetings' ? '#/participant/meetings' : '#/participant/board' };
  }
  return { href: `#/${target}` };
}
