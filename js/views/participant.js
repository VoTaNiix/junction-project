import { esc, fmtDate, fmtDateTime, toast, openDialog, confirmDialog, LANGS, richText } from '../ui.js';
import { skill } from '../esco.js';
import {
  getState, currentParticipant, challenge, company, activeRequestCount, REQUEST_CAP, requestMeeting,
  respondToMeeting, cancelMeeting, toggleBookmark, findSubmission, saveSubmission, withdrawSubmission,
  deleteDraft, freeSlots, existingMeeting, isConfirmed, setFeedback, createParticipant, feedbackOutcome,
  deleteParticipantData, meeting,
} from '../store.js';
import { FORMATS, INTENTS, WORK_LANGS, format as fmtOf, allowedIntents, defaultFormatFor, sectorLabel, languageRequirementLabel } from '../formats.js';
import { challengeCard, challengePreview, consentNotice, quotaBar, statusPill, slotLabel, placeLabel, PARTS, ICON, langBadge, verifiedBadge, formatBadges, formatBadge, intentBadge, formatChoice } from './shared.js';
import { buildIcs, downloadFile } from '../exports.js';
import { employerAction, showEmployerSide } from '../sides.js';
import { tr } from '../i18n.js';

/** Interface text in English, Finnish and Swedish. */
const L = (en, fi, sv, vars) => tr({ en, fi, sv }, vars);

export const hiddenTabs = ['write', 'challenge'];
export const hiddenTabLabels = {
  get write() { return L('Show your thinking', 'Näytä ajattelusi', 'Visa ditt tänkande'); },
  get challenge() { return L('Challenge', 'Haaste', 'Utmaning'); },
};

const BOARD = () => L('Problem board', 'Haastetaulu', 'Utmaningstavlan');

/** Browser tab title for a challenge page. */
export function pageTitle(state, tab, arg) {
  const ch = (tab === 'challenge' || tab === 'write') && arg ? challenge(arg) : null;
  if (!ch) return '';
  return tab === 'write' ? `${hiddenTabLabels.write}: ${ch.title}` : ch.title;
}

export function tabs(state) {
  const p = currentParticipant();
  const invites = p ? state.meetings.filter((m) => m.participantId === p.id && m.partyStatus === 'invited').length : 0;
  return [
    { id: 'board', label: BOARD() },
    { id: 'workspace', label: L('My workspace', 'Oma työtila', 'Min arbetsyta') },
    { id: 'meetings', label: L('Conversations', 'Keskustelut', 'Samtal'), count: invites },
    { id: 'support', label: L('Ecosystem support', 'Ekosysteemin tuki', 'Stöd i ekosystemet') },
  ];
}

export function context(state) {
  const p = currentParticipant();
  if (!p) {
    return `<span>${esc(L('No solver data in this demo.', 'Tässä demossa ei ole ratkaisijan tietoja.', 'Inga lösaruppgifter i den här demon.'))}</span> <button type="button" class="btn btn--sm btn--secondary" id="new-participant">${esc(L('Start as a new solver', 'Aloita uutena ratkaisijana', 'Börja som ny lösare'))}</button>`;
  }
  return `<span>${ICON.lock}</span><span>${esc(L('You are', 'Olet', 'Du är'))} <strong>Solver #${esc(p.pseudo)}</strong>. ${esc(
    L(
      'Hosts see only this ID, never your name, team or company, until you both agree to meet.',
      'Yritykset näkevät vain tämän tunnuksen, eivät nimeäsi, tiimiäsi tai yritystäsi, ennen kuin sovitte tapaamisesta.',
      'Värdarna ser bara detta ID, aldrig ditt namn, team eller företag, förrän ni båda har kommit överens om att träffas.',
    ),
  )}</span>`;
}

export function bindContext(root) {
  root.querySelector('#new-participant')?.addEventListener('click', () => {
    createParticipant();
    toast(L('New solver created with a fresh pseudonymous ID.', 'Uusi ratkaisija luotu uudella pseudonyymitunnuksella.', 'Ny lösare skapad med ett nytt pseudonymt ID.'));
  });
}

const EMPTY_FILTERS = { q: '', skill: '', lang: '', format: '' };
const filters = { ...EMPTY_FILTERS };
let moreFiltersOpen = false;
let supportTab = 'talent';

export function render(state, tab, arg) {
  if (tab === 'workspace') return renderWorkspace(state);
  if (tab === 'meetings') return renderMeetings(state);
  if (tab === 'support') return renderSupport(arg);
  if (tab === 'write') return renderWrite(state, arg);
  if (tab === 'challenge') return renderChallenge(state, arg);
  return renderBoard(state);
}

export function bind(root, ctx) {
  const onBoard = ctx.tab === 'board' || !ctx.tab;
  if (onBoard) bindBoard(root, ctx);
  if (ctx.tab === 'workspace') bindWorkspace(root);
  root.querySelectorAll('[data-employer-side]').forEach((b) =>
    b.addEventListener('click', () => showEmployerSide(b.dataset.employerSide, b.dataset.tab || 'feed')),
  );
  root.querySelectorAll('[data-consent-notice]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      openDialog({ title: L('Purpose-bound consent notice', 'Käyttötarkoitukseen sidottu suostumus', 'Ändamålsbundet samtycke'), body: consentNotice(getState()) });
    }),
  );
  if (ctx.tab === 'meetings') bindMeetings(root);
  if (ctx.tab === 'write') bindWrite(root, ctx);
  if (ctx.tab === 'support') bindSupport(root);
  // The board binds its cards in paintResults(), which re-runs on every filter change.
  // Binding them here too made Save toggle twice, so it never changed anything.
  if (!onBoard) bindCommon(root);
}

// ---------- shared solver actions ----------
function bindCommon(root) {
  root.querySelectorAll('[data-bookmark]').forEach((b) =>
    b.addEventListener('click', () => {
      const p = currentParticipant();
      if (!p) return toast(L('Start as a solver first.', 'Aloita ensin ratkaisijana.', 'Börja som lösare först.'), 'warn');
      const was = b.getAttribute('aria-pressed') === 'true';
      toggleBookmark(p.id, b.dataset.bookmark);
      toast(was ? L('Removed from saved challenges.', 'Poistettu tallennetuista haasteista.', 'Borttagen från sparade utmaningar.') : L('Saved to your workspace.', 'Tallennettu työtilaasi.', 'Sparad på din arbetsyta.'));
    }),
  );
  root.querySelectorAll('[data-request]').forEach((b) => b.addEventListener('click', () => openRequestDialog(b.dataset.request)));
}

const THINKING_SHARED = () => L('Thinking shared', 'Ajattelu jaettu', 'Tänkande delat');

/** Preview card with this solver's saved / shared state. */
function preview(state, ch) {
  const p = currentParticipant();
  const saved = !!p && (state.bookmarks[p.id] || []).includes(ch.id);
  const sub = p && findSubmission(p.id, ch.id);
  const status = sub ? (sub.status === 'submitted' ? THINKING_SHARED() : L('Draft', 'Luonnos', 'Utkast')) : '';
  return challengePreview(ch, { saved, status });
}

/** Save button (and shared status) in the footer of the full challenge card. */
function cardActions(state, ch) {
  const p = currentParticipant();
  const saved = p && (state.bookmarks[p.id] || []).includes(ch.id);
  const sub = p && findSubmission(p.id, ch.id);
  const shared = sub && sub.status === 'submitted';
  const label = saved ? L('Saved', 'Tallennettu', 'Sparad') : L('Save', 'Tallenna', 'Spara');
  return `
    ${shared ? `<span class="pill pill--ok">${esc(THINKING_SHARED())}</span>` : ''}
    <button type="button" class="btn btn--ghost btn--sm bookmark" data-bookmark="${ch.id}" id="bm-${ch.id}" aria-pressed="${!!saved}">${saved ? ICON.heartFilled : ICON.heart}${esc(label)}<span class="sr-only"> ${esc(ch.title)}</span></button>`;
}

// ---------- problem board ----------
function heroQuote(state) {
  const s = state.submissions.find((x) => x.id === 's-1' && x.status === 'submitted');
  if (s) {
    const ch = challenge(s.challengeId);
    const p = state.participants.find((x) => x.id === s.participantId);
    const v = { who: `Solver #${p ? p.pseudo : 'ESP-2093'}`, host: company(ch.companyId).name };
    return {
      q: L('What happens if the forecast is wrong three days in a row?', 'Mitä tapahtuu, jos ennuste on väärin kolme päivää peräkkäin?', 'Vad händer om prognosen är fel tre dagar i rad?'),
      by: L('{who}, asking {host}', '{who} kysyy yritykseltä {host}', '{who} frågar {host}', v),
      note: L('Asked in Finnish, shown here in English', 'Kysytty suomeksi', 'Ställd på finska, visas här på svenska'),
    };
  }
  return {
    q: L('Who decides that trade-off?', 'Kuka päättää tästä kompromissista?', 'Vem bestämmer över den avvägningen?'),
    by: L('A question a solver asked a host', 'Ratkaisijan kysymys yritykselle', 'En fråga som en lösare ställde till en värd'),
    note: '',
  };
}

const matchesFormat = (ch, f) => !f || (ch.formats || []).includes(f) || (ch.formats || []).includes('open');

