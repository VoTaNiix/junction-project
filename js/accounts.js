// Demo accounts, switched like Google accounts: both count as logged in, and the account menu in
// the header switches between them in one click. No sign-in page and no passwords.
//   Sam Virtanen      a job seeker (Solver #ESP-4821 in the seed data)  → Talent side
//   Lumivirta Energy  a company with a challenge (host contact Katja Salmi) → Employer side
//   Event team        City of Espoo / Business Espoo event team             → Event team pages
//
// Each page belongs to one account (accountForRole): another account cannot open it, and the
// Scala server refuses actions from the wrong account (Rules.scala, AccountActions).
//
// Which account is active is a per-viewer setting in localStorage (key skillink.account).
// Profile pictures live here, never in the shared demo state, which must not hold photos or
// avatars (see FORBIDDEN_KEYS in store.js and Rules.scala). Hosts still only ever see
// "Solver #ESP-4821" until both sides agree to meet.
import { participant, company, setCurrentParticipant, setCurrentCompany, setActor } from './store.js';
import { tr } from './i18n.js';

const KEY = 'skillink.account';

// Illustrated, fictional picture for the demo job seeker.
const SAM_PICTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23cfe0f5'/%3E%3Cpath d='M12 64c2-12 10-18 20-18s18 6 20 18z' fill='%23003580'/%3E%3Cpath d='M27 40h10v8a5 5 0 0 1-10 0z' fill='%23d9a37b'/%3E%3Ccircle cx='32' cy='28' r='12' fill='%23e8b98f'/%3E%3Cpath d='M19 27c0-10 6-15 13-15s14 5 13 15c-2-5-7-8-13-8s-11 3-13 8z' fill='%235a3b26'/%3E%3Ccircle cx='27.5' cy='29' r='1.6' fill='%232b1d14'/%3E%3Ccircle cx='36.5' cy='29' r='1.6' fill='%232b1d14'/%3E%3Cpath d='M28 34.5c2.4 2 5.6 2 8 0' stroke='%238a4f34' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";

// Calendar mark for the event team.
const EVENT_PICTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23003580'/%3E%3Crect x='15' y='19' width='34' height='30' rx='4' fill='%23ffffff'/%3E%3Crect x='15' y='19' width='34' height='9' rx='3' fill='%239fc3f0'/%3E%3Crect x='22' y='14' width='4' height='10' rx='2' fill='%23ffffff'/%3E%3Crect x='38' y='14' width='4' height='10' rx='2' fill='%23ffffff'/%3E%3Cpath d='M24 38l5 5 11-11' stroke='%23003580' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

// Simple wave mark for the demo company.
const LUMI_PICTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%230b5563'/%3E%3Cpath d='M12 27c6-9 12-9 20 0s14 9 20 0' stroke='%239fd6d6' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Cpath d='M12 40c6-9 12-9 20 0s14 9 20 0' stroke='%23ffffff' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";

export const ACCOUNTS = [
  {
    id: 'talent',
    role: 'participant',
    participantId: 'p-4821',
    picture: SAM_PICTURE,
    home: '#/participant/board',
    get name() { return participant('p-4821')?.name || 'Sam Virtanen'; },
    get email() { return participant('p-4821')?.email || ''; },
    get subtitle() { return tr({ en: 'Job seeker · Talent', fi: 'Työnhakija · Osaajat', sv: 'Arbetssökande · Talanger' }); },
  },
  {
    id: 'employer',
    role: 'host',
    companyId: 'c-lumi',
    picture: LUMI_PICTURE,
    home: '#/host/feed',
    get name() { return company('c-lumi')?.name || 'Lumivirta Energy'; },
    get email() { return company('c-lumi')?.hostEmail || ''; },
    get person() {
      const c = company('c-lumi');
      return c && c.hostName ? `${c.hostName}${c.hostRole ? `, ${c.hostRole}` : ''}` : '';
    },
    get subtitle() { return tr({ en: 'Employer · Challenge host', fi: 'Työnantaja · Haasteen julkaisija', sv: 'Arbetsgivare · Värd för utmaningar' }); },
  },
  {
    id: 'eventteam',
    role: 'organizer',
    picture: EVENT_PICTURE,
    home: '#/organizer/queue',
    get name() { return tr({ en: 'Event team', fi: 'Tapahtumatiimi', sv: 'Evenemangsteamet' }); },
    email: 'events@business-espoo.example.fi',
    get subtitle() { return tr({ en: 'City of Espoo · Business Espoo', fi: 'Espoon kaupunki · Business Espoo', sv: 'Esbo stad · Business Espoo' }); },
  },
];


/** The account a page belongs to (#/participant → talent, #/host → employer, #/organizer → event
 * team), or null for pages anyone may open (the guide). */
export const accountForRole = (role) => ACCOUNTS.find((a) => a.role === role) || null;

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (ACCOUNTS.some((a) => a.id === saved)) return saved;
  } catch {
    /* fall back to the talent account */
  }
  return ACCOUNTS[0].id;
}

let active = initial();

export const activeAccount = () => ACCOUNTS.find((a) => a.id === active);

/** Makes this account the active one and points the shared demo state at it. */
export function activate(id) {
  const acc = ACCOUNTS.find((a) => a.id === id);
  if (!acc) return null;
  active = acc.id;
  setActor(acc.id); // every action sent to the server says which account sent it
  try {
    localStorage.setItem(KEY, acc.id);
  } catch {
    /* the switch still works for this page view */
  }
  if (acc.role === 'participant' && participant(acc.participantId)) setCurrentParticipant(acc.participantId, { render: false });
  if (acc.role === 'host' && company(acc.companyId)) setCurrentCompany(acc.companyId, { render: false });
  return acc;
}

/** Small round picture for an account. */
export function avatar(acc, size = 32) {
  return `<img class="avatar" src="${acc.picture}" width="${size}" height="${size}" alt="" />`;
}
