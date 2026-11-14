// Collaboration formats, solver intents and working-language helpers.
// See .claude/skills/esco-multimodal-matchmaking. The four format names are product terms.

export const FORMATS = [
  {
    id: 'hiring',
    label: 'Talent & Hiring',
    short: 'Hiring',
    hostLabel: 'Hiring / open role',
    desc: 'Full-time, part-time or internship roles',
  },
  {
    id: 'rnd',
    label: 'R&D & Co-Creation',
    short: 'R&D',
    hostLabel: 'R&D / thesis / co-creation',
    desc: 'Academic research, thesis work or joint R&D',
  },
  {
    id: 'pilot',
    label: 'Pilot & Project',
    short: 'Pilot',
    hostLabel: 'B2B pilot / project partner',
    desc: 'B2B collaboration, startup pilot or specialist consulting',
  },
  {
    id: 'open',
    label: 'Open Format',
    short: 'Open',
    hostLabel: 'Open to all',
    desc: 'Open to hiring, partnering or piloting, whichever fits best',
  },
];

export const FORMAT_IDS = FORMATS.map((f) => f.id);
const formatById = new Map(FORMATS.map((f) => [f.id, f]));
export const format = (id) => formatById.get(id) || { id, label: id, short: id, desc: '' };

// Self-declared by the solver for each submission. Never used to sort or filter people.
export const INTENTS = [
  { id: 'talent', label: 'Individual Talent / Career Opportunity', short: 'Talent', format: 'hiring', desc: 'You are interested in a role with this host.' },
  { id: 'research', label: 'Researcher / Academic / Thesis Collaboration', short: 'Researcher', format: 'rnd', desc: 'You would explore this through research, a thesis or joint R&D.' },
  { id: 'partner', label: 'Project / Pilot / Solution Partner', short: 'Partner', format: 'pilot', desc: 'You or your team would take this on as a pilot or project.' },
  { id: 'open', label: 'Open to Discussing Best Fit', short: 'Open', format: 'open', desc: 'You would like to talk first and find the right way to work together.' },
];
const intentById = new Map(INTENTS.map((i) => [i.id, i]));
export const intent = (id) => intentById.get(id) || intentById.get('open');

/** Which formats a conversation about this challenge can be about. Open Format accepts all four. */
export function conversationFormats(ch) {
  const f = ch.formats || ['open'];
  return f.includes('open') ? FORMAT_IDS : f;
}

/** Intents a solver may choose for a challenge. "Open to discussing" always fits. */
export function allowedIntents(ch) {
  const f = conversationFormats(ch);
  return INTENTS.filter((i) => i.id === 'open' || f.includes(i.format)).map((i) => i.id);
}

/** Default conversation format for a request or invite, from the solver's stated intent. */
export function defaultFormatFor(ch, intentId) {
  const f = conversationFormats(ch);
  const wanted = intent(intentId).format;
  if (f.includes(wanted)) return wanted;
  return (ch.formats || ['open'])[0];
}

// ---------- working languages ----------
export const WORK_LANGS = [
  { id: 'en', label: 'English' },
  { id: 'fi', label: 'Finnish' },
  { id: 'sv', label: 'Swedish' },
];

/** Derive accepted working languages from a free-text requirement (host-written challenges). */
export function languagesFromText(text) {
  const t = String(text || '').toLowerCase();
  const out = [];
  if (/english|englanti|engelska/.test(t)) out.push('en');
  if (/finnish|suomi|finska/.test(t)) out.push('fi');
  if (/swedish|ruotsi|svenska/.test(t)) out.push('sv');
  return out.length ? out : ['en'];
}