function renderBoard(state) {
  const hq = heroQuote(state);
  const usedSkills = [...new Set(state.challenges.flatMap((c) => c.escoTags))].map(skill).sort((a, b) => a.label.localeCompare(b.label));
  const formatCount = (id) => state.challenges.filter((ch) => matchesFormat(ch, id)).length;
  const chip = (id, label, count) => `<label class="fchip${id ? ` fchip--${id}` : ''}"><input type="radio" name="f-format" value="${id}" ${filters.format === id ? 'checked' : ''}><span>${esc(label)} <span class="fchip__n">${count}</span></span></label>`;
  const filtersOn = filters.skill || filters.lang;
  return `
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__copy">
      <p class="eyebrow">${esc(L('Pre-event matchmaking for {event}', 'Ennakkomatchaus tapahtumaan {event}', 'Matchning före evenemanget {event}', { event: state.event.name }))}</p>
      <h1 id="hero-title"><span>Less Résumé.</span><span>Less Pitch Deck.</span><span>More Real You.</span></h1>
      <p class="hero__q">${esc(L(
        'Beyond CVs and cold pitches made with a single prompt, Skillink connects talent, researchers and innovators with companies through real-world challenges.',
        'Ansioluetteloiden ja yhdellä kehotteella tehtyjen myyntipuheiden sijaan Skillink yhdistää osaajat, tutkijat ja innovaattorit yrityksiin todellisten haasteiden kautta.',
        'Bortom CV:n och kalla pitchar skrivna med en enda prompt kopplar Skillink ihop talanger, forskare och innovatörer med företag genom verkliga utmaningar.',
      ))}</p>
      <div class="row">
        <button type="button" class="btn btn--primary" id="browse-challenges">${esc(L('Browse the {n} challenges', 'Selaa {n} haastetta', 'Bläddra bland {n} utmaningar', { n: state.challenges.length }))}</button>
        <a class="btn btn--ghost" href="#/host/feed">${ICON.swap}${esc(L("See the employer's side", 'Katso työnantajan näkymä', 'Se arbetsgivarens sida'))}</a>
      </div>
      <p class="small" style="margin-top:var(--s4)">${esc(L('First visit?', 'Ensimmäistä kertaa täällä?', 'Första besöket?'))} <a href="#/guide/start">${esc(L('Follow the step-by-step guide', 'Seuraa vaiheittaista opasta', 'Följ steg-för-steg-guiden'))}</a>.</p>
    </div>
    <div class="hero__visual" aria-label="${esc(L('Example', 'Esimerkki', 'Exempel'))}">
      <img src="assets/people-working.webp" alt="${esc(L('Three people talking through an idea around a laptop in a sunlit room', 'Kolme ihmistä keskustelee ideasta kannettavan ääressä aurinkoisessa huoneessa', 'Tre personer pratar igenom en idé runt en laptop i ett soligt rum'))}" width="1200" height="900" />
      <figure class="realq">
        <blockquote><p style="margin:0">“${esc(hq.q)}”</p></blockquote>
        <figcaption>${esc(hq.by)}${hq.note ? `. ${esc(hq.note)}.` : ''}</figcaption>
      </figure>
    </div>
  </section>

  <section class="section" id="challenges" aria-labelledby="ch-title" tabindex="-1">
    <div class="section__head">
      <div><p class="eyebrow">${esc(L('The problem board', 'Haastetaulu', 'Utmaningstavlan'))}</p><h2 id="ch-title">${esc(L('Open challenges', 'Avoimet haasteet', 'Öppna utmaningar'))}</h2></div>
      <p class="muted small">${esc(L('Real problems, not job ads. Open one to read the details. Listed by deadline, soonest first.', 'Todellisia ongelmia, ei työpaikkailmoituksia. Avaa haaste nähdäksesi tiedot. Järjestys määräajan mukaan, lähin ensin.', 'Verkliga problem, inte platsannonser. Öppna en för att läsa detaljerna. Sorterade efter deadline, närmast först.'))}</p>
    </div>
    <form class="filters" role="search" aria-label="${esc(L('Filter challenges', 'Suodata haasteita', 'Filtrera utmaningar'))}" onsubmit="return false">
      <div class="filters__bar">
        <fieldset class="filters__formats">
          <legend class="sr-only">${esc(L('Collaboration format', 'Yhteistyömuoto', 'Samarbetsform'))}</legend>
          <div class="fchips">
            ${chip('', L('All formats', 'Kaikki muodot', 'Alla format'), state.challenges.length)}
            ${FORMATS.map((f) => chip(f.id, f.label, formatCount(f.id))).join('')}
          </div>
        </fieldset>
        <div class="field filters__search">
          <label for="f-q" class="sr-only">${esc(L('Search challenges', 'Hae haasteita', 'Sök utmaningar'))}</label>
          <input id="f-q" type="search" placeholder="${esc(L('Search challenges, hosts or skills', 'Hae haasteita, yrityksiä tai taitoja', 'Sök utmaningar, värdar eller färdigheter'))}" value="${esc(filters.q)}" />
        </div>
      </div>
      <details class="morefilters" id="more-filters" ${moreFiltersOpen || filtersOn ? 'open' : ''}>
        <summary>${esc(L('More filters', 'Lisää suodattimia', 'Fler filter'))}${filtersOn ? ` ${esc(L('(on)', '(päällä)', '(på)'))}` : ''}</summary>
        <div class="filters__row">
          <div class="field">
            <label for="f-skill">${esc(L('ESCO skill', 'ESCO-taito', 'ESCO-färdighet'))}</label>
            <select id="f-skill"><option value="">${esc(L('All skills', 'Kaikki taidot', 'Alla färdigheter'))}</option>${usedSkills.map((s) => `<option value="${s.id}" ${filters.skill === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select>
          </div>
          <div class="field">
            <label for="f-lang">${esc(L('Language you can work in', 'Kieli, jolla voit työskennellä', 'Språk du kan arbeta på'))}</label>
            <select id="f-lang"><option value="">${esc(L('Any language', 'Mikä tahansa kieli', 'Valfritt språk'))}</option>${WORK_LANGS.map((l) => `<option value="${l.id}" ${filters.lang === l.id ? 'selected' : ''}>${esc(l.label)}</option>`).join('')}</select>
          </div>
        </div>
      </details>
    </form>
    <p class="small muted" id="board-count" aria-live="polite"></p>
    <div id="board-results" class="grid grid--cards"></div>
  </section>`;
}

function filteredChallenges(state) {
  const q = filters.q.trim().toLowerCase();
  return state.challenges
    .filter((ch) => {
      const c = company(ch.companyId);
      if (!matchesFormat(ch, filters.format)) return false;
      if (filters.skill && !ch.escoTags.includes(filters.skill)) return false;
      if (filters.lang && !(ch.languages || []).includes(filters.lang)) return false;
      if (q) {
        // Skill names in all three languages, so search works whatever language you type in.
        const hay = [ch.title, ch.summary, ch.context, ch.tricky, c?.name, ch.industry, sectorLabel(ch.industry), ch.language, languageRequirementLabel(ch.language), ...ch.escoTags.map((t) => skill(t).all), ...(ch.formats || []).map((f) => fmtOf(f).label)].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}

function paintResults(root) {
  const state = getState();
  const list = filteredChallenges(state);
  const host = root.querySelector('#board-results');
  host.innerHTML = list.length
    ? list.map((ch) => preview(state, ch)).join('')
    : `<div class="empty"><h3>${esc(L('No challenges match these filters', 'Mikään haaste ei vastaa suodattimia', 'Inga utmaningar matchar filtren'))}</h3><p>${esc(L('Try another format, skill or language, or', 'Kokeile toista muotoa, taitoa tai kieltä, tai', 'Prova ett annat format, en annan färdighet eller ett annat språk, eller'))} <button type="button" class="linkbtn" id="clear-filters">${esc(L('clear all filters', 'tyhjennä kaikki suodattimet', 'rensa alla filter'))}</button>.</p></div>`;
  const openIncluded = filters.format && filters.format !== 'open' ? list.filter((ch) => (ch.formats || []).includes('open') && !ch.formats.includes(filters.format)).length : 0;
  const shown = list.length === 1 ? L('1 challenge shown', '1 haaste näkyvissä', '1 utmaning visas') : L('{n} challenges shown', '{n} haastetta näkyvissä', '{n} utmaningar visas', { n: list.length });
  const incl = openIncluded
    ? L(', including {n} Open Format', ', joista {n} Open Format -haastetta', ', varav {n} med Open Format', { n: openIncluded })
    : '';
  root.querySelector('#board-count').textContent = `${shown}${incl}.`;
  host.querySelector('#clear-filters')?.addEventListener('click', () => {
    Object.assign(filters, EMPTY_FILTERS);
    ['f-q', 'f-skill', 'f-lang'].forEach((id) => (root.querySelector(`#${id}`).value = ''));
    root.querySelector('input[name="f-format"][value=""]').checked = true;
    paintResults(root);
  });
  bindCommon(host);
}

function bindBoard(root) {
  root.querySelector('#browse-challenges')?.addEventListener('click', () => {
    const target = root.querySelector('#challenges');
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    target.focus({ preventScroll: true });
  });
  const map = { 'f-q': 'q', 'f-skill': 'skill', 'f-lang': 'lang' };
  Object.entries(map).forEach(([id, key]) => {
    const el = root.querySelector(`#${id}`);
    el.addEventListener(id === 'f-q' ? 'input' : 'change', () => {
      filters[key] = el.value;
      paintResults(root);
    });
  });
  root.querySelectorAll('input[name="f-format"]').forEach((r) =>
    r.addEventListener('change', () => {
      filters.format = r.value;
      paintResults(root);
    }),
  );
  root.querySelector('#more-filters')?.addEventListener('toggle', (e) => (moreFiltersOpen = e.target.open));
  paintResults(root);
}

const GONE = () => `<div class="empty"><h2>${esc(L('This challenge is no longer available', 'Tämä haaste ei ole enää saatavilla', 'Den här utmaningen finns inte längre'))}</h2><p><a href="#/participant/board">${esc(L('Back to the problem board', 'Takaisin haastetaululle', 'Tillbaka till utmaningstavlan'))}</a></p></div>`;
const REQUEST_CONVERSATION = () => L('Request a conversation', 'Pyydä keskustelua', 'Be om ett samtal');

// ---------- one challenge, full details ----------
function renderChallenge(state, chId) {
  const ch = challenge(chId);
  if (!ch) return GONE();
  const c = company(ch.companyId);
  const p = currentParticipant();
  const sub = p && findSubmission(p.id, ch.id);
  const m = p && existingMeeting(p.id, ch.id);
  const used = p ? activeRequestCount(p.id) : 0;
  const request = !p
    ? ''
    : m
      ? `<p class="small">${esc(L('Your conversation:', 'Keskustelusi:', 'Ditt samtal:'))} ${statusPill(m)}</p>`
      : used >= REQUEST_CAP
        ? `<p class="small muted">${esc(L("You've used all {n} conversation requests.", 'Olet käyttänyt kaikki {n} keskustelupyyntöä.', 'Du har använt alla {n} samtalsförfrågningar.', { n: REQUEST_CAP }))} <a href="#/participant/meetings">${esc(L('Cancel one', 'Peru yksi', 'Avbryt en'))}</a> ${esc(L('to request another.', 'pyytääksesi uutta.', 'för att be om ett nytt.'))}</p>`
        : `<button type="button" class="btn btn--secondary" data-request="${ch.id}">${esc(REQUEST_CONVERSATION())}</button>`;
  const writeLabel = sub
    ? sub.status === 'submitted'
      ? L('View your thinking', 'Katso ajatteluasi', 'Se ditt tänkande')
      : L('Continue draft', 'Jatka luonnosta', 'Fortsätt utkastet')
    : L('Show your thinking', 'Näytä ajattelusi', 'Visa ditt tänkande');
  return `
  <p class="crumbs small"><a href="#/participant/board">${esc(BOARD())}</a> <span aria-hidden="true">/</span> ${esc(ch.title)}</p>
  <div class="split">
    <div class="stack">
      ${challengeCard(ch, { actions: p ? cardActions(state, ch) : '' })}
    </div>
    <aside class="stack">
      <div class="panel">
        <h3>${esc(L('Your next step', 'Seuraava askeleesi', 'Ditt nästa steg'))}</h3>
        <p class="small">${esc(
          sub && sub.status === 'submitted'
            ? L('{host} can read your thinking under your solver ID.', '{host} voi lukea ajatteluasi ratkaisijatunnuksesi alla.', '{host} kan läsa ditt tänkande under ditt lösar-ID.', { host: c.name })
            : L(
                'Show how you would tackle it: what you would do first, why, and what you would ask. Bullet points are fine.',
                'Näytä, miten tarttuisit siihen: mitä tekisit ensin, miksi ja mitä kysyisit. Ranskalaiset viivat riittävät.',
                'Visa hur du skulle ta dig an den: vad du skulle göra först, varför och vad du skulle fråga. Punktlistor går bra.',
              ),
        )}</p>
        <div class="row">
          <a class="btn btn--primary" href="#/participant/write/${ch.id}">${esc(writeLabel)}</a>
          ${request}
        </div>
        ${p ? `<div style="margin-top:var(--s4)">${quotaBar(used)}</div>` : ''}
      </div>
      <div class="panel panel--trust">
        <h3>${esc(L("The employer's side", 'Työnantajan näkymä', 'Arbetsgivarens sida'))}</h3>
        <p class="small">${esc(L(
          '{host} reads shared thinking without names, oldest first, with no scores or rankings. Switch sides to see exactly what they see.',
          '{host} lukee jaettua ajattelua ilman nimiä, vanhimmasta alkaen, ilman pisteitä tai järjestyksiä. Vaihda puolta nähdäksesi täsmälleen saman kuin he.',
          '{host} läser delat tänkande utan namn, äldst först, utan poäng eller rankning. Byt sida för att se exakt vad de ser.',
          { host: c.name },
        ))}</p>
        <button type="button" class="btn btn--ghost" data-employer-side="${esc(c.id)}">${ICON.swap}${esc(L('See it as {name}', 'Katso tilinä {name}', 'Se det som {name}', { name: c.name }))}</button>
      </div>
    </aside>
  </div>`;
}

