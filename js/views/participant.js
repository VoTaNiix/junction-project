import { esc, fmtDate, fmtDateTime, toast, openDialog, confirmDialog, LANGS, richText } from '../ui.js';
import { skill } from '../esco.js';
import {
  getState, currentParticipant, challenge, company, activeRequestCount, REQUEST_CAP, requestMeeting,
  respondToMeeting, cancelMeeting, toggleBookmark, findSubmission, saveSubmission, withdrawSubmission,
  deleteDraft, freeSlots, existingMeeting, isConfirmed, setFeedback, createParticipant, feedbackOutcome,
  deleteParticipantData, meeting,
} from '../store.js';
import { FORMATS, INTENTS, WORK_LANGS, format as fmtOf, allowedIntents, defaultFormatFor } from '../formats.js';
import { challengeCard, challengePreview, consentNotice, quotaBar, statusPill, slotLabel, PARTS, ICON, langBadge, verifiedBadge, formatBadges, formatBadge, intentBadge, formatChoice } from './shared.js';
import { buildIcs, downloadFile } from '../exports.js';
import { employerAction, showEmployerSide } from '../sides.js';

export const hiddenTabs = ['write', 'challenge'];
export const hiddenTabLabels = { write: 'Show your thinking', challenge: 'Challenge' };

/** Browser tab title for a challenge page. */
export function pageTitle(state, tab, arg) {
  const ch = (tab === 'challenge' || tab === 'write') && arg ? challenge(arg) : null;
  return ch ? (tab === 'write' ? `Show your thinking: ${ch.title}` : ch.title) : '';
}

export function tabs(state) {
  const p = currentParticipant();
  const invites = p ? state.meetings.filter((m) => m.participantId === p.id && m.partyStatus === 'invited').length : 0;
  return [
    { id: 'board', label: 'Problem board' },
    { id: 'workspace', label: 'My workspace' },
    { id: 'meetings', label: 'Conversations', count: invites },
    { id: 'support', label: 'Ecosystem support' },
  ];
}

export function context(state) {
  const p = currentParticipant();
  if (!p) return `<span>No solver data in this demo.</span> <button type="button" class="btn btn--sm btn--secondary" id="new-participant">Start as a new solver</button>`;
  return `<span>${ICON.lock}</span><span>You are <strong>Solver #${esc(p.pseudo)}</strong>. Hosts see only this ID, never your name, team or company, until you both agree to meet.</span>`;
}

export function bindContext(root) {
  root.querySelector('#new-participant')?.addEventListener('click', () => {
    createParticipant();
    toast('New solver created with a fresh pseudonymous ID.');
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
      openDialog({ title: 'Purpose-bound consent notice', body: consentNotice(getState()) });
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
      if (!p) return toast('Start as a solver first.', 'warn');
      const was = b.getAttribute('aria-pressed') === 'true';
      toggleBookmark(p.id, b.dataset.bookmark);
      toast(was ? 'Removed from saved challenges.' : 'Saved to your workspace.');
    }),
  );
  root.querySelectorAll('[data-request]').forEach((b) => b.addEventListener('click', () => openRequestDialog(b.dataset.request)));
}

/** Preview card with this solver's saved / shared state. */
function preview(state, ch) {
  const p = currentParticipant();
  const saved = !!p && (state.bookmarks[p.id] || []).includes(ch.id);
  const sub = p && findSubmission(p.id, ch.id);
  const status = sub ? (sub.status === 'submitted' ? 'Thinking shared' : 'Draft') : '';
  return challengePreview(ch, { saved, status });
}

/** Save button (and shared status) in the footer of the full challenge card. */
function cardActions(state, ch) {
  const p = currentParticipant();
  const saved = p && (state.bookmarks[p.id] || []).includes(ch.id);
  const sub = p && findSubmission(p.id, ch.id);
  const shared = sub && sub.status === 'submitted';
  return `
    ${shared ? '<span class="pill pill--ok">Thinking shared</span>' : ''}
    <button type="button" class="btn btn--ghost btn--sm bookmark" data-bookmark="${ch.id}" id="bm-${ch.id}" aria-pressed="${!!saved}">${saved ? ICON.heartFilled : ICON.heart}${saved ? 'Saved' : 'Save'}<span class="sr-only"> ${esc(ch.title)}</span></button>`;
}

// ---------- problem board ----------
function heroQuote(state) {
  const s = state.submissions.find((x) => x.id === 's-1' && x.status === 'submitted');
  if (s) {
    const ch = challenge(s.challengeId);
    const p = state.participants.find((x) => x.id === s.participantId);
    return { q: 'What happens if the forecast is wrong three days in a row?', by: `Solver #${p ? p.pseudo : 'ESP-2093'}, asking ${company(ch.companyId).name}`, note: 'Asked in Finnish, shown here in English' };
  }
  return { q: 'Who decides that trade-off?', by: 'A question a solver asked a host', note: '' };
}

const matchesFormat = (ch, f) => !f || (ch.formats || []).includes(f) || (ch.formats || []).includes('open');

