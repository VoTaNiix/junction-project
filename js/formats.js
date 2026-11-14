// Collaboration formats, solver intents and working-language helpers.
// See .claude/skills/esco-multimodal-matchmaking. The four format names are product terms and
// stay the same in every interface language; their descriptions are translated.
import { tr } from './i18n.js';

export const FORMATS = [
  {
    id: 'hiring',
    label: 'Talent & Hiring',
    get short() { return tr({ en: 'Hiring', fi: 'Rekrytointi', sv: 'Rekrytering' }); },
    get hostLabel() { return tr({ en: 'Hiring / open role', fi: 'Rekrytointi / avoin tehtävä', sv: 'Rekrytering / öppen tjänst' }); },
    get desc() { return tr({ en: 'Full-time, part-time or internship roles', fi: 'Koko- tai osa-aikaiset tehtävät tai harjoittelu', sv: 'Hel- eller deltidstjänster eller praktik' }); },
  },
  {
    id: 'rnd',
    label: 'R&D & Co-Creation',
    get short() { return tr({ en: 'R&D', fi: 'T&K', sv: 'FoU' }); },
    get hostLabel() { return tr({ en: 'R&D / thesis / co-creation', fi: 'T&K / opinnäytetyö / yhteiskehittäminen', sv: 'FoU / examensarbete / samskapande' }); },
    get desc() { return tr({ en: 'Academic research, thesis work or joint R&D', fi: 'Akateeminen tutkimus, opinnäytetyö tai yhteinen T&K', sv: 'Akademisk forskning, examensarbete eller gemensam FoU' }); },
  },
  {
    id: 'pilot',
    label: 'Pilot & Project',
    get short() { return tr({ en: 'Pilot', fi: 'Pilotti', sv: 'Pilot' }); },
    get hostLabel() { return tr({ en: 'B2B pilot / project partner', fi: 'B2B-pilotti / projektikumppani', sv: 'B2B-pilot / projektpartner' }); },
    get desc() { return tr({ en: 'B2B collaboration, startup pilot or specialist consulting', fi: 'B2B-yhteistyö, startup-pilotti tai asiantuntijakonsultointi', sv: 'B2B-samarbete, startup-pilot eller expertkonsultation' }); },
  },
  {
    id: 'open',
    label: 'Open Format',
    get short() { return tr({ en: 'Open', fi: 'Avoin', sv: 'Öppen' }); },
    get hostLabel() { return tr({ en: 'Open to all', fi: 'Avoin kaikille', sv: 'Öppen för alla' }); },
    get desc() { return tr({ en: 'Open to hiring, partnering or piloting, whichever fits best', fi: 'Avoin rekrytoinnille, kumppanuudelle tai pilotille, mikä sopii parhaiten', sv: 'Öppen för rekrytering, partnerskap eller pilot, det som passar bäst' }); },
  },
];

export const FORMAT_IDS = FORMATS.map((f) => f.id);
const formatById = new Map(FORMATS.map((f) => [f.id, f]));
export const format = (id) => formatById.get(id) || { id, label: id, short: id, desc: '' };