// ---------- workspace ----------
function renderWorkspace(state) {
  const p = currentParticipant();
  if (!p) return noParticipant();
  const saved = (state.bookmarks[p.id] || []).map(challenge).filter(Boolean);
  const mine = state.submissions.filter((s) => s.participantId === p.id);
  const drafts = mine.filter((s) => s.status === 'draft');
  const shared = mine.filter((s) => s.status === 'submitted');
  const subRow = (s, kind) => {
    const ch = challenge(s.challengeId);
    const meta =
      kind === 'draft'
        ? L('Private draft, last saved {when}', 'Yksityinen luonnos, tallennettu viimeksi {when}', 'Privat utkast, senast sparat {when}', { when: fmtDateTime(s.updatedAt) })
        : L('Shared {when} in {lang}', 'Jaettu {when}, kieli: {lang}', 'Delat {when} på {lang}', { when: fmtDateTime(s.submittedAt), lang: LANGS[s.lang]?.label || s.langOther || LANGS.other.label });
    return `<li>
      <div class="list__main">
        <h4>${esc(ch.title)}</h4>
        <p>${esc(company(ch.companyId).name)}. ${esc(meta)}</p>
        <div style="margin-top:var(--s2)">${intentBadge(s.intent)}</div>
      </div>
      <div class="list__actions">
        <a class="btn btn--sm ${kind === 'draft' ? 'btn--primary' : 'btn--ghost'}" href="#/participant/write/${ch.id}">${esc(kind === 'draft' ? L('Continue draft', 'Jatka luonnosta', 'Fortsätt utkastet') : L('View', 'Näytä', 'Visa'))}<span class="sr-only">: ${esc(ch.title)}</span></a>
        ${kind === 'draft' ? `<button type="button" class="btn btn--sm btn--ghost" data-del-draft="${s.id}">${esc(L('Delete draft', 'Poista luonnos', 'Radera utkast'))}</button>` : ''}
      </div>
    </li>`;
  };
  return `
  <div class="split">
    <div>
      <section class="section" aria-labelledby="ws-drafts">
        <div class="section__head"><h2 id="ws-drafts">${esc(L('Private drafts', 'Yksityiset luonnokset', 'Privata utkast'))}</h2><p class="muted small">${esc(L('Only you can see drafts. Hosts never do.', 'Vain sinä näet luonnokset. Yritykset eivät koskaan.', 'Bara du ser utkasten. Värdarna gör det aldrig.'))}</p></div>
        ${drafts.length ? `<ul class="list">${drafts.map((s) => subRow(s, 'draft')).join('')}</ul>` : `<div class="empty"><h3>${esc(L('No drafts', 'Ei luonnoksia', 'Inga utkast'))}</h3><p>${esc(L('Pick a challenge on the', 'Valitse haaste', 'Välj en utmaning på'))} <a href="#/participant/board">${esc(L('problem board', 'haastetaululta', 'utmaningstavlan'))}</a> ${esc(L('and start writing. Drafts save automatically.', 'ja aloita kirjoittaminen. Luonnokset tallentuvat automaattisesti.', 'och börja skriva. Utkast sparas automatiskt.'))}</p></div>`}
      </section>
      <section class="section" aria-labelledby="ws-shared">
        <div class="section__head"><h2 id="ws-shared">${esc(L("Thinking you've shared", 'Jakamasi ajattelu', 'Tänkande du har delat'))}</h2></div>
        ${shared.length ? `<ul class="list">${shared.map((s) => subRow(s, 'shared')).join('')}</ul>` : `<div class="empty"><h3>${esc(L('Nothing shared yet', 'Ei vielä mitään jaettu', 'Inget delat ännu'))}</h3><p>${esc(L('When you share your thinking, the host sees it under your solver ID only.', 'Kun jaat ajatteluasi, yritys näkee sen vain ratkaisijatunnuksesi alla.', 'När du delar ditt tänkande ser värden det bara under ditt lösar-ID.'))}</p></div>`}
      </section>
      <section class="section" aria-labelledby="ws-saved">
        <div class="section__head"><h2 id="ws-saved">${esc(L('Saved challenges', 'Tallennetut haasteet', 'Sparade utmaningar'))}</h2></div>
        ${saved.length ? `<div class="grid grid--cards-2">${saved.map((ch) => preview(state, ch)).join('')}</div>` : `<div class="empty"><h3>${esc(L('No saved challenges', 'Ei tallennettuja haasteita', 'Inga sparade utmaningar'))}</h3><p>${esc(L('Use the heart on any challenge to keep it here.', 'Tallenna haaste tänne sydänpainikkeella.', 'Använd hjärtat på en utmaning för att spara den här.'))}</p></div>`}
      </section>
    </div>
    <aside class="stack">
      <div class="panel panel--trust">
        <h3>${esc(L('Substance over style', 'Sisältö ennen tyyliä', 'Innehåll före stil'))}</h3>
        <p class="small">${esc(L(
          "Short answers and bullet points count exactly as much as polished paragraphs. No CV, no pitch deck, and nobody scores length, grammar or wording. Hosts read what you'd actually do.",
          'Lyhyet vastaukset ja ranskalaiset viivat ovat yhtä arvokkaita kuin hiotut kappaleet. Ei ansioluetteloa, ei pitch deckiä, eikä kukaan pisteytä pituutta, kielioppia tai sanavalintoja. Yritykset lukevat, mitä oikeasti tekisit.',
          'Korta svar och punktlistor räknas lika mycket som välputsade stycken. Inget CV, inget pitchdeck, och ingen poängsätter längd, grammatik eller ordval. Värdarna läser vad du faktiskt skulle göra.',
        ))}</p>
      </div>
      <div class="panel">${quotaBar(activeRequestCount(p.id))}<p class="small" style="margin-top:var(--s3)"><a href="#/participant/meetings">${esc(L('Manage conversation requests', 'Hallitse keskustelupyyntöjä', 'Hantera samtalsförfrågningar'))}</a></p></div>
      <div class="panel">
        <h3>${esc(L('Your data', 'Tietosi', 'Dina uppgifter'))}</h3>
        <p class="small">${esc(L(
          'Everything about you is deleted {days} days after the event. You can also withdraw your consent now, which deletes your answers, drafts, saved challenges and conversations straight away.',
          'Kaikki sinua koskevat tiedot poistetaan {days} päivää tapahtuman jälkeen. Voit myös perua suostumuksesi nyt, jolloin vastauksesi, luonnoksesi, tallennetut haasteesi ja keskustelusi poistetaan heti.',
          'Allt om dig raderas {days} dagar efter evenemanget. Du kan också dra tillbaka ditt samtycke nu, vilket raderar dina svar, utkast, sparade utmaningar och samtal direkt.',
          { days: state.event.retentionDays },
        ))}</p>
        <div class="row"><button type="button" class="btn btn--sm btn--ghost" data-consent-notice>${esc(L('Read the consent notice', 'Lue suostumusilmoitus', 'Läs samtyckesinformationen'))}</button><button type="button" class="btn btn--sm btn--danger" id="withdraw-consent">${esc(L('Withdraw consent', 'Peru suostumus', 'Dra tillbaka samtycket'))}</button></div>
      </div>
    </aside>
  </div>`;
}

function bindWorkspace(root) {
  root.querySelector('#withdraw-consent')?.addEventListener('click', async () => {
    const p = currentParticipant();
    if (!p) return;
    const ok = await confirmDialog({
      title: L('Withdraw consent for Solver #{id}?', 'Perutaanko suostumus (Solver #{id})?', 'Dra tillbaka samtycket för Solver #{id}?', { id: p.pseudo }),
      message: esc(L(
        'Your answers, drafts, saved challenges and conversations are deleted now, without waiting 30 days. Anonymous counts are kept.',
        'Vastauksesi, luonnoksesi, tallennetut haasteesi ja keskustelusi poistetaan nyt odottamatta 30 päivää. Anonyymit lukumäärät säilyvät.',
        'Dina svar, utkast, sparade utmaningar och samtal raderas nu, utan att vänta 30 dagar. Anonyma antal sparas.',
      )),
      confirmLabel: L('Withdraw and delete', 'Peru ja poista', 'Dra tillbaka och radera'),
      danger: true,
    });
    if (!ok) return;
    deleteParticipantData(p.id);
    toast(L('Consent withdrawn. Your data is deleted.', 'Suostumus peruttu. Tietosi on poistettu.', 'Samtycket är tillbakadraget. Dina uppgifter är raderade.'));
  });
  root.querySelectorAll('[data-del-draft]').forEach((b) =>
    b.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: L('Delete this draft?', 'Poistetaanko luonnos?', 'Radera utkastet?'),
        message: esc(L('The draft is deleted and cannot be recovered.', 'Luonnos poistetaan, eikä sitä voi palauttaa.', 'Utkastet raderas och kan inte återställas.')),
        confirmLabel: L('Delete draft', 'Poista luonnos', 'Radera utkast'),
        danger: true,
      });
      if (ok) {
        deleteDraft(b.dataset.delDraft);
        toast(L('Draft deleted.', 'Luonnos poistettu.', 'Utkastet raderat.'));
      }
    }),
  );
}