function renderBoard(state) {
  const hq = heroQuote(state);
  const usedSkills = [...new Set(state.challenges.flatMap((c) => c.escoTags))].map(skill).sort((a, b) => a.label.localeCompare(b.label));
  const formatCount = (id) => state.challenges.filter((ch) => matchesFormat(ch, id)).length;
  const chip = (id, label, count) => `<label class="fchip${id ? ` fchip--${id}` : ''}"><input type="radio" name="f-format" value="${id}" ${filters.format === id ? 'checked' : ''}><span>${esc(label)} <span class="fchip__n">${count}</span></span></label>`;
  return `
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__copy">
      <p class="eyebrow">Pre-event matchmaking for ${esc(state.event.name)}</p>
      <h1 id="hero-title"><span>Less Résumé.</span><span>Less Pitch Deck.</span><span>More Real You.</span></h1>
      <p class="hero__q">Beyond CVs and cold pitches made with a single prompt, Skillink connects talent, researchers and innovators with companies through real-world challenges.</p>
      <div class="row">
        <button type="button" class="btn btn--primary" id="browse-challenges">Browse the ${state.challenges.length} challenges</button>
        <a class="btn btn--ghost" href="#/host/feed">${ICON.swap}See the employer's side</a>
      </div>
      <p class="small" style="margin-top:var(--s4)">First visit? <a href="#/guide/start">Follow the step-by-step guide</a>.</p>
      <ul class="cvlines" aria-label="What Skillink does not ask for">
        <li class="cvlines__label" aria-hidden="true">Not needed here</li>
        <li>Upload your CV and photo</li>
        <li>Attach your 20-slide pitch deck</li>
        <li>Native-level Finnish preferred</li>
        <li>Tell us your funding stage</li>
      </ul>
    </div>
    <div class="hero__visual" aria-label="Example">
      <img src="assets/people-working.webp" alt="Three people talking through an idea around a laptop in a sunlit room" width="1200" height="900" />
      <figure class="realq">
        <blockquote><p style="margin:0">“${esc(hq.q)}”</p></blockquote>
        <figcaption>${esc(hq.by)}${hq.note ? `. ${esc(hq.note)}.` : ''}</figcaption>
      </figure>
    </div>
  </section>

  <section class="section" id="challenges" aria-labelledby="ch-title" tabindex="-1">
    <div class="section__head">
      <div><p class="eyebrow">The problem board</p><h2 id="ch-title">Open challenges</h2></div>
      <p class="muted small">Real problems, not job ads. Open one to read the details. Listed by deadline, soonest first.</p>
    </div>
    <form class="filters" role="search" aria-label="Filter challenges" onsubmit="return false">
      <div class="filters__bar">
        <fieldset class="filters__formats">
          <legend class="sr-only">Collaboration format</legend>
          <div class="fchips">
            ${chip('', 'All formats', state.challenges.length)}
            ${FORMATS.map((f) => chip(f.id, f.label, formatCount(f.id))).join('')}
          </div>
        </fieldset>
        <div class="field filters__search">
          <label for="f-q" class="sr-only">Search challenges</label>
          <input id="f-q" type="search" placeholder="Search challenges, hosts or skills" value="${esc(filters.q)}" />
        </div>
      </div>
      <details class="morefilters" id="more-filters" ${moreFiltersOpen || filters.skill || filters.lang ? 'open' : ''}>
        <summary>More filters${filters.skill || filters.lang ? ' (on)' : ''}</summary>
        <div class="filters__row">
          <div class="field">
            <label for="f-skill">ESCO skill</label>
            <select id="f-skill"><option value="">All skills</option>${usedSkills.map((s) => `<option value="${s.id}" ${filters.skill === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select>
          </div>
          <div class="field">
            <label for="f-lang">Language you can work in</label>
            <select id="f-lang"><option value="">Any language</option>${WORK_LANGS.map((l) => `<option value="${l.id}" ${filters.lang === l.id ? 'selected' : ''}>${esc(l.label)}</option>`).join('')}</select>
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
        const hay = [ch.title, ch.summary, ch.context, ch.tricky, c?.name, ch.industry, ch.language, ...ch.escoTags.map((t) => skill(t).label), ...(ch.formats || []).map((f) => fmtOf(f).label)].join(' ').toLowerCase();
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
    : `<div class="empty"><h3>No challenges match these filters</h3><p>Try another format, skill or language, or <button type="button" class="linkbtn" id="clear-filters">clear all filters</button>.</p></div>`;
  const openIncluded = filters.format && filters.format !== 'open' ? list.filter((ch) => (ch.formats || []).includes('open') && !ch.formats.includes(filters.format)).length : 0;
  root.querySelector('#board-count').textContent = `${list.length} challenge${list.length === 1 ? '' : 's'} shown${openIncluded ? `, including ${openIncluded} Open Format challenge${openIncluded === 1 ? '' : 's'}` : ''}.`;
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

// ---------- one challenge, full details ----------
function renderChallenge(state, chId) {
  const ch = challenge(chId);
  if (!ch) return `<div class="empty"><h2>This challenge is no longer available</h2><p><a href="#/participant/board">Back to the problem board</a></p></div>`;
  const c = company(ch.companyId);
  const p = currentParticipant();
  const sub = p && findSubmission(p.id, ch.id);
  const m = p && existingMeeting(p.id, ch.id);
  const used = p ? activeRequestCount(p.id) : 0;
  const request = !p
    ? ''
    : m
      ? `<p class="small">Your conversation: ${statusPill(m)}</p>`
      : used >= REQUEST_CAP
        ? `<p class="small muted">You've used all ${REQUEST_CAP} conversation requests. <a href="#/participant/meetings">Cancel one</a> to request another.</p>`
        : `<button type="button" class="btn btn--secondary" data-request="${ch.id}">Request a conversation</button>`;
  return `
  <p class="crumbs small"><a href="#/participant/board">Problem board</a> <span aria-hidden="true">/</span> ${esc(ch.title)}</p>
  <div class="split">
    <div class="stack">
      ${challengeCard(ch, { actions: p ? cardActions(state, ch) : '' })}
    </div>
    <aside class="stack">
      <div class="panel">
        <h3>Your next step</h3>
        <p class="small">${sub && sub.status === 'submitted' ? `${esc(c.name)} can read your thinking under your solver ID.` : 'Show how you would tackle it: what you would do first, why, and what you would ask. Bullet points are fine.'}</p>
        <div class="row">
          <a class="btn btn--primary" href="#/participant/write/${ch.id}">${sub ? (sub.status === 'submitted' ? 'View your thinking' : 'Continue draft') : 'Show your thinking'}</a>
          ${request}
        </div>
        ${p ? `<div style="margin-top:var(--s4)">${quotaBar(used)}</div>` : ''}
      </div>
      <div class="panel panel--trust">
        <h3>The employer's side</h3>
        <p class="small">${esc(c.name)} reads shared thinking without names, oldest first, with no scores or rankings. Switch sides to see exactly what they see.</p>
        <button type="button" class="btn btn--ghost" data-employer-side="${esc(c.id)}">${ICON.swap}See it as ${esc(c.name)}</button>
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
    return `<li>
      <div class="list__main">
        <h4>${esc(ch.title)}</h4>
        <p>${esc(company(ch.companyId).name)}. ${kind === 'draft' ? `Private draft, last saved ${esc(fmtDateTime(s.updatedAt))}` : `Shared ${esc(fmtDateTime(s.submittedAt))} in ${esc(LANGS[s.lang]?.label || s.langOther || 'another language')}`}</p>
        <div style="margin-top:var(--s2)">${intentBadge(s.intent)}</div>
      </div>
      <div class="list__actions">
        <a class="btn btn--sm ${kind === 'draft' ? 'btn--primary' : 'btn--ghost'}" href="#/participant/write/${ch.id}">${kind === 'draft' ? 'Continue draft' : 'View'}<span class="sr-only">: ${esc(ch.title)}</span></a>
        ${kind === 'draft' ? `<button type="button" class="btn btn--sm btn--ghost" data-del-draft="${s.id}">Delete draft</button>` : ''}
      </div>
    </li>`;
  };
  return `
  <div class="split">
    <div>
      <section class="section" aria-labelledby="ws-drafts">
        <div class="section__head"><h2 id="ws-drafts">Private drafts</h2><p class="muted small">Only you can see drafts. Hosts never do.</p></div>
        ${drafts.length ? `<ul class="list">${drafts.map((s) => subRow(s, 'draft')).join('')}</ul>` : `<div class="empty"><h3>No drafts</h3><p>Pick a challenge on the <a href="#/participant/board">problem board</a> and start writing. Drafts save automatically.</p></div>`}
      </section>
      <section class="section" aria-labelledby="ws-shared">
        <div class="section__head"><h2 id="ws-shared">Thinking you've shared</h2></div>
        ${shared.length ? `<ul class="list">${shared.map((s) => subRow(s, 'shared')).join('')}</ul>` : `<div class="empty"><h3>Nothing shared yet</h3><p>When you share your thinking, the host sees it under your solver ID only.</p></div>`}
      </section>
      <section class="section" aria-labelledby="ws-saved">
        <div class="section__head"><h2 id="ws-saved">Saved challenges</h2></div>
        ${saved.length ? `<div class="grid grid--cards-2">${saved.map((ch) => preview(state, ch)).join('')}</div>` : `<div class="empty"><h3>No saved challenges</h3><p>Use the heart on any challenge to keep it here.</p></div>`}
      </section>
    </div>
    <aside class="stack">
      <div class="panel panel--trust">
        <h3>Substance over style</h3>
        <p class="small">Short answers and bullet points count exactly as much as polished paragraphs. No CV, no pitch deck, and nobody scores length, grammar or wording. Hosts read what you'd actually do.</p>
      </div>
      <div class="panel">${quotaBar(activeRequestCount(p.id))}<p class="small" style="margin-top:var(--s3)"><a href="#/participant/meetings">Manage conversation requests</a></p></div>
      <div class="panel">
        <h3>Your data</h3>
        <p class="small">Everything about you is deleted ${esc(String(state.event.retentionDays))} days after the event. You can also withdraw your consent now, which deletes your answers, drafts, saved challenges and conversations straight away.</p>
        <div class="row"><button type="button" class="btn btn--sm btn--ghost" data-consent-notice>Read the consent notice</button><button type="button" class="btn btn--sm btn--danger" id="withdraw-consent">Withdraw consent</button></div>
      </div>
    </aside>
  </div>`;
}

function bindWorkspace(root) {
  root.querySelector('#withdraw-consent')?.addEventListener('click', async () => {
    const p = currentParticipant();
    if (!p) return;
    const ok = await confirmDialog({
      title: `Withdraw consent for Solver #${p.pseudo}?`,
      message: 'Your answers, drafts, saved challenges and conversations are deleted now, without waiting 30 days. Anonymous counts are kept.',
      confirmLabel: 'Withdraw and delete',
      danger: true,
    });
    if (!ok) return;
    deleteParticipantData(p.id);
    toast('Consent withdrawn. Your data is deleted.');
  });
  root.querySelectorAll('[data-del-draft]').forEach((b) =>
    b.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Delete this draft?', message: 'The draft is deleted and cannot be recovered.', confirmLabel: 'Delete draft', danger: true });
      if (ok) {
        deleteDraft(b.dataset.delDraft);
        toast('Draft deleted.');
      }
    }),
  );
}