// Self-declared by the solver for each submission. Never used to sort or filter people.
export const INTENTS = [
  {
    id: 'talent',
    format: 'hiring',
    get label() { return tr({ en: 'Individual Talent / Career Opportunity', fi: 'Yksittäinen osaaja / uramahdollisuus', sv: 'Enskild talang / karriärmöjlighet' }); },
    get short() { return tr({ en: 'Talent', fi: 'Osaaja', sv: 'Talang' }); },
    get desc() { return tr({ en: 'You are interested in a role with this host.', fi: 'Olet kiinnostunut tehtävästä tämän yrityksen palveluksessa.', sv: 'Du är intresserad av en tjänst hos den här värden.' }); },
  },
  {
    id: 'research',
    format: 'rnd',
    get label() { return tr({ en: 'Researcher / Academic / Thesis Collaboration', fi: 'Tutkija / akateeminen / opinnäytetyöyhteistyö', sv: 'Forskare / akademiker / samarbete kring examensarbete' }); },
    get short() { return tr({ en: 'Researcher', fi: 'Tutkija', sv: 'Forskare' }); },
    get desc() { return tr({ en: 'You would explore this through research, a thesis or joint R&D.', fi: 'Tutkisit tätä tutkimuksen, opinnäytetyön tai yhteisen T&K:n kautta.', sv: 'Du skulle utforska detta genom forskning, ett examensarbete eller gemensam FoU.' }); },
  },
  {
    id: 'partner',
    format: 'pilot',
    get label() { return tr({ en: 'Project / Pilot / Solution Partner', fi: 'Projekti- / pilotti- / ratkaisukumppani', sv: 'Projekt- / pilot- / lösningspartner' }); },
    get short() { return tr({ en: 'Partner', fi: 'Kumppani', sv: 'Partner' }); },
    get desc() { return tr({ en: 'You or your team would take this on as a pilot or project.', fi: 'Sinä tai tiimisi tarttuisitte tähän pilottina tai projektina.', sv: 'Du eller ditt team skulle ta er an detta som pilot eller projekt.' }); },
  },
  {
    id: 'open',
    format: 'open',
    get label() { return tr({ en: 'Open to Discussing Best Fit', fi: 'Avoin keskustelemaan parhaasta muodosta', sv: 'Öppen för att diskutera vad som passar bäst' }); },
    get short() { return tr({ en: 'Open', fi: 'Avoin', sv: 'Öppen' }); },
    get desc() { return tr({ en: 'You would like to talk first and find the right way to work together.', fi: 'Haluaisit ensin keskustella ja löytää sopivan tavan tehdä yhteistyötä.', sv: 'Du vill prata först och hitta rätt sätt att arbeta tillsammans.' }); },
  },
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
  { id: 'en', get label() { return tr({ en: 'English', fi: 'Englanti', sv: 'Engelska' }); } },
  { id: 'fi', get label() { return tr({ en: 'Finnish', fi: 'Suomi', sv: 'Finska' }); } },
  { id: 'sv', get label() { return tr({ en: 'Swedish', fi: 'Ruotsi', sv: 'Svenska' }); } },
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

// ---------- sectors (seed data and the host template use these English values) ----------
const SECTORS = {
  Energy: { fi: 'Energia', sv: 'Energi' },
  'Public sector': { fi: 'Julkinen sektori', sv: 'Offentlig sektor' },
  Manufacturing: { fi: 'Valmistava teollisuus', sv: 'Tillverkning' },
  'Deep tech': { fi: 'Syväteknologia', sv: 'Djupteknik' },
  Construction: { fi: 'Rakentaminen', sv: 'Byggande' },
  Mobility: { fi: 'Liikkuminen', sv: 'Mobilitet' },
  Health: { fi: 'Terveys', sv: 'Hälsa' },
  Education: { fi: 'Koulutus', sv: 'Utbildning' },
  SaaS: { fi: 'SaaS', sv: 'SaaS' },
  Retail: { fi: 'Kauppa', sv: 'Handel' },
  Other: { fi: 'Muu', sv: 'Annat' },
};

/** Sector name in the interface language; unknown values are shown as written. */
export function sectorLabel(value) {
  const s = SECTORS[value];
  return s ? tr({ en: value, fi: s.fi, sv: s.sv }) : value;
}

// ---------- language requirement presets (host template) ----------
// Stored on the challenge in English (t); shown in the interface language wherever it appears.
export const LANG_PRESETS = [
  { t: 'English is fine', l: ['en'], fi: 'Englanti käy', sv: 'Engelska går bra' },
  { t: 'English or Finnish', l: ['en', 'fi'], fi: 'Englanti tai suomi', sv: 'Engelska eller finska' },
  { t: 'English or Swedish', l: ['en', 'sv'], fi: 'Englanti tai ruotsi', sv: 'Engelska eller svenska' },
  { t: 'Finnish, Swedish, or English', l: ['fi', 'sv', 'en'], fi: 'Suomi, ruotsi tai englanti', sv: 'Finska, svenska eller engelska' },
  { t: 'Finnish required', l: ['fi'], fi: 'Suomen kieli vaaditaan', sv: 'Finska krävs' },
  { t: 'Swedish required', l: ['sv'], fi: 'Ruotsin kieli vaaditaan', sv: 'Svenska krävs' },
];

/** A preset requirement in the interface language; a host's own wording is shown as written. */
export function languageRequirementLabel(text) {
  const p = LANG_PRESETS.find((x) => x.t === text);
  return p ? tr({ en: p.t, fi: p.fi, sv: p.sv }) : text;
}