// ---------- "Show your thinking" editor ----------
const FORMAT_HINT = {
  get bullets() { return L('One idea per line. Start lines with "- " if you like.', 'Yksi ajatus riville. Voit aloittaa rivit merkillä "- ".', 'En idé per rad. Börja gärna raderna med "- ".'); },
  get prose() { return L('A few sentences is plenty.', 'Muutama lause riittää.', 'Några meningar räcker.'); },
};

function intentPicker(ch, current) {
  const allowed = allowedIntents(ch);
  const value = allowed.includes(current) ? current : 'open';
  return `<fieldset class="qblock intents">
    <legend>${esc(L('How are you approaching this challenge?', 'Miten lähestyt tätä haastetta?', 'Hur tar du dig an den här utmaningen?'))}</legend>
    <p class="hint" id="intent-h">${esc(L('The host sees this next to your answers. It is never used to sort or hide anyone.', 'Yritys näkee tämän vastaustesi vieressä. Sitä ei koskaan käytetä kenenkään järjestämiseen tai piilottamiseen.', 'Värden ser detta bredvid dina svar. Det används aldrig för att sortera eller dölja någon.'))}</p>
    <div class="intents__list">${INTENTS.map((it) => {
      const ok = allowed.includes(it.id);
      return `<label class="icard icard--${it.format}${ok ? '' : ' is-off'}">
        <input type="radio" name="intent" value="${it.id}" ${it.id === value ? 'checked' : ''} ${ok ? '' : 'disabled'} aria-describedby="intent-h${ok ? '' : ` off-${it.id}`}">
        <span class="icard__body"><strong>${esc(it.label)}</strong><span>${esc(it.desc)}</span>${ok ? '' : `<span class="icard__off" id="off-${it.id}">${esc(L('Not offered for this challenge', 'Ei tarjolla tässä haasteessa', 'Erbjuds inte för den här utmaningen'))}</span>`}</span>
      </label>`;
    }).join('')}</div>
  </fieldset>`;
}