// ---------- "Show your thinking" editor ----------
const FORMAT_HINT = {
  bullets: 'One idea per line. Start lines with "- " if you like.',
  prose: 'A few sentences is plenty.',
};

function intentPicker(ch, current) {
  const allowed = allowedIntents(ch);
  const value = allowed.includes(current) ? current : 'open';
  return `<fieldset class="qblock intents">
    <legend>How are you approaching this challenge?</legend>
    <p class="hint" id="intent-h">The host sees this next to your answers. It is never used to sort or hide anyone.</p>
    <div class="intents__list">${INTENTS.map((it) => {
      const ok = allowed.includes(it.id);
      return `<label class="icard icard--${it.format}${ok ? '' : ' is-off'}">
        <input type="radio" name="intent" value="${it.id}" ${it.id === value ? 'checked' : ''} ${ok ? '' : 'disabled'} aria-describedby="intent-h${ok ? '' : ` off-${it.id}`}">
        <span class="icard__body"><strong>${esc(it.label)}</strong><span>${esc(it.desc)}</span>${ok ? '' : `<span class="icard__off" id="off-${it.id}">Not offered for this challenge</span>`}</span>
      </label>`;
    }).join('')}</div>
  </fieldset>`;
}

function renderWrite(state, chId) {
  const ch = challenge(chId);
  if (!ch) return `<div class="empty"><h2>This challenge is no longer available</h2><p><a href="#/participant/board">Back to the problem board</a></p></div>`;
  const p = currentParticipant();
  if (!p) return noParticipant();
  const c = company(ch.companyId);
  const sub = findSubmission(p.id, ch.id);
  const shared = sub && sub.status === 'submitted';
  const d = sub || { intent: 'open', lang: 'en', format: 'bullets', answers: { first: '', why: '', questions: '' }, skills: [] };
  const m = existingMeeting(p.id, ch.id);

  const head = `
    <p class="crumbs small"><a href="#/participant/board">Problem board</a> <span aria-hidden="true">/</span> <a href="#/participant/challenge/${ch.id}">${esc(ch.title)}</a> <span aria-hidden="true">/</span> Show your thinking</p>
    ${challengeCard(ch, { actions: '' })}`;

  if (shared) {
    return `<div class="split"><div class="stack">${head}
      <section class="section" aria-labelledby="your-thinking">
        <div class="notice notice--pine"><div>${verifiedBadge('Shared with ' + c.name)}<p class="small" style="margin-top:4px">Shared ${esc(fmtDateTime(sub.submittedAt))}. ${esc(c.name)} sees this as Solver #${esc(p.pseudo)}.</p></div></div>
        <h2 id="your-thinking" style="margin-top:var(--s5)">Your thinking</h2>
        <p>${intentBadge(sub.intent)}</p>
        ${PARTS.map((pt) => `<div class="qblock${pt.key === 'questions' ? ' qblock--core' : ''}"><h3><span class="qblock__n">${pt.n}</span>${esc(pt.label)}</h3>${richText(sub.answers[pt.key], sub.format)}</div>`).join('')}
        <div class="row" style="margin-top:var(--s4)">
          ${m ? `<span>Conversation: ${statusPill(m)}</span>` : `<button type="button" class="btn btn--primary" data-request="${ch.id}">Request a conversation</button>`}
          <button type="button" class="btn btn--ghost" id="withdraw" data-sub="${sub.id}">Withdraw and edit</button>
        </div>
      </section></div>${writeAside(state, p)}</div>`;
  }

  return `<div class="split"><div class="stack">${head}
    <form id="editor" class="editor" novalidate aria-labelledby="ed-title">
      <div class="section__head" style="margin:var(--s4) 0 0"><h2 id="ed-title">Show your thinking</h2><p class="muted small" id="save-state">${sub ? `Draft saved ${esc(fmtDateTime(sub.updatedAt))}` : 'Not saved yet'}</p></div>
      ${intentPicker(ch, d.intent)}
      <div class="row" style="gap:var(--s5);align-items:flex-end">
        <fieldset class="field">
          <legend>How do you want to write?</legend>
          <div class="seg">
            <label><input type="radio" name="format" value="bullets" ${d.format === 'bullets' ? 'checked' : ''}><span>Bullet points</span></label>
            <label><input type="radio" name="format" value="prose" ${d.format === 'prose' ? 'checked' : ''}><span>Short paragraphs</span></label>
          </div>
        </fieldset>
        <div class="field">
          <label for="ed-lang">Language you're writing in</label>
          <select id="ed-lang" name="lang" style="width:auto">
            ${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${d.lang === k ? 'selected' : ''}>${esc(v.label)}${k !== 'other' && k !== 'en' ? ` (${esc(v.native)})` : ''}</option>`).join('')}
          </select>
        </div>
        <div class="field" id="lang-other-wrap" ${d.lang === 'other' ? '' : 'hidden'}>
          <label for="ed-lang-other">Which language?</label>
          <input id="ed-lang-other" type="text" name="langOther" value="${esc(d.langOther || '')}" placeholder="e.g. Estonian" style="width:12rem" />
        </div>
      </div>
      <p class="callout">Write in the language you think best in. ${esc(c.name)} says: “${esc(ch.language)}”. If you write in another language, the host can open an EU-hosted machine translation next to your original words.</p>
      ${PARTS.map(
        (pt) => `<div class="qblock${pt.key === 'questions' ? ' qblock--core' : ''}">
          <h3><span class="qblock__n">${pt.n}</span><label for="ed-${pt.key}">${esc(pt.label)}</label></h3>
          ${pt.key === 'questions' ? `<p class="core-note">${ICON.person}<span><strong>This is the heart of Skillink.</strong> Your questions show how you think about their real situation, which no generic answer or AI-written pitch can copy. They open your live conversation.</span></p>` : ''}
          <p class="hint" id="h-${pt.key}">${FORMAT_HINT[d.format]}</p>
          <textarea id="ed-${pt.key}" name="${pt.key}" aria-describedby="h-${pt.key} e-${pt.key}" rows="5">${esc(d.answers[pt.key])}</textarea>
          <p class="field-error" id="e-${pt.key}" hidden></p>
        </div>`,
      ).join('')}
      <fieldset class="qblock">
        <legend style="margin-bottom:var(--s2)">Which of the host's ESCO skills are you drawing on? <span class="muted">(optional)</span></legend>
        <p class="hint" style="margin-bottom:var(--s3)">Used only for anonymous counts of which skills were offered at the event. Never to rank or filter you.</p>
        <div class="row">${ch.escoTags.map((id) => `<label class="choice"><input type="checkbox" name="skills" value="${id}" ${d.skills?.includes(id) ? 'checked' : ''}> ${esc(skill(id).label)}</label>`).join('')}</div>
      </fieldset>
      <div class="panel panel--quiet">
        <label class="choice" style="align-items:flex-start"><input type="checkbox" id="consent" style="margin-top:3px">
          <span><strong>I agree that my answers are used only to arrange conversations at ${esc(state.event.name)}, whether about a role, research or a pilot.</strong> ${esc(c.name)} sees them under my solver ID. My name, and any team or company I belong to, is shared only if we both agree to meet. Everything is deleted ${esc(String(state.event.retentionDays))} days after the event. <button type="button" class="linkbtn" data-consent-notice>Read the full notice</button>.</span>
        </label>
        <p class="field-error" id="e-consent" hidden>Tick the box to agree before sharing, or save as a private draft instead.</p>
      </div>
      <div class="row row--end">
        <button type="button" class="btn btn--ghost" id="save-draft">Save private draft</button>
        <button type="submit" class="btn btn--primary">Share with ${esc(c.name)}</button>
      </div>
    </form></div>${writeAside(state, p)}</div>`;
}

function writeAside(state, p) {
  return `<aside class="stack">
    <div class="panel panel--trust">
      <h3>Substance over style</h3>
      <p class="small">Three honest bullet points are as good as three paragraphs. Nobody scores length, grammar or polish, no AI ranks your answer, and a famous logo earns nothing here.</p>
    </div>
    <div class="panel">
      <h3>What the host sees</h3>
      <ul class="checks small">
        <li class="check" style="color:var(--pine-700)">${ICON.check}<p><strong>Your answers, solver ID and how you're approaching it</strong></p></li>
        <li class="check" style="color:var(--red-700)">${ICON.cross}<p><strong>Not your name, email, CV, photo, team or company</strong>until you both agree to meet</p></li>
        <li class="check" style="color:var(--red-700)">${ICON.cross}<p><strong>Not your age, gender, nationality, team size or funding</strong>Skillink never asks for them</p></li>
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
    const ok = await confirmDialog({ title: 'Withdraw your shared thinking?', message: 'The host will no longer see it. It goes back to your private drafts so you can edit and share again.', confirmLabel: 'Withdraw' });
    if (ok) {
      withdrawSubmission(e.target.dataset.sub);
      toast('Withdrawn. It is a private draft again.');
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
      saveState.textContent = 'Draft saved just now';
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
    toast('Private draft saved.');
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
      err.textContent = empty ? 'Write at least one line here. A single bullet point is enough.' : '';
      ta.setAttribute('aria-invalid', String(empty));
      if (empty && !firstBad) firstBad = ta;
    });
    const consent = form.querySelector('#consent');
    form.querySelector('#e-consent').hidden = consent.checked;
    if (!consent.checked && !firstBad) firstBad = consent;
    if (firstBad) {
      firstBad.focus();
      toast('Some parts need attention before sharing.', 'warn');
      return;
    }
    saveSubmission(p.id, chId, data, true);
    toast(`Shared with ${company(challenge(chId).companyId).name}.`, 'ok', employerAction(challenge(chId).companyId, 'feed'));
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
    toast(`You've used all ${REQUEST_CAP} requests. Cancel one on the Conversations tab to free a request.`, 'warn');
    return;
  }
  const slots = freeSlots(c.id);
  const sub = findSubmission(p.id, ch.id);
  openDialog({
    title: `Request a conversation with ${c.name}`,
    body: `
      ${quotaBar(used)}
      <p style="margin-top:var(--s4)">About: <strong>${esc(ch.title)}</strong></p>
      ${sub?.status === 'submitted' ? '<p class="small muted">Your shared thinking is attached to this request.</p>' : '<p class="notice notice--amber small">You haven\'t shared your thinking on this challenge yet. Requests with shared thinking give the host something real to talk about.</p>'}
      <form id="req-form">
        ${formatChoice(ch, defaultFormatFor(ch, sub?.intent))}
        <fieldset><legend>Pick a time at ${esc(getState().event.venue)}</legend>
          ${slots.length ? `<div class="slots">${slots.map((s, i) => `<label class="slot"><input type="radio" name="slot" value="${s.id}" ${i === 0 ? 'checked' : ''}><span>${esc(slotLabel(s.id).split(', ').pop())}<small>${esc(fmtDate(s.start, { weekday: true }))}</small></span></label>`).join('')}</div>` : '<p class="notice notice--amber">All of this host\'s times are booked. Try another challenge.</p>'}
        </fieldset>
        <p class="small muted">The host accepts or declines, then the City of Espoo event team confirms the time. Your name is shared only after the host accepts.</p>
        <div class="row row--end">
          <button type="button" class="btn btn--ghost" data-close>Cancel</button>
          <button type="submit" class="btn btn--primary" ${slots.length ? '' : 'disabled'}>Send request (${used + 1} of ${REQUEST_CAP})</button>
        </div>
      </form>`,
    onBind: (dlg, close) => {
      dlg.querySelector('#req-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const res = requestMeeting(p.id, ch.id, fd.get('slot'), fd.get('mformat'));
        if (!res.ok) return toast(res.error, 'error');
        close();
        toast(`Request sent to ${c.name}. ${activeRequestCount(p.id)} of ${REQUEST_CAP} used.`, 'ok', employerAction(c.id, 'meetings'));
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
      <div class="list__main"><h4>${esc(company(m.companyId).name)}</h4><p>${esc(ch.title)}</p><p>${esc(slotLabel(m.slotId))}, ${esc(state.slots.find((s) => s.id === m.slotId)?.location || '')}</p><div style="margin-top:var(--s2)">${formatBadge(m.format)}</div></div>
      ${statusPill(m)}
      <div class="list__actions">${actions || ''}</div>
    </li>`;
  };

  return `
  <div class="split">
    <div>
      ${invites.length ? `<section class="section" aria-labelledby="inv-h">
        <div class="section__head"><h2 id="inv-h">Invitations for you</h2><p class="small muted">A host read your thinking and wants to talk.</p></div>
        <ul class="list">${invites.map((m) => row(m, `<button type="button" class="btn btn--sm btn--pine" data-accept="${m.id}">Accept and share my name</button><button type="button" class="btn btn--sm btn--ghost" data-decline="${m.id}">Decline</button>`)).join('')}</ul>
        <p class="small muted" style="margin-top:var(--s2)">Accepting shares your name and email with that host only. Invitations don't use your request quota.</p>
      </section>` : ''}

      <section class="section" aria-labelledby="req-h">
        <div class="section__head"><h2 id="req-h">Your requests</h2><p class="small muted">Oldest first.</p></div>
        ${requests.length ? `<ul class="list">${requests.map((m) => row(m, m.partyStatus === 'requested' || (m.partyStatus === 'accepted' && m.organizerStatus === 'pending') ? `<button type="button" class="btn btn--sm btn--ghost" data-cancel="${m.id}">Cancel request</button>` : '')).join('')}</ul>` : `<div class="empty"><h3>No requests yet</h3><p>You can request up to ${REQUEST_CAP} conversations.</p></div>`}
      </section>

      ${others.length ? `<section class="section" aria-labelledby="oth-h"><div class="section__head"><h2 id="oth-h">Invitations you answered</h2></div><ul class="list">${others.map((m) => row(m)).join('')}</ul></section>` : ''}

      <section class="section" aria-labelledby="new-h">
        <div class="section__head"><h2 id="new-h">Request a new conversation</h2></div>
        ${used >= REQUEST_CAP ? `<div class="notice notice--amber"><div><p class="notice__title">You've used all ${REQUEST_CAP} requests</p><p>Cancel a request above to free one. The limit keeps conversations meaningful for everyone, and hosts can still invite you.</p></div></div>` : requestable.length ? `<ul class="list">${requestable.map((ch) => `<li><div class="list__main"><h4>${esc(company(ch.companyId).name)}</h4><p>${esc(ch.title)}</p><div style="margin-top:var(--s2)">${formatBadges(ch.formats)}</div></div>${langBadge(ch.language)}<div class="list__actions"><button type="button" class="btn btn--sm btn--secondary" data-request="${ch.id}">Request<span class="sr-only"> a conversation with ${esc(company(ch.companyId).name)}</span></button></div></li>`).join('')}</ul>` : '<p class="muted">You have an open conversation with every host.</p>'}
      </section>

      ${confirmed.length ? `<section class="section" aria-labelledby="after-h">
        <div class="section__head"><h2 id="after-h">After your conversations</h2><p class="small muted">Your answer is private. The host only learns the outcome if you both choose to continue.</p></div>
        <ul class="list">${confirmed.map((m) => afterRow(state, m)).join('')}</ul>
      </section>` : ''}
    </div>
    <aside class="stack">
      <div class="panel">${quotaBar(used)}<p class="small muted" style="margin-top:var(--s3)">Requests you send count toward the limit until they're declined or you cancel them.</p></div>
      <div class="panel">
        <h3>Your schedule</h3>
        ${confirmed.length ? `<ul class="list" style="border:0">${confirmed.map((m) => `<li style="padding:var(--s3) 0"><div class="list__main"><h4>${esc(slotLabel(m.slotId))}</h4><p>${esc(company(m.companyId).name)}, ${esc(fmtOf(m.format).label)}</p></div></li>`).join('')}</ul><button type="button" class="btn btn--secondary btn--sm" id="my-ics" style="margin-top:var(--s3)">Download calendar file (.ics)</button>` : '<p class="small muted">Confirmed conversations appear here.</p>'}
      </div>
      <div class="panel panel--quiet"><h3>Moving here, or building something?</h3><p class="small">Career, relocation, business and R&D support is open to everyone. <a href="#/participant/support">Ecosystem support</a></p></div>
    </aside>
  </div>`;
}

function afterRow(state, m) {
  const f = state.feedback[m.id] || {};
  const outcome = feedbackOutcome(m.id);
  const c = company(m.companyId);
  const choice = f.participant;
  return `<li>
    <div class="list__main"><h4>${esc(c.name)}</h4><p>Would you like to continue outside Skillink? For example a job interview, an R&D project or pilot scoping.</p>
      ${outcome === 'mutual' ? `<p style="color:var(--pine-700);font-weight:700;margin-top:4px">You both chose to continue. Contact: ${esc(c.hostName || 'the host')}${c.hostRole ? `, ${esc(c.hostRole)}` : ''} (${esc(c.hostEmail || '')})</p>` : ''}
    </div>
    <div class="list__actions" role="group" aria-label="Your private choice for ${esc(c.name)}">
      <button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="continue" aria-pressed="${choice === 'continue'}">Let's continue</button>
      <button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="notnow" aria-pressed="${choice === 'notnow'}">Not now</button>
    </div>
  </li>`;
}

function bindMeetings(root) {
  root.querySelectorAll('[data-accept]').forEach((b) =>
    b.addEventListener('click', () => {
      respondToMeeting(b.dataset.accept, true);
      toast('Accepted. The host can now see your name and email. The event team will confirm the time.', 'ok', employerAction(meeting(b.dataset.accept)?.companyId, 'meetings'));
    }),
  );
  root.querySelectorAll('[data-decline]').forEach((b) =>
    b.addEventListener('click', () => {
      respondToMeeting(b.dataset.decline, false);
      toast('Invitation declined. The host is not told why.', 'ok', employerAction(meeting(b.dataset.decline)?.companyId, 'meetings'));
    }),
  );
  root.querySelectorAll('[data-cancel]').forEach((b) =>
    b.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Cancel this request?', message: 'The host will no longer see it, and one request is freed up.', confirmLabel: 'Cancel request' });
      if (ok) {
        cancelMeeting(b.dataset.cancel);
        toast('Request cancelled. One request freed up.');
      }
    }),
  );
  root.querySelectorAll('[data-fb]').forEach((b) =>
    b.addEventListener('click', () => {
      setFeedback(b.dataset.fb, 'participant', b.dataset.choice);
      toast('Your private choice is saved.');
    }),
  );
  root.querySelector('#my-ics')?.addEventListener('click', () => {
    const p = currentParticipant();
    const ms = getState().meetings.filter((m) => m.participantId === p.id && isConfirmed(m));
    downloadFile(`skillink-${p.pseudo}.ics`, 'text/calendar;charset=utf-8', buildIcs(ms));
    toast('Calendar file downloaded.');
  });
}

// ---------- dual-track ecosystem support hub ----------
const SUPPORT = {
  talent: {
    tab: 'International talent & career',
    title: 'Support for international talent and careers',
    lede: 'If a conversation turns into a job offer in Espoo, these public services help with moving, family, language and building your career here. They are free and open to everyone.',
    links: [
      { t: 'Work in Finland', d: 'The national service for international talent: finding work, moving, permits, and the Spouse Program for partners looking for work too.', href: 'https://www.workinfinland.com/en' },
      { t: 'Talent Espoo at Espoo Talent Hub', d: "Espoo's Talent Boost services for international professionals: career guidance, networks and help connecting with employers.", href: 'https://www.espoo.fi/en/espootalenthub' },
      { t: 'City of Espoo international services', d: 'Settling in Espoo: housing, schools and daycare, health services, and advice in many languages.', href: 'https://www.espoo.fi/en' },
      { t: 'InfoFinland', d: 'Plain-language guides in more than ten languages, including Finnish and Swedish courses near you.', href: 'https://www.infofinland.fi/en' },
    ],
    faq: [
      ['My partner is moving too. Is there help for them?', "Yes. Work in Finland's Spouse Program connects partners with employers, networks and career coaching in the Helsinki region, including Espoo."],
      ['Do I need to speak Finnish?', 'Every challenge states its real language requirement. Many teams work in English. If you would like to learn Finnish or Swedish, Espoo offers courses for adults, from beginner level.'],
      ['What about residence permits?', 'Work in Finland and the Finnish Immigration Service explain the routes, including the fast track for specialists. Your future employer can usually help with the application.'],
    ],
  },
  business: {
    tab: 'Business, R&D & innovation',
    title: 'Support for pilots, R&D partnerships and founders',
    lede: 'If a conversation turns into a pilot, a research project or a new company, these services help you take the next step in the Espoo innovation ecosystem.',
    links: [
      { t: 'Business Espoo', d: 'Free business advice for companies and founders in Espoo, from starting up to growth, funding and internationalisation.', href: 'https://www.espoo.fi/en/business-espoo-helping-companies-thrive' },
      { t: 'Enter Espoo', d: "Espoo's company for international growth: helps companies, investors and innovators find opportunities in the local deep-tech ecosystem.", href: 'https://www.enterespoo.fi/' },
      { t: 'Aalto University', d: 'Research collaboration, thesis partnerships and innovation services on the Otaniemi campus.', href: 'https://www.aalto.fi/en' },
      { t: 'VTT Technical Research Centre of Finland', d: 'Joint R&D, piloting facilities and research partnerships for companies of every size.', href: 'https://www.vttresearch.com/en' },
    ],
    faq: [
      ['Our pilot conversation went well. What comes next?', 'Agree the scope, data access and who owns what before you start. Business Espoo advisers can help small companies with agreements and funding options. Public-sector hosts may need a procurement step, which they will explain.'],
      ['Can a thesis or joint research project come out of this?', "Yes. If a host and a researcher both choose to continue, the university's thesis and research-agreement process applies. Talk about data, publication and IP early."],
      ['We are a small team from abroad. Where do we start?', 'Enter Espoo and Business Espoo help international founders and companies get started in Espoo. Skillink never asks how big your team is or how you are funded.'],
    ],
  },
};

function supportPanel(key) {
  const s = SUPPORT[key];
  return `<div class="tabpanel" role="tabpanel" id="sp-${key}" aria-labelledby="st-${key}" tabindex="0" ${supportTab === key ? '' : 'hidden'}>
    <h2>${esc(s.title)}</h2>
    <p class="lede" style="margin-top:0">${esc(s.lede)}</p>
    <ul class="list">${s.links
      .map((l) => `<li><div class="list__main"><h4>${esc(l.t)}</h4><p>${esc(l.d)}</p></div><div class="list__actions"><a class="btn btn--sm btn--secondary" href="${l.href}" target="_blank" rel="noopener noreferrer">Open ${esc(l.t)}<span class="sr-only"> (opens in a new tab)</span></a></div></li>`)
      .join('')}</ul>
    <section class="section" aria-labelledby="faq-${key}">
      <h3 id="faq-${key}">Common questions after a match</h3>
      ${s.faq.map(([q, a]) => `<details class="disclosure"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
    </section>
  </div>`;
}

function renderSupport(arg) {
  if (arg === 'business' || arg === 'talent') supportTab = arg;
  return `
  <div class="split">
    <div>
      <h1>Espoo ecosystem support</h1>
      <p class="lede">Two tracks, one rule: the same help for everyone, whatever brought you to the event.</p>
      <div class="notice" style="margin:var(--s5) 0"><div><p class="notice__title">We never ask where you're from or how big your team is</p><p>Skillink doesn't collect nationality, background, age, gender, photos, company size or funding. Both tabs are shown to every solver, and using them tells nobody anything about you.</p></div></div>
      <div class="ptabs" role="tablist" aria-label="Support tracks">
        ${Object.entries(SUPPORT).map(([k, s]) => `<button type="button" role="tab" class="ptab" id="st-${k}" aria-controls="sp-${k}" aria-selected="${supportTab === k}" tabindex="${supportTab === k ? 0 : -1}" data-stab="${k}">${esc(s.tab)}</button>`).join('')}
      </div>
      ${Object.keys(SUPPORT).map(supportPanel).join('')}
    </div>
    <aside class="panel panel--trust">
      <h3>Why this is here</h3>
      <p class="small">Espoo wants talent to stay and ideas to grow here, not just arrive for one event day. Practical support is part of a fair process, and it is offered the same way to everyone.</p>
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
  return `<div class="empty"><h2>No solver data in this demo</h2><p>Personal data from the last event was deleted after the 30-day retention period. Start as a new solver from the bar above, or reset the demo data.</p></div>`;
}