function renderWrite(state, chId) {
  const ch = challenge(chId);
  if (!ch) return GONE();
  const p = currentParticipant();
  if (!p) return noParticipant();
  const c = company(ch.companyId);
  const sub = findSubmission(p.id, ch.id);
  const shared = sub && sub.status === 'submitted';
  const d = sub || { intent: 'open', lang: 'en', format: 'bullets', answers: { first: '', why: '', questions: '' }, skills: [] };
  const m = existingMeeting(p.id, ch.id);

  const head = `
    <p class="crumbs small"><a href="#/participant/board">${esc(BOARD())}</a> <span aria-hidden="true">/</span> <a href="#/participant/challenge/${ch.id}">${esc(ch.title)}</a> <span aria-hidden="true">/</span> ${esc(hiddenTabLabels.write)}</p>
    ${challengeCard(ch, { actions: '' })}`;

  if (shared) {
    return `<div class="split"><div class="stack">${head}
      <section class="section" aria-labelledby="your-thinking">
        <div class="notice notice--pine"><div>${verifiedBadge(L('Shared with {host}', 'Jaettu yritykselle {host}', 'Delat med {host}', { host: c.name }))}<p class="small" style="margin-top:4px">${esc(L('Shared {when}. {host} sees this as Solver #{id}.', 'Jaettu {when}. {host} näkee tämän tunnuksella Solver #{id}.', 'Delat {when}. {host} ser detta som Solver #{id}.', { when: fmtDateTime(sub.submittedAt), host: c.name, id: p.pseudo }))}</p></div></div>
        <h2 id="your-thinking" style="margin-top:var(--s5)">${esc(L('Your thinking', 'Ajattelusi', 'Ditt tänkande'))}</h2>
        <p>${intentBadge(sub.intent)}</p>
        ${PARTS.map((pt) => `<div class="qblock${pt.key === 'questions' ? ' qblock--core' : ''}"><h3><span class="qblock__n">${pt.n}</span>${esc(pt.label)}</h3>${richText(sub.answers[pt.key], sub.format)}</div>`).join('')}
        <div class="row" style="margin-top:var(--s4)">
          ${m ? `<span>${esc(L('Conversation:', 'Keskustelu:', 'Samtal:'))} ${statusPill(m)}</span>` : `<button type="button" class="btn btn--primary" data-request="${ch.id}">${esc(REQUEST_CONVERSATION())}</button>`}
          <button type="button" class="btn btn--ghost" id="withdraw" data-sub="${sub.id}">${esc(L('Withdraw and edit', 'Peru jako ja muokkaa', 'Dra tillbaka och redigera'))}</button>
        </div>
      </section></div>${writeAside(state, p)}</div>`;
  }

  const notSaved = L('Not saved yet', 'Ei vielä tallennettu', 'Inte sparat ännu');
  const savedAt = sub ? L('Draft saved {when}', 'Luonnos tallennettu {when}', 'Utkast sparat {when}', { when: fmtDateTime(sub.updatedAt) }) : notSaved;
  return `<div class="split"><div class="stack">${head}
    <form id="editor" class="editor" novalidate aria-labelledby="ed-title">
      <div class="section__head" style="margin:var(--s4) 0 0"><h2 id="ed-title">${esc(hiddenTabLabels.write)}</h2><p class="muted small" id="save-state">${esc(savedAt)}</p></div>
      ${intentPicker(ch, d.intent)}
      <div class="row" style="gap:var(--s5);align-items:flex-end">
        <fieldset class="field">
          <legend>${esc(L('How do you want to write?', 'Miten haluat kirjoittaa?', 'Hur vill du skriva?'))}</legend>
          <div class="seg">
            <label><input type="radio" name="format" value="bullets" ${d.format === 'bullets' ? 'checked' : ''}><span>${esc(L('Bullet points', 'Ranskalaiset viivat', 'Punktlista'))}</span></label>
            <label><input type="radio" name="format" value="prose" ${d.format === 'prose' ? 'checked' : ''}><span>${esc(L('Short paragraphs', 'Lyhyet kappaleet', 'Korta stycken'))}</span></label>
          </div>
        </fieldset>
        <div class="field">
          <label for="ed-lang">${esc(L("Language you're writing in", 'Kieli, jolla kirjoitat', 'Språk du skriver på'))}</label>
          <select id="ed-lang" name="lang" style="width:auto">
            ${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${d.lang === k ? 'selected' : ''}>${esc(v.label)}${k !== 'other' && v.native.toLowerCase() !== v.label.toLowerCase() ? ` (${esc(v.native)})` : ''}</option>`).join('')}
          </select>
        </div>
        <div class="field" id="lang-other-wrap" ${d.lang === 'other' ? '' : 'hidden'}>
          <label for="ed-lang-other">${esc(L('Which language?', 'Mikä kieli?', 'Vilket språk?'))}</label>
          <input id="ed-lang-other" type="text" name="langOther" value="${esc(d.langOther || '')}" placeholder="${esc(L('e.g. Estonian', 'esim. viro', 't.ex. estniska'))}" style="width:12rem" />
        </div>
      </div>
      <p class="callout">${esc(L(
        'Write in the language you think best in. {host} says: “{req}”. If you write in another language, the host can open an EU-hosted machine translation next to your original words.',
        'Kirjoita kielellä, jolla ajattelet parhaiten. {host} sanoo: ”{req}”. Jos kirjoitat muulla kielellä, yritys voi avata EU:ssa ylläpidetyn konekäännöksen alkuperäisen tekstisi viereen.',
        'Skriv på det språk du tänker bäst på. {host} säger: ”{req}”. Om du skriver på ett annat språk kan värden öppna en EU-baserad maskinöversättning bredvid dina ursprungliga ord.',
        { host: c.name, req: languageRequirementLabel(ch.language) },
      ))}</p>
      ${PARTS.map(
        (pt) => `<div class="qblock${pt.key === 'questions' ? ' qblock--core' : ''}">
          <h3><span class="qblock__n">${pt.n}</span><label for="ed-${pt.key}">${esc(pt.label)}</label></h3>
          ${pt.key === 'questions' ? `<p class="core-note">${ICON.person}<span><strong>${esc(L('This is the heart of Skillink.', 'Tämä on Skillinkin ydin.', 'Det här är kärnan i Skillink.'))}</strong> ${esc(L(
            'Your questions show how you think about their real situation, which no generic answer or AI-written pitch can copy. They open your live conversation.',
            'Kysymyksesi näyttävät, miten ajattelet heidän todellista tilannettaan, eikä mikään geneerinen vastaus tai tekoälyn kirjoittama pitch voi kopioida sitä. Ne avaavat keskustelunne.',
            'Dina frågor visar hur du tänker kring deras verkliga situation, något som inget generiskt svar eller AI-skriven pitch kan kopiera. De inleder ert samtal.',
          ))}</span></p>` : ''}
          <p class="hint" id="h-${pt.key}">${esc(FORMAT_HINT[d.format])}</p>
          <textarea id="ed-${pt.key}" name="${pt.key}" aria-describedby="h-${pt.key} e-${pt.key}" rows="5">${esc(d.answers[pt.key])}</textarea>
          <p class="field-error" id="e-${pt.key}" hidden></p>
        </div>`,
      ).join('')}
      <fieldset class="qblock">
        <legend style="margin-bottom:var(--s2)">${esc(L("Which of the host's ESCO skills are you drawing on?", 'Mitä yrityksen ESCO-taidoista hyödynnät?', 'Vilka av värdens ESCO-färdigheter använder du?'))} <span class="muted">${esc(L('(optional)', '(valinnainen)', '(valfritt)'))}</span></legend>
        <p class="hint" style="margin-bottom:var(--s3)">${esc(L('Used only for anonymous counts of which skills were offered at the event. Never to rank or filter you.', 'Käytetään vain anonyymeihin laskelmiin siitä, mitä taitoja tapahtumassa tarjottiin. Ei koskaan sinun järjestämiseesi tai suodattamiseesi.', 'Används bara för anonyma antal över vilka färdigheter som erbjöds på evenemanget. Aldrig för att rangordna eller filtrera dig.'))}</p>
        <div class="row">${ch.escoTags.map((id) => `<label class="choice"><input type="checkbox" name="skills" value="${id}" ${d.skills?.includes(id) ? 'checked' : ''}> ${esc(skill(id).label)}</label>`).join('')}</div>
      </fieldset>
      <div class="panel panel--quiet">
        <label class="choice" style="align-items:flex-start"><input type="checkbox" id="consent" style="margin-top:3px">
          <span><strong>${esc(L(
            'I agree that my answers are used only to arrange conversations at {event}, whether about a role, research or a pilot.',
            'Hyväksyn, että vastauksiani käytetään vain keskustelujen järjestämiseen tapahtumassa {event}, oli kyse tehtävästä, tutkimuksesta tai pilotista.',
            'Jag godkänner att mina svar bara används för att ordna samtal på {event}, oavsett om det gäller en tjänst, forskning eller en pilot.',
            { event: state.event.name },
          ))}</strong> ${esc(L(
            '{host} sees them under my solver ID. My name, and any team or company I belong to, is shared only if we both agree to meet. Everything is deleted {days} days after the event.',
            '{host} näkee ne ratkaisijatunnukseni alla. Nimeni sekä mahdollinen tiimini tai yritykseni jaetaan vain, jos sovimme molemmat tapaamisesta. Kaikki poistetaan {days} päivää tapahtuman jälkeen.',
            '{host} ser dem under mitt lösar-ID. Mitt namn, och eventuellt team eller företag, delas bara om vi båda kommer överens om att träffas. Allt raderas {days} dagar efter evenemanget.',
            { host: c.name, days: state.event.retentionDays },
          ))} <button type="button" class="linkbtn" data-consent-notice>${esc(L('Read the full notice', 'Lue koko ilmoitus', 'Läs hela informationen'))}</button>.</span>
        </label>
        <p class="field-error" id="e-consent" hidden>${esc(L('Tick the box to agree before sharing, or save as a private draft instead.', 'Rastita ruutu hyväksyäksesi ennen jakamista, tai tallenna yksityisenä luonnoksena.', 'Kryssa i rutan för att godkänna innan du delar, eller spara som privat utkast i stället.'))}</p>
      </div>
      <div class="row row--end">
        <button type="button" class="btn btn--ghost" id="save-draft">${esc(L('Save private draft', 'Tallenna yksityinen luonnos', 'Spara privat utkast'))}</button>
        <button type="submit" class="btn btn--primary">${esc(L('Share with {host}', 'Jaa yritykselle {host}', 'Dela med {host}', { host: c.name }))}</button>
      </div>
    </form></div>${writeAside(state, p)}</div>`;
}

function writeAside(state, p) {
  return `<aside class="stack">
    <div class="panel panel--trust">
      <h3>${esc(L('Substance over style', 'Sisältö ennen tyyliä', 'Innehåll före stil'))}</h3>
      <p class="small">${esc(L(
        'Three honest bullet points are as good as three paragraphs. Nobody scores length, grammar or polish, no AI ranks your answer, and a famous logo earns nothing here.',
        'Kolme rehellistä ranskalaista viivaa on yhtä hyvä kuin kolme kappaletta. Kukaan ei pisteytä pituutta, kielioppia tai viimeistelyä, mikään tekoäly ei järjestä vastaustasi, eikä kuuluisa logo tuo täällä etua.',
        'Tre ärliga punkter är lika bra som tre stycken. Ingen poängsätter längd, grammatik eller finputsning, ingen AI rangordnar ditt svar och en känd logotyp ger ingenting här.',
      ))}</p>
    </div>
    <div class="panel">
      <h3>${esc(L('What the host sees', 'Mitä yritys näkee', 'Vad värden ser'))}</h3>
      <ul class="checks small">
        <li class="check" style="color:var(--pine-700)">${ICON.check}<p><strong>${esc(L("Your answers, solver ID and how you're approaching it", 'Vastauksesi, ratkaisijatunnuksesi ja lähestymistapasi', 'Dina svar, ditt lösar-ID och hur du tar dig an den'))}</strong></p></li>
        <li class="check" style="color:var(--red-700)">${ICON.cross}<p><strong>${esc(L('Not your name, email, CV, photo, team or company', 'Ei nimeäsi, sähköpostiasi, ansioluetteloasi, kuvaasi, tiimiäsi tai yritystäsi', 'Inte ditt namn, din e-post, ditt CV, foto, team eller företag'))}</strong>${esc(L('until you both agree to meet', 'ennen kuin sovitte tapaamisesta', 'förrän ni båda kommer överens om att träffas'))}</p></li>
        <li class="check" style="color:var(--red-700)">${ICON.cross}<p><strong>${esc(L('Not your age, gender, nationality, team size or funding', 'Ei ikääsi, sukupuoltasi, kansallisuuttasi, tiimin kokoa tai rahoitusta', 'Inte din ålder, ditt kön, din nationalitet, teamets storlek eller finansiering'))}</strong>${esc(L('Skillink never asks for them', 'Skillink ei koskaan kysy niitä', 'Skillink frågar aldrig efter dem'))}</p></li>
      </ul>
    </div>
    <div class="panel">${quotaBar(activeRequestCount(p.id))}</div>
  </aside>`;
}

function readForm(form) {
  const fd = new FormData(form);
  return {
    intent: fd.get('intent') || 'open',
    lang: fd.get('lang'),
    langOther: fd.get('langOther') || '',
    format: fd.get('format'),
    skills: fd.getAll('skills'),
    answers: { first: fd.get('first').trim(), why: fd.get('why').trim(), questions: fd.get('questions').trim() },
  };
}

function bindWrite(root, ctx) {
  root.querySelector('#withdraw')?.addEventListener('click', async (e) => {
    const ok = await confirmDialog({
      title: L('Withdraw your shared thinking?', 'Perutaanko jakamasi ajattelu?', 'Dra tillbaka ditt delade tänkande?'),
      message: esc(L(
        'The host will no longer see it. It goes back to your private drafts so you can edit and share again.',
        'Yritys ei enää näe sitä. Se palaa yksityisiin luonnoksiisi, joten voit muokata ja jakaa sen uudelleen.',
        'Värden ser det inte längre. Det går tillbaka till dina privata utkast så att du kan redigera och dela igen.',
      )),
      confirmLabel: L('Withdraw', 'Peru jako', 'Dra tillbaka'),
    });
    if (ok) {
      withdrawSubmission(e.target.dataset.sub);
      toast(L('Withdrawn. It is a private draft again.', 'Jako peruttu. Se on taas yksityinen luonnos.', 'Tillbakadraget. Det är ett privat utkast igen.'));
    }
  });
  const form = root.querySelector('#editor');
  if (!form) return;
  const p = currentParticipant();
  const chId = ctx.arg;
  const saveState = root.querySelector('#save-state');
  let timer;
  const autosave = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      saveSubmission(p.id, chId, readForm(form), false, { render: false });
      saveState.textContent = L('Draft saved just now', 'Luonnos tallennettu juuri nyt', 'Utkastet sparades nyss');
    }, 700);
  };
  form.addEventListener('input', autosave);
  form.addEventListener('change', (e) => e.target.name === 'intent' && autosave());
  form.querySelectorAll('input[name="format"]').forEach((r) =>
    r.addEventListener('change', () => form.querySelectorAll('.hint[id^="h-"]').forEach((h) => (h.textContent = FORMAT_HINT[r.value]))),
  );
  const langSel = form.querySelector('#ed-lang');
  langSel.addEventListener('change', () => (form.querySelector('#lang-other-wrap').hidden = langSel.value !== 'other'));

  form.querySelector('#save-draft').addEventListener('click', () => {
    clearTimeout(timer);
    saveSubmission(p.id, chId, readForm(form), false);
    toast(L('Private draft saved.', 'Yksityinen luonnos tallennettu.', 'Privat utkast sparat.'));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    const data = readForm(form);
    let firstBad = null;
    PARTS.forEach((pt) => {
      const err = form.querySelector(`#e-${pt.key}`);
      const ta = form.querySelector(`#ed-${pt.key}`);
      const empty = !data.answers[pt.key];
      err.hidden = !empty;
      err.textContent = empty ? L('Write at least one line here. A single bullet point is enough.', 'Kirjoita tähän vähintään yksi rivi. Yksi ranskalainen viiva riittää.', 'Skriv minst en rad här. En enda punkt räcker.') : '';
      ta.setAttribute('aria-invalid', String(empty));
      if (empty && !firstBad) firstBad = ta;
    });
    const consent = form.querySelector('#consent');
    form.querySelector('#e-consent').hidden = consent.checked;
    if (!consent.checked && !firstBad) firstBad = consent;
    if (firstBad) {
      firstBad.focus();
      toast(L('Some parts need attention before sharing.', 'Osa kohdista vaatii huomiota ennen jakamista.', 'Några delar behöver åtgärdas innan du delar.'), 'warn');
      return;
    }
    saveSubmission(p.id, chId, data, true);
    const host = company(challenge(chId).companyId);
    toast(L('Shared with {host}.', 'Jaettu yritykselle {host}.', 'Delat med {host}.', { host: host.name }), 'ok', employerAction(host.id, 'feed'));
  });
}

// ---------- meetings ----------
function openRequestDialog(chId) {
  const p = currentParticipant();
  if (!p) return;
  const ch = challenge(chId);
  const c = company(ch.companyId);
  const used = activeRequestCount(p.id);
  if (used >= REQUEST_CAP) {
    toast(L("You've used all {n} requests. Cancel one on the Conversations tab to free a request.", 'Olet käyttänyt kaikki {n} pyyntöä. Peru yksi Keskustelut-välilehdellä vapauttaaksesi pyynnön.', 'Du har använt alla {n} förfrågningar. Avbryt en på fliken Samtal för att frigöra en.', { n: REQUEST_CAP }), 'warn');
    return;
  }
  const slots = freeSlots(c.id);
  const sub = findSubmission(p.id, ch.id);
  openDialog({
    title: L('Request a conversation with {host}', 'Pyydä keskustelua yrityksen {host} kanssa', 'Be om ett samtal med {host}', { host: c.name }),
    body: `
      ${quotaBar(used)}
      <p style="margin-top:var(--s4)">${esc(L('About:', 'Aihe:', 'Om:'))} <strong>${esc(ch.title)}</strong></p>
      ${sub?.status === 'submitted'
        ? `<p class="small muted">${esc(L('Your shared thinking is attached to this request.', 'Jakamasi ajattelu liitetään tähän pyyntöön.', 'Ditt delade tänkande bifogas förfrågan.'))}</p>`
        : `<p class="notice notice--amber small">${esc(L("You haven't shared your thinking on this challenge yet. Requests with shared thinking give the host something real to talk about.", 'Et ole vielä jakanut ajatteluasi tähän haasteeseen. Pyynnöt, joihin liittyy jaettua ajattelua, antavat yritykselle jotain todellista keskusteltavaa.', 'Du har inte delat ditt tänkande om den här utmaningen ännu. Förfrågningar med delat tänkande ger värden något verkligt att prata om.'))}</p>`}
      <form id="req-form">
        ${formatChoice(ch, defaultFormatFor(ch, sub?.intent))}
        <fieldset><legend>${esc(L('Pick a time at {venue}', 'Valitse aika: {venue}', 'Välj en tid på {venue}', { venue: getState().event.venue }))}</legend>
          ${slots.length ? `<div class="slots">${slots.map((s, i) => `<label class="slot"><input type="radio" name="slot" value="${s.id}" ${i === 0 ? 'checked' : ''}><span>${esc(slotLabel(s.id).split(', ').pop())}<small>${esc(fmtDate(s.start, { weekday: true }))}</small></span></label>`).join('')}</div>` : `<p class="notice notice--amber">${esc(L("All of this host's times are booked. Try another challenge.", 'Kaikki tämän yrityksen ajat on varattu. Kokeile toista haastetta.', 'Alla den här värdens tider är bokade. Prova en annan utmaning.'))}</p>`}
        </fieldset>
        <p class="small muted">${esc(L(
          'The host accepts or declines, then the City of Espoo event team confirms the time. Your name is shared only after the host accepts.',
          'Yritys hyväksyy tai hylkää pyynnön, minkä jälkeen Espoon kaupungin tapahtumatiimi vahvistaa ajan. Nimesi jaetaan vasta, kun yritys hyväksyy.',
          'Värden godkänner eller avböjer, sedan bekräftar Esbo stads evenemangsteam tiden. Ditt namn delas först när värden godkänner.',
        ))}</p>
        <div class="row row--end">
          <button type="button" class="btn btn--ghost" data-close>${esc(L('Cancel', 'Peruuta', 'Avbryt'))}</button>
          <button type="submit" class="btn btn--primary" ${slots.length ? '' : 'disabled'}>${esc(L('Send request ({n} of {cap})', 'Lähetä pyyntö ({n}/{cap})', 'Skicka förfrågan ({n} av {cap})', { n: used + 1, cap: REQUEST_CAP }))}</button>
        </div>
      </form>`,
    onBind: (dlg, close) => {
      dlg.querySelector('#req-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const res = requestMeeting(p.id, ch.id, fd.get('slot'), fd.get('mformat'));
        if (!res.ok) return toast(res.error, 'error');
        close();
        toast(
          L('Request sent to {host}. {n} of {cap} used.', 'Pyyntö lähetetty yritykselle {host}. {n}/{cap} käytetty.', 'Förfrågan skickad till {host}. {n} av {cap} använda.', { host: c.name, n: activeRequestCount(p.id), cap: REQUEST_CAP }),
          'ok',
          employerAction(c.id, 'meetings'),
        );
      });
    },
  });
}

function renderMeetings(state) {
  const p = currentParticipant();
  if (!p) return noParticipant();
  const mine = state.meetings.filter((m) => m.participantId === p.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const invites = mine.filter((m) => m.initiator === 'host' && m.partyStatus === 'invited');
  const requests = mine.filter((m) => m.initiator === 'participant');
  const others = mine.filter((m) => m.initiator === 'host' && m.partyStatus !== 'invited');
  const confirmed = mine.filter(isConfirmed);
  const used = activeRequestCount(p.id);
  const requestable = state.challenges.filter((ch) => !existingMeeting(p.id, ch.id));

  const row = (m, actions) => {
    const ch = challenge(m.challengeId);
    return `<li>
      <div class="list__main"><h4>${esc(company(m.companyId).name)}</h4><p>${esc(ch.title)}</p><p>${esc(slotLabel(m.slotId))}, ${esc(placeLabel(state.slots.find((s) => s.id === m.slotId)?.location))}</p><div style="margin-top:var(--s2)">${formatBadge(m.format)}</div></div>
      ${statusPill(m)}
      <div class="list__actions">${actions || ''}</div>
    </li>`;
  };

  return `
  <div class="split">
    <div>
      ${invites.length ? `<section class="section" aria-labelledby="inv-h">
        <div class="section__head"><h2 id="inv-h">${esc(L('Invitations for you', 'Kutsut sinulle', 'Inbjudningar till dig'))}</h2><p class="small muted">${esc(L('A host read your thinking and wants to talk.', 'Yritys luki ajatteluasi ja haluaa keskustella.', 'En värd har läst ditt tänkande och vill prata.'))}</p></div>
        <ul class="list">${invites.map((m) => row(m, `<button type="button" class="btn btn--sm btn--pine" data-accept="${m.id}">${esc(L('Accept and share my name', 'Hyväksy ja jaa nimeni', 'Tacka ja och dela mitt namn'))}</button><button type="button" class="btn btn--sm btn--ghost" data-decline="${m.id}">${esc(L('Decline', 'Kieltäydy', 'Tacka nej'))}</button>`)).join('')}</ul>
        <p class="small muted" style="margin-top:var(--s2)">${esc(L("Accepting shares your name and email with that host only. Invitations don't use your request quota.", 'Hyväksyminen jakaa nimesi ja sähköpostisi vain tälle yritykselle. Kutsut eivät kuluta pyyntökiintiötäsi.', 'Att tacka ja delar ditt namn och din e-post bara med den värden. Inbjudningar räknas inte mot din kvot.'))}</p>
      </section>` : ''}

      <section class="section" aria-labelledby="req-h">
        <div class="section__head"><h2 id="req-h">${esc(L('Your requests', 'Pyyntösi', 'Dina förfrågningar'))}</h2><p class="small muted">${esc(L('Oldest first.', 'Vanhin ensin.', 'Äldst först.'))}</p></div>
        ${requests.length ? `<ul class="list">${requests.map((m) => row(m, m.partyStatus === 'requested' || (m.partyStatus === 'accepted' && m.organizerStatus === 'pending') ? `<button type="button" class="btn btn--sm btn--ghost" data-cancel="${m.id}">${esc(L('Cancel request', 'Peru pyyntö', 'Avbryt förfrågan'))}</button>` : '')).join('')}</ul>` : `<div class="empty"><h3>${esc(L('No requests yet', 'Ei vielä pyyntöjä', 'Inga förfrågningar ännu'))}</h3><p>${esc(L('You can request up to {n} conversations.', 'Voit pyytää enintään {n} keskustelua.', 'Du kan be om upp till {n} samtal.', { n: REQUEST_CAP }))}</p></div>`}
      </section>

      ${others.length ? `<section class="section" aria-labelledby="oth-h"><div class="section__head"><h2 id="oth-h">${esc(L('Invitations you answered', 'Vastaamasi kutsut', 'Inbjudningar du har svarat på'))}</h2></div><ul class="list">${others.map((m) => row(m)).join('')}</ul></section>` : ''}

      <section class="section" aria-labelledby="new-h">
        <div class="section__head"><h2 id="new-h">${esc(L('Request a new conversation', 'Pyydä uutta keskustelua', 'Be om ett nytt samtal'))}</h2></div>
        ${used >= REQUEST_CAP
          ? `<div class="notice notice--amber"><div><p class="notice__title">${esc(L("You've used all {n} requests", 'Olet käyttänyt kaikki {n} pyyntöä', 'Du har använt alla {n} förfrågningar', { n: REQUEST_CAP }))}</p><p>${esc(L('Cancel a request above to free one. The limit keeps conversations meaningful for everyone, and hosts can still invite you.', 'Peru jokin yllä olevista pyynnöistä vapauttaaksesi yhden. Raja pitää keskustelut merkityksellisinä kaikille, ja yritykset voivat silti kutsua sinut.', 'Avbryt en förfrågan ovan för att frigöra en. Gränsen håller samtalen meningsfulla för alla, och värdarna kan fortfarande bjuda in dig.'))}</p></div></div>`
          : requestable.length
            ? `<ul class="list">${requestable.map((ch) => `<li><div class="list__main"><h4>${esc(company(ch.companyId).name)}</h4><p>${esc(ch.title)}</p><div style="margin-top:var(--s2)">${formatBadges(ch.formats)}</div></div>${langBadge(ch.language)}<div class="list__actions"><button type="button" class="btn btn--sm btn--secondary" data-request="${ch.id}">${esc(L('Request', 'Pyydä', 'Be om'))}<span class="sr-only"> ${esc(L('a conversation with {host}', 'keskustelua yrityksen {host} kanssa', 'ett samtal med {host}', { host: company(ch.companyId).name }))}</span></button></div></li>`).join('')}</ul>`
            : `<p class="muted">${esc(L('You have an open conversation with every host.', 'Sinulla on avoin keskustelu jokaisen yrityksen kanssa.', 'Du har ett öppet samtal med varje värd.'))}</p>`}
      </section>

      ${confirmed.length ? `<section class="section" aria-labelledby="after-h">
        <div class="section__head"><h2 id="after-h">${esc(L('After your conversations', 'Keskustelujesi jälkeen', 'Efter dina samtal'))}</h2><p class="small muted">${esc(L('Your answer is private. The host only learns the outcome if you both choose to continue.', 'Vastauksesi on yksityinen. Yritys saa tietää lopputuloksen vain, jos molemmat haluatte jatkaa.', 'Ditt svar är privat. Värden får bara veta utfallet om ni båda vill fortsätta.'))}</p></div>
        <ul class="list">${confirmed.map((m) => afterRow(state, m)).join('')}</ul>
      </section>` : ''}
    </div>
    <aside class="stack">
      <div class="panel">${quotaBar(used)}<p class="small muted" style="margin-top:var(--s3)">${esc(L("Requests you send count toward the limit until they're declined or you cancel them.", 'Lähettämäsi pyynnöt lasketaan rajaan, kunnes ne hylätään tai perut ne.', 'Förfrågningar du skickar räknas mot gränsen tills de avböjs eller du avbryter dem.'))}</p></div>
      <div class="panel">
        <h3>${esc(L('Your schedule', 'Aikataulusi', 'Ditt schema'))}</h3>
        ${confirmed.length ? `<ul class="list" style="border:0">${confirmed.map((m) => `<li style="padding:var(--s3) 0"><div class="list__main"><h4>${esc(slotLabel(m.slotId))}</h4><p>${esc(company(m.companyId).name)}, ${esc(fmtOf(m.format).label)}</p></div></li>`).join('')}</ul><button type="button" class="btn btn--secondary btn--sm" id="my-ics" style="margin-top:var(--s3)">${esc(L('Download calendar file (.ics)', 'Lataa kalenteritiedosto (.ics)', 'Ladda ner kalenderfil (.ics)'))}</button>` : `<p class="small muted">${esc(L('Confirmed conversations appear here.', 'Vahvistetut keskustelut näkyvät tässä.', 'Bekräftade samtal visas här.'))}</p>`}
      </div>
      <div class="panel panel--quiet"><h3>${esc(L('Moving here, or building something?', 'Muutatko tänne tai rakennatko jotain?', 'Flyttar du hit eller bygger du något?'))}</h3><p class="small">${esc(L('Career, relocation, business and R&D support is open to everyone.', 'Ura-, muutto-, yritys- ja T&K-tuki on avoinna kaikille.', 'Stöd för karriär, flytt, företagande och FoU är öppet för alla.'))} <a href="#/participant/support">${esc(L('Ecosystem support', 'Ekosysteemin tuki', 'Stöd i ekosystemet'))}</a></p></div>
    </aside>
  </div>`;
}

function afterRow(state, m) {
  const f = state.feedback[m.id] || {};
  const outcome = feedbackOutcome(m.id);
  const c = company(m.companyId);
  const choice = f.participant;
  const contact = `${c.hostName || L('the host', 'yritys', 'värden')}${c.hostRole ? `, ${c.hostRole}` : ''} (${c.hostEmail || ''})`;
  return `<li>
    <div class="list__main"><h4>${esc(c.name)}</h4><p>${esc(L('Would you like to continue outside Skillink? For example a job interview, an R&D project or pilot scoping.', 'Haluaisitko jatkaa Skillinkin ulkopuolella? Esimerkiksi työhaastattelu, T&K-projekti tai pilotin rajaus.', 'Vill du fortsätta utanför Skillink? Till exempel en anställningsintervju, ett FoU-projekt eller en pilotavgränsning.'))}</p>
      ${outcome === 'mutual' ? `<p style="color:var(--pine-700);font-weight:700;margin-top:4px">${esc(L('You both chose to continue. Contact: {contact}', 'Molemmat halusitte jatkaa. Yhteyshenkilö: {contact}', 'Ni båda valde att fortsätta. Kontakt: {contact}', { contact }))}</p>` : ''}
    </div>
    <div class="list__actions" role="group" aria-label="${esc(L('Your private choice for {host}', 'Yksityinen valintasi: {host}', 'Ditt privata val för {host}', { host: c.name }))}">
      <button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="continue" aria-pressed="${choice === 'continue'}">${esc(L("Let's continue", 'Jatketaan', 'Vi fortsätter'))}</button>
      <button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="notnow" aria-pressed="${choice === 'notnow'}">${esc(L('Not now', 'Ei nyt', 'Inte nu'))}</button>
    </div>
  </li>`;
}

function bindMeetings(root) {
  root.querySelectorAll('[data-accept]').forEach((b) =>
    b.addEventListener('click', () => {
      respondToMeeting(b.dataset.accept, true);
      toast(L('Accepted. The host can now see your name and email. The event team will confirm the time.', 'Hyväksytty. Yritys näkee nyt nimesi ja sähköpostisi. Tapahtumatiimi vahvistaa ajan.', 'Accepterat. Värden kan nu se ditt namn och din e-post. Evenemangsteamet bekräftar tiden.'), 'ok', employerAction(meeting(b.dataset.accept)?.companyId, 'meetings'));
    }),
  );
  root.querySelectorAll('[data-decline]').forEach((b) =>
    b.addEventListener('click', () => {
      respondToMeeting(b.dataset.decline, false);
      toast(L('Invitation declined. The host is not told why.', 'Kutsusta kieltäydytty. Yritykselle ei kerrota syytä.', 'Inbjudan avböjd. Värden får inte veta varför.'), 'ok', employerAction(meeting(b.dataset.decline)?.companyId, 'meetings'));
    }),
  );
  root.querySelectorAll('[data-cancel]').forEach((b) =>
    b.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: L('Cancel this request?', 'Perutaanko pyyntö?', 'Avbryta förfrågan?'),
        message: esc(L('The host will no longer see it, and one request is freed up.', 'Yritys ei enää näe sitä, ja yksi pyyntö vapautuu.', 'Värden ser den inte längre, och en förfrågan frigörs.')),
        confirmLabel: L('Cancel request', 'Peru pyyntö', 'Avbryt förfrågan'),
      });
      if (ok) {
        cancelMeeting(b.dataset.cancel);
        toast(L('Request cancelled. One request freed up.', 'Pyyntö peruttu. Yksi pyyntö vapautui.', 'Förfrågan avbruten. En förfrågan frigjord.'));
      }
    }),
  );
  root.querySelectorAll('[data-fb]').forEach((b) =>
    b.addEventListener('click', () => {
      setFeedback(b.dataset.fb, 'participant', b.dataset.choice);
      toast(L('Your private choice is saved.', 'Yksityinen valintasi on tallennettu.', 'Ditt privata val är sparat.'));
    }),
  );
  root.querySelector('#my-ics')?.addEventListener('click', () => {
    const p = currentParticipant();
    const ms = getState().meetings.filter((m) => m.participantId === p.id && isConfirmed(m));
    downloadFile(`skillink-${p.pseudo}.ics`, 'text/calendar;charset=utf-8', buildIcs(ms));
    toast(L('Calendar file downloaded.', 'Kalenteritiedosto ladattu.', 'Kalenderfilen har laddats ner.'));
  });
}

// ---------- dual-track ecosystem support hub ----------
// [en, fi, sv] triples; organisation names stay as they are.
const T3 = (en, fi, sv) => ({ en, fi, sv });
const SUPPORT = {
  talent: {
    tab: T3('International talent & career', 'Kansainväliset osaajat ja ura', 'Internationella talanger och karriär'),
    title: T3('Support for international talent and careers', 'Tukea kansainvälisille osaajille ja uralle', 'Stöd för internationella talanger och karriärer'),
    lede: T3(
      'If a conversation turns into a job offer in Espoo, these public services help with moving, family, language and building your career here. They are free and open to everyone.',
      'Jos keskustelusta tulee työtarjous Espoossa, nämä julkiset palvelut auttavat muutossa, perheasioissa, kielessä ja uran rakentamisessa täällä. Ne ovat maksuttomia ja avoimia kaikille.',
      'Om ett samtal leder till ett jobberbjudande i Esbo hjälper de här offentliga tjänsterna med flytt, familj, språk och att bygga din karriär här. De är kostnadsfria och öppna för alla.',
    ),
    links: [
      { t: T3('Work in Finland', 'Work in Finland', 'Work in Finland'), d: T3('The national service for international talent: finding work, moving, permits, and the Spouse Program for partners looking for work too.', 'Kansallinen palvelu kansainvälisille osaajille: työnhaku, muutto, luvat sekä Spouse Program puolisoille, jotka myös etsivät työtä.', 'Den nationella tjänsten för internationella talanger: jobbsökning, flytt, tillstånd och Spouse Program för partner som också söker arbete.'), href: 'https://www.workinfinland.com/en' },
      { t: T3('Talent Espoo at Espoo Talent Hub', 'Talent Espoo, Espoo Talent Hub', 'Talent Espoo vid Espoo Talent Hub'), d: T3("Espoo's Talent Boost services for international professionals: career guidance, networks and help connecting with employers.", 'Espoon Talent Boost -palvelut kansainvälisille ammattilaisille: uraohjausta, verkostoja ja apua työnantajien tavoittamiseen.', 'Esbos Talent Boost-tjänster för internationella yrkespersoner: karriärvägledning, nätverk och hjälp att komma i kontakt med arbetsgivare.'), href: 'https://www.espoo.fi/en/espootalenthub' },
      { t: T3('City of Espoo international services', 'Espoon kaupungin palvelut kansainvälisille asukkaille', 'Esbo stads tjänster för internationella invånare'), d: T3('Settling in Espoo: housing, schools and daycare, health services, and advice in many languages.', 'Asettuminen Espooseen: asuminen, koulut ja varhaiskasvatus, terveyspalvelut sekä neuvontaa monilla kielillä.', 'Att bosätta sig i Esbo: boende, skolor och dagvård, hälsotjänster och rådgivning på många språk.'), href: 'https://www.espoo.fi/en' },
      { t: T3('InfoFinland', 'InfoFinland', 'InfoFinland'), d: T3('Plain-language guides in more than ten languages, including Finnish and Swedish courses near you.', 'Selkeitä oppaita yli kymmenellä kielellä, mukaan lukien suomen ja ruotsin kielen kurssit lähelläsi.', 'Guider på klarspråk på fler än tio språk, bland annat kurser i finska och svenska nära dig.'), href: 'https://www.infofinland.fi/en' },
    ],
    faq: [
      [T3('My partner is moving too. Is there help for them?', 'Puolisoni muuttaa myös. Saako hän apua?', 'Min partner flyttar också. Finns det hjälp för hen?'), T3("Yes. Work in Finland's Spouse Program connects partners with employers, networks and career coaching in the Helsinki region, including Espoo.", 'Kyllä. Work in Finlandin Spouse Program yhdistää puolisot työnantajiin, verkostoihin ja uravalmennukseen pääkaupunkiseudulla, myös Espoossa.', 'Ja. Work in Finlands Spouse Program kopplar ihop partner med arbetsgivare, nätverk och karriärcoachning i huvudstadsregionen, även i Esbo.')],
      [T3('Do I need to speak Finnish?', 'Pitääkö minun osata suomea?', 'Måste jag kunna finska?'), T3('Every challenge states its real language requirement. Many teams work in English. If you would like to learn Finnish or Swedish, Espoo offers courses for adults, from beginner level.', 'Jokainen haaste kertoo todellisen kielivaatimuksensa. Monet tiimit työskentelevät englanniksi. Jos haluat opiskella suomea tai ruotsia, Espoo tarjoaa kursseja aikuisille alkeista alkaen.', 'Varje utmaning anger sitt verkliga språkkrav. Många team arbetar på engelska. Om du vill lära dig finska eller svenska erbjuder Esbo kurser för vuxna, från nybörjarnivå.')],
      [T3('What about residence permits?', 'Entä oleskeluluvat?', 'Hur är det med uppehållstillstånd?'), T3('Work in Finland and the Finnish Immigration Service explain the routes, including the fast track for specialists. Your future employer can usually help with the application.', 'Work in Finland ja Maahanmuuttovirasto kertovat vaihtoehdoista, mukaan lukien erityisasiantuntijoiden nopean väylän. Tuleva työnantajasi voi yleensä auttaa hakemuksessa.', 'Work in Finland och Migrationsverket förklarar vägarna, bland annat snabbspåret för specialister. Din framtida arbetsgivare kan oftast hjälpa till med ansökan.')],
    ],
  },
  business: {
    tab: T3('Business, R&D & innovation', 'Liiketoiminta, T&K ja innovaatiot', 'Företagande, FoU och innovation'),
    title: T3('Support for pilots, R&D partnerships and founders', 'Tukea piloteille, T&K-kumppanuuksille ja perustajille', 'Stöd för piloter, FoU-partnerskap och grundare'),
    lede: T3(
      'If a conversation turns into a pilot, a research project or a new company, these services help you take the next step in the Espoo innovation ecosystem.',
      'Jos keskustelusta syntyy pilotti, tutkimusprojekti tai uusi yritys, nämä palvelut auttavat ottamaan seuraavan askeleen Espoon innovaatioekosysteemissä.',
      'Om ett samtal leder till en pilot, ett forskningsprojekt eller ett nytt företag hjälper de här tjänsterna dig att ta nästa steg i Esbos innovationsekosystem.',
    ),
    links: [
      { t: T3('Business Espoo', 'Business Espoo', 'Business Espoo'), d: T3('Free business advice for companies and founders in Espoo, from starting up to growth, funding and internationalisation.', 'Maksutonta yritysneuvontaa espoolaisille yrityksille ja perustajille aloittamisesta kasvuun, rahoitukseen ja kansainvälistymiseen.', 'Kostnadsfri företagsrådgivning för företag och grundare i Esbo, från start till tillväxt, finansiering och internationalisering.'), href: 'https://www.espoo.fi/en/business-espoo-helping-companies-thrive' },
      { t: T3('Enter Espoo', 'Enter Espoo', 'Enter Espoo'), d: T3("Espoo's company for international growth: helps companies, investors and innovators find opportunities in the local deep-tech ecosystem.", 'Espoon kansainvälisen kasvun yhtiö: auttaa yrityksiä, sijoittajia ja innovaattoreita löytämään mahdollisuuksia paikallisesta syväteknologian ekosysteemistä.', 'Esbos bolag för internationell tillväxt: hjälper företag, investerare och innovatörer att hitta möjligheter i det lokala deep tech-ekosystemet.'), href: 'https://www.enterespoo.fi/' },
      { t: T3('Aalto University', 'Aalto-yliopisto', 'Aalto-universitetet'), d: T3('Research collaboration, thesis partnerships and innovation services on the Otaniemi campus.', 'Tutkimusyhteistyötä, opinnäytetyökumppanuuksia ja innovaatiopalveluja Otaniemen kampuksella.', 'Forskningssamarbete, partnerskap kring examensarbeten och innovationstjänster på campus i Otnäs.'), href: 'https://www.aalto.fi/en' },
      { t: T3('VTT Technical Research Centre of Finland', 'Teknologian tutkimuskeskus VTT', 'VTT Teknologiska forskningscentralen'), d: T3('Joint R&D, piloting facilities and research partnerships for companies of every size.', 'Yhteistä T&K:ta, pilotointiympäristöjä ja tutkimuskumppanuuksia kaikenkokoisille yrityksille.', 'Gemensam FoU, pilotanläggningar och forskningspartnerskap för företag av alla storlekar.'), href: 'https://www.vttresearch.com/en' },
    ],
    faq: [
      [T3('Our pilot conversation went well. What comes next?', 'Pilottikeskustelumme sujui hyvin. Mitä seuraavaksi?', 'Vårt pilotsamtal gick bra. Vad händer nu?'), T3('Agree the scope, data access and who owns what before you start. Business Espoo advisers can help small companies with agreements and funding options. Public-sector hosts may need a procurement step, which they will explain.', 'Sopikaa laajuudesta, datan käytöstä ja omistuksista ennen aloittamista. Business Espoon neuvojat voivat auttaa pieniä yrityksiä sopimuksissa ja rahoitusvaihtoehdoissa. Julkisen sektorin julkaisijat voivat tarvita hankintavaiheen, jonka he selittävät.', 'Kom överens om omfattning, tillgång till data och vem som äger vad innan ni börjar. Business Espoos rådgivare kan hjälpa små företag med avtal och finansieringsalternativ. Värdar inom offentlig sektor kan behöva ett upphandlingssteg, som de förklarar.')],
      [T3('Can a thesis or joint research project come out of this?', 'Voiko tästä syntyä opinnäytetyö tai yhteinen tutkimusprojekti?', 'Kan ett examensarbete eller ett gemensamt forskningsprojekt komma ut av det här?'), T3("Yes. If a host and a researcher both choose to continue, the university's thesis and research-agreement process applies. Talk about data, publication and IP early.", 'Kyllä. Jos yritys ja tutkija haluavat molemmat jatkaa, sovelletaan yliopiston opinnäytetyö- ja tutkimussopimusprosessia. Puhukaa datasta, julkaisemisesta ja immateriaalioikeuksista ajoissa.', 'Ja. Om en värd och en forskare båda vill fortsätta gäller universitetets process för examensarbeten och forskningsavtal. Prata om data, publicering och immateriella rättigheter tidigt.')],
      [T3('We are a small team from abroad. Where do we start?', 'Olemme pieni tiimi ulkomailta. Mistä aloitamme?', 'Vi är ett litet team från utlandet. Var börjar vi?'), T3('Enter Espoo and Business Espoo help international founders and companies get started in Espoo. Skillink never asks how big your team is or how you are funded.', 'Enter Espoo ja Business Espoo auttavat kansainvälisiä perustajia ja yrityksiä aloittamaan Espoossa. Skillink ei koskaan kysy tiiminne kokoa tai rahoitustanne.', 'Enter Espoo och Business Espoo hjälper internationella grundare och företag att komma igång i Esbo. Skillink frågar aldrig hur stort ert team är eller hur ni finansieras.')],
    ],
  },
};

function supportPanel(key) {
  const s = SUPPORT[key];
  return `<div class="tabpanel" role="tabpanel" id="sp-${key}" aria-labelledby="st-${key}" tabindex="0" ${supportTab === key ? '' : 'hidden'}>
    <h2>${esc(tr(s.title))}</h2>
    <p class="lede" style="margin-top:0">${esc(tr(s.lede))}</p>
    <ul class="list">${s.links
      .map((l) => `<li><div class="list__main"><h4>${esc(tr(l.t))}</h4><p>${esc(tr(l.d))}</p></div><div class="list__actions"><a class="btn btn--sm btn--secondary" href="${l.href}" target="_blank" rel="noopener noreferrer">${esc(L('Open {name}', 'Avaa {name}', 'Öppna {name}', { name: tr(l.t) }))}<span class="sr-only"> ${esc(L('(opens in a new tab)', '(avautuu uuteen välilehteen)', '(öppnas i en ny flik)'))}</span></a></div></li>`)
      .join('')}</ul>
    <section class="section" aria-labelledby="faq-${key}">
      <h3 id="faq-${key}">${esc(L('Common questions after a match', 'Yleisiä kysymyksiä yhteyden syntymisen jälkeen', 'Vanliga frågor efter en matchning'))}</h3>
      ${s.faq.map(([q, a]) => `<details class="disclosure"><summary>${esc(tr(q))}</summary><p>${esc(tr(a))}</p></details>`).join('')}
    </section>
  </div>`;
}

function renderSupport(arg) {
  if (arg === 'business' || arg === 'talent') supportTab = arg;
  return `
  <div class="split">
    <div>
      <h1>${esc(L('Espoo ecosystem support', 'Espoon ekosysteemin tuki', 'Stöd i Esbos ekosystem'))}</h1>
      <p class="lede">${esc(L('Two tracks, one rule: the same help for everyone, whatever brought you to the event.', 'Kaksi polkua, yksi sääntö: sama apu kaikille, toi sinut tapahtumaan mikä tahansa.', 'Två spår, en regel: samma hjälp för alla, oavsett vad som förde dig till evenemanget.'))}</p>
      <div class="notice" style="margin:var(--s5) 0"><div><p class="notice__title">${esc(L("We never ask where you're from or how big your team is", 'Emme koskaan kysy, mistä olet kotoisin tai kuinka suuri tiimisi on', 'Vi frågar aldrig var du kommer ifrån eller hur stort ditt team är'))}</p><p>${esc(L("Skillink doesn't collect nationality, background, age, gender, photos, company size or funding. Both tabs are shown to every solver, and using them tells nobody anything about you.", 'Skillink ei kerää kansallisuutta, taustaa, ikää, sukupuolta, valokuvia, yrityksen kokoa tai rahoitusta. Molemmat välilehdet näytetään jokaiselle ratkaisijalle, eikä niiden käyttö kerro sinusta kenellekään mitään.', 'Skillink samlar inte in nationalitet, bakgrund, ålder, kön, foton, företagsstorlek eller finansiering. Båda flikarna visas för alla lösare, och att använda dem avslöjar ingenting om dig.'))}</p></div></div>
      <div class="ptabs" role="tablist" aria-label="${esc(L('Support tracks', 'Tukipolut', 'Stödspår'))}">
        ${Object.entries(SUPPORT).map(([k, s]) => `<button type="button" role="tab" class="ptab" id="st-${k}" aria-controls="sp-${k}" aria-selected="${supportTab === k}" tabindex="${supportTab === k ? 0 : -1}" data-stab="${k}">${esc(tr(s.tab))}</button>`).join('')}
      </div>
      ${Object.keys(SUPPORT).map(supportPanel).join('')}
    </div>
    <aside class="panel panel--trust">
      <h3>${esc(L('Why this is here', 'Miksi tämä on täällä', 'Varför det här finns här'))}</h3>
      <p class="small">${esc(L('Espoo wants talent to stay and ideas to grow here, not just arrive for one event day. Practical support is part of a fair process, and it is offered the same way to everyone.', 'Espoo haluaa osaajien jäävän ja ideoiden kasvavan täällä, ei vain saapuvan yhdeksi tapahtumapäiväksi. Käytännön tuki on osa reilua prosessia, ja sitä tarjotaan kaikille samalla tavalla.', 'Esbo vill att talanger stannar och idéer växer här, inte bara kommer för en evenemangsdag. Praktiskt stöd är en del av en rättvis process, och det erbjuds alla på samma sätt.'))}</p>
    </aside>
  </div>`;
}

function bindSupport(root) {
  const tabsEls = [...root.querySelectorAll('[data-stab]')];
  const select = (btn, focus) => {
    supportTab = btn.dataset.stab;
    tabsEls.forEach((t) => {
      const on = t === btn;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      root.querySelector(`#sp-${t.dataset.stab}`).hidden = !on;
    });
    if (focus) btn.focus();
  };
  tabsEls.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        select(tabsEls[e.key === 'Home' ? 0 : tabsEls.length - 1], true);
      } else if (dir) {
        e.preventDefault();
        select(tabsEls[(i + dir + tabsEls.length) % tabsEls.length], true);
      }
    });
  });
}

function noParticipant() {
  return `<div class="empty"><h2>${esc(L('No solver data in this demo', 'Tässä demossa ei ole ratkaisijan tietoja', 'Inga lösaruppgifter i den här demon'))}</h2><p>${esc(L(
    'Personal data from the last event was deleted after the 30-day retention period. Start as a new solver from the bar above, or reset the demo data.',
    'Edellisen tapahtuman henkilötiedot poistettiin 30 päivän säilytysajan jälkeen. Aloita uutena ratkaisijana yllä olevasta palkista tai palauta demodata.',
    'Personuppgifterna från förra evenemanget raderades efter lagringstiden på 30 dagar. Börja som ny lösare i fältet ovan eller återställ demodata.',
  ))}</p></div>`;
}
