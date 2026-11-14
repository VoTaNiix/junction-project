import { esc, fmtDate, fmtDateTime, toast, openDialog, confirmDialog, LANGS, richText } from '../ui.js';
import { skill } from '../esco.js';
import {
  getState, currentParticipant, challenge, company, activeRequestCount, REQUEST_CAP, requestMeeting,
  respondToMeeting, cancelMeeting, toggleBookmark, findSubmission, saveSubmission, withdrawSubmission,
  deleteDraft, freeSlots, existingMeeting, isConfirmed, setFeedback, createParticipant, feedbackOutcome,
} from '../store.js';
import { challengeCard, quotaBar, statusPill, slotLabel, PARTS, ICON, langBadge, verifiedBadge } from './shared.js';
import { buildIcs, downloadFile } from '../exports.js';

export const hiddenTabs = ['write'];
export const hiddenTabLabels = { write: 'Show your thinking' };

export function tabs(state) {
  const p = currentParticipant();
  const invites = p ? state.meetings.filter((m) => m.participantId === p.id && m.partyStatus === 'invited').length : 0;
  return [
    { id: 'board', label: 'Problem board' },
    { id: 'workspace', label: 'My workspace' },
    { id: 'meetings', label: 'Conversations', count: invites },
    { id: 'support', label: 'International support' },
  ];
}

export function context(state) {
  const p = currentParticipant();
  if (!p) return `<span>No participant data in this browser.</span> <button type="button" class="btn btn--sm btn--secondary" id="new-participant">Start as a new participant</button>`;
  return `<span>${ICON.lock}</span><span>You are <strong>Participant #${esc(p.pseudo)}</strong>. Companies see only this ID until you both agree to meet.</span>`;
}

export function bindContext(root) {
  root.querySelector('#new-participant')?.addEventListener('click', () => {
    createParticipant();
    toast('New participant created with a fresh pseudonymous ID.');
  });
}

const filters = { q: '', skill: '', lang: '', industry: '' };

export function render(state, tab, arg) {
  if (tab === 'workspace') return renderWorkspace(state);
  if (tab === 'meetings') return renderMeetings(state);
  if (tab === 'support') return renderSupport();
  if (tab === 'write') return renderWrite(state, arg);
  return renderBoard(state);
}

export function bind(root, ctx) {
  if (ctx.tab === 'board' || !ctx.tab) bindBoard(root, ctx);
  if (ctx.tab === 'workspace') bindWorkspace(root);
  if (ctx.tab === 'meetings') bindMeetings(root);
  if (ctx.tab === 'write') bindWrite(root, ctx);
  bindCommon(root);
}

// ---------- shared participant actions ----------
function bindCommon(root) {
  root.querySelectorAll('[data-bookmark]').forEach((b) =>
    b.addEventListener('click', () => {
      const p = currentParticipant();
      if (!p) return toast('Start as a participant first.', 'warn');
      const was = b.getAttribute('aria-pressed') === 'true';
      toggleBookmark(p.id, b.dataset.bookmark);
      toast(was ? 'Removed from saved challenges.' : 'Saved to your workspace.');
    }),
  );
  root.querySelectorAll('[data-request]').forEach((b) => b.addEventListener('click', () => openRequestDialog(b.dataset.request)));
}

function cardActions(state, ch) {
  const p = currentParticipant();
  const saved = p && (state.bookmarks[p.id] || []).includes(ch.id);
  const sub = p && findSubmission(p.id, ch.id);
  const shared = sub && sub.status === 'submitted';
  return `
    <button type="button" class="btn btn--ghost btn--sm bookmark" data-bookmark="${ch.id}" id="bm-${ch.id}" aria-pressed="${!!saved}">${ICON.bookmark}${saved ? 'Saved' : 'Save'}<span class="sr-only"> ${esc(ch.title)}</span></button>
    ${shared ? '<span class="pill pill--ok">Thinking shared</span>' : ''}
    <a class="btn btn--primary btn--sm" href="#/participant/write/${ch.id}">${shared ? 'View your thinking' : sub ? 'Continue draft' : 'Show your thinking'}<span class="sr-only"> for ${esc(ch.title)}</span></a>`;
}

// ---------- problem board ----------
function heroQuote(state) {
  const s = state.submissions.find((x) => x.id === 's-1' && x.status === 'submitted');
  if (s) {
    const ch = challenge(s.challengeId);
    const p = state.participants.find((x) => x.id === s.participantId);
    return { q: 'What happens if the forecast is wrong three days in a row?', by: `Participant #${p ? p.pseudo : 'ESP-2093'}, asking ${company(ch.companyId).name}`, note: 'Asked in Finnish, shown here in English' };
  }
  return { q: 'Who decides that trade-off?', by: 'A question a participant asked a company', note: '' };
}

function renderBoard(state) {
  const hq = heroQuote(state);
  const usedSkills = [...new Set(state.challenges.flatMap((c) => c.escoTags))].map(skill).sort((a, b) => a.label.localeCompare(b.label));
  const langs = [...new Set(state.challenges.map((c) => c.language))];
  const industries = [...new Set(state.challenges.map((c) => c.industry))].sort();
  return `
  <section class="hero" aria-labelledby="hero-title">
    <div>
      <h1 id="hero-title"><span>Less Résumé.</span><span>More Real You.</span></h1>
      <p class="hero__q">What if recruitment started with a real conversation about a problem instead of a CV?</p>
      <div class="row">
        <button type="button" class="btn btn--primary" id="browse-challenges">Browse the ${state.challenges.length} challenges</button>
        <a class="btn btn--ghost" href="#/privacy/annex">How we protect you</a>
      </div>
      <p class="small" style="margin-top:var(--s4)">First visit? <a href="#/guide/start">Follow the step-by-step guide</a> for participants, recruiters, organizers and privacy inspectors.</p>
    </div>
    <div class="hero__evidence" aria-label="Example">
      <ul class="cvlines" aria-label="What Skillink does not ask for">
        <li>Five years of experience required</li>
        <li>Upload your CV and photo</li>
        <li>Native-level Finnish preferred</li>
      </ul>
      <figure class="realq">
        <blockquote><p style="margin:0">“${esc(hq.q)}”</p></blockquote>
        <figcaption>${esc(hq.by)}${hq.note ? `. ${esc(hq.note)}.` : ''}</figcaption>
      </figure>
    </div>
  </section>

  <ol class="steps" aria-label="How it works">
    <li><strong>Companies post a real problem</strong><p>Something their team is working on now, with what makes it tricky.</p></li>
    <li><strong>You show your thinking</strong><p>What you'd do first, why, and what you'd ask. Bullet points are fine.</p></li>
    <li><strong>You meet and talk</strong><p>Up to five conversation requests, at ${esc(state.event.name)} on ${esc(fmtDate(state.event.date))}.</p></li>
  </ol>

  <section class="section" id="challenges" aria-labelledby="ch-title" tabindex="-1">
    <div class="section__head">
      <h2 id="ch-title">Open challenges</h2>
      <p class="muted small">Listed by deadline, soonest first.</p>
    </div>
    <form class="filters" role="search" aria-label="Filter challenges" onsubmit="return false">
      <div class="field">
        <label for="f-q">Search</label>
        <input id="f-q" type="search" placeholder="Company, topic or word" value="${esc(filters.q)}" />
      </div>
      <div class="field">
        <label for="f-skill">ESCO skill</label>
        <select id="f-skill"><option value="">All skills</option>${usedSkills.map((s) => `<option value="${s.id}" ${filters.skill === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="f-lang">Language requirement</label>
        <select id="f-lang"><option value="">Any</option>${langs.map((l) => `<option ${filters.lang === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="f-ind">Industry</label>
        <select id="f-ind"><option value="">All industries</option>${industries.map((l) => `<option ${filters.industry === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
      </div>
    </form>
    <p class="sr-only" id="board-count" aria-live="polite"></p>
    <div id="board-results" class="grid grid--2"></div>
  </section>`;
}

function filteredChallenges(state) {
  const q = filters.q.trim().toLowerCase();
  return state.challenges
    .filter((ch) => {
      const c = company(ch.companyId);
      if (filters.skill && !ch.escoTags.includes(filters.skill)) return false;
      if (filters.lang && ch.language !== filters.lang) return false;
      if (filters.industry && ch.industry !== filters.industry) return false;
      if (q && ![ch.title, ch.context, ch.tricky, c?.name, ch.industry, ...ch.escoTags.map((t) => skill(t).label)].join(' ').toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}

function paintResults(root) {
  const state = getState();
  const list = filteredChallenges(state);
  const host = root.querySelector('#board-results');
  host.innerHTML = list.length
    ? list.map((ch) => challengeCard(ch, { actions: cardActions(state, ch) })).join('')
    : `<div class="empty"><h3>No challenges match these filters</h3><p>Try another skill or language, or <button type="button" class="linkbtn" id="clear-filters">clear all filters</button>.</p></div>`;
  root.querySelector('#board-count').textContent = `${list.length} challenge${list.length === 1 ? '' : 's'} shown`;
  host.querySelector('#clear-filters')?.addEventListener('click', () => {
    Object.assign(filters, { q: '', skill: '', lang: '', industry: '' });
    ['f-q', 'f-skill', 'f-lang', 'f-ind'].forEach((id) => (root.querySelector(`#${id}`).value = ''));
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
  const map = { 'f-q': 'q', 'f-skill': 'skill', 'f-lang': 'lang', 'f-ind': 'industry' };
  Object.entries(map).forEach(([id, key]) => {
    const el = root.querySelector(`#${id}`);
    el.addEventListener(id === 'f-q' ? 'input' : 'change', () => {
      filters[key] = el.value;
      paintResults(root);
    });
  });
  paintResults(root);
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
      </div>
      <div class="list__actions">
        <a class="btn btn--sm ${kind === 'draft' ? 'btn--primary' : 'btn--ghost'}" href="#/participant/write/${ch.id}">${kind === 'draft' ? 'Continue draft' : 'View'}</a>
        ${kind === 'draft' ? `<button type="button" class="btn btn--sm btn--ghost" data-del-draft="${s.id}">Delete draft</button>` : ''}
      </div>
    </li>`;
  };
  return `
  <div class="split">
    <div>
      <section class="section" aria-labelledby="ws-drafts">
        <div class="section__head"><h2 id="ws-drafts">Private drafts</h2><p class="muted small">Only you can see drafts. They live in this browser.</p></div>
        ${drafts.length ? `<ul class="list">${drafts.map((s) => subRow(s, 'draft')).join('')}</ul>` : `<div class="empty"><h3>No drafts</h3><p>Pick a challenge on the <a href="#/participant/board">problem board</a> and start writing. Drafts save automatically.</p></div>`}
      </section>
      <section class="section" aria-labelledby="ws-shared">
        <div class="section__head"><h2 id="ws-shared">Thinking you've shared</h2></div>
        ${shared.length ? `<ul class="list">${shared.map((s) => subRow(s, 'shared')).join('')}</ul>` : `<div class="empty"><h3>Nothing shared yet</h3><p>When you share your thinking, the company sees it under your participant ID only.</p></div>`}
      </section>
      <section class="section" aria-labelledby="ws-saved">
        <div class="section__head"><h2 id="ws-saved">Saved challenges</h2></div>
        ${saved.length ? `<div class="grid grid--2">${saved.map((ch) => challengeCard(ch, { compact: true, actions: cardActions(state, ch) })).join('')}</div>` : `<div class="empty"><h3>No saved challenges</h3><p>Use Save on any challenge to keep it here.</p></div>`}
      </section>
    </div>
    <aside class="stack">
      <div class="panel panel--trust">
        <h3>Substance over style</h3>
        <p class="small">Short answers and bullet points count exactly as much as polished paragraphs. Nobody scores length, grammar or wording. Companies read what you'd actually do.</p>
      </div>
      <div class="panel">${quotaBar(activeRequestCount(p.id))}<p class="small" style="margin-top:var(--s3)"><a href="#/participant/meetings">Manage conversation requests</a></p></div>
    </aside>
  </div>`;
}

function bindWorkspace(root) {
  root.querySelectorAll('[data-del-draft]').forEach((b) =>
    b.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Delete this draft?', message: 'The draft is removed from this browser and cannot be recovered.', confirmLabel: 'Delete draft', danger: true });
      if (ok) {
        deleteDraft(b.dataset.delDraft);
        toast('Draft deleted.');
      }
    }),
  );
}

// ---------- editor ----------
const FORMAT_HINT = {
  bullets: 'One idea per line. Start lines with "- " if you like.',
  prose: 'A few sentences is plenty.',
};

function renderWrite(state, chId) {
  const ch = challenge(chId);
  if (!ch) return `<div class="empty"><h2>This challenge is no longer available</h2><p><a href="#/participant/board">Back to the problem board</a></p></div>`;
  const p = currentParticipant();
  if (!p) return noParticipant();
  const c = company(ch.companyId);
  const sub = findSubmission(p.id, ch.id);
  const shared = sub && sub.status === 'submitted';
  const d = sub || { lang: 'en', format: 'bullets', answers: { first: '', why: '', questions: '' }, skills: [] };
  const m = existingMeeting(p.id, ch.id);

  const head = `
    <p class="small"><a href="#/participant/board">Problem board</a> / Show your thinking</p>
    ${challengeCard(ch, { actions: '' })}`;

  if (shared) {
    return `<div class="split"><div class="stack">${head}
      <section class="section" aria-labelledby="your-thinking">
        <div class="notice notice--pine"><div>${verifiedBadge('Shared with ' + c.name)}<p class="small" style="margin-top:4px">Shared ${esc(fmtDateTime(sub.submittedAt))}. ${esc(c.name)} sees this as Participant #${esc(p.pseudo)}.</p></div></div>
        <h2 id="your-thinking" style="margin-top:var(--s5)">Your thinking</h2>
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
      <p class="callout">Write in the language you think best in. ${esc(c.name)} says: “${esc(ch.language)}”. If you write in another language, the recruiter can open an EU-hosted machine translation next to your original words.</p>
      ${PARTS.map(
        (pt) => `<div class="qblock${pt.key === 'questions' ? ' qblock--core' : ''}">
          <h3><span class="qblock__n">${pt.n}</span><label for="ed-${pt.key}">${esc(pt.label)}</label></h3>
          ${pt.key === 'questions' ? `<p class="core-note">${ICON.person}<span><strong>This is the heart of Skillink.</strong> Your questions show how you think about their real situation, which no generic answer can copy. They become the start of your conversation.</span></p>` : ''}
          <p class="hint" id="h-${pt.key}">${FORMAT_HINT[d.format]}</p>
          <textarea id="ed-${pt.key}" name="${pt.key}" aria-describedby="h-${pt.key} e-${pt.key}" rows="5">${esc(d.answers[pt.key])}</textarea>
          <p class="field-error" id="e-${pt.key}" hidden></p>
        </div>`,
      ).join('')}
      <fieldset class="qblock">
        <legend style="margin-bottom:var(--s2)">Which of the company's skills are you drawing on? <span class="muted">(optional)</span></legend>
        <p class="hint" style="margin-bottom:var(--s3)">Used only for anonymous counts of which skills were offered at the event. Never to rank or filter you.</p>
        <div class="row">${ch.escoTags.map((id) => `<label class="choice"><input type="checkbox" name="skills" value="${id}" ${d.skills?.includes(id) ? 'checked' : ''}> ${esc(skill(id).label)}</label>`).join('')}</div>
      </fieldset>
      <div class="panel panel--quiet">
        <label class="choice" style="align-items:flex-start"><input type="checkbox" id="consent" ${sub?.consentChecked ? 'checked' : ''} style="margin-top:3px">
          <span><strong>I agree that my answers are used only to arrange conversations at ${esc(state.event.name)}.</strong> ${esc(c.name)} sees them under my participant ID. My name is shared only if we both agree to meet. Everything is deleted ${esc(String(state.event.retentionDays))} days after the event. <a href="#/privacy/consent">Read the full notice</a>.</span>
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
      <p class="small">Three honest bullet points are as good as three paragraphs. Nobody scores length, grammar or polish, and no AI ranks your answer.</p>
    </div>
    <div class="panel">
      <h3>What the company sees</h3>
      <ul class="checks small">
        <li class="check" style="color:var(--pine-700)">${ICON.check}<p><strong>Your answers and participant ID</strong></p></li>
        <li class="check" style="color:var(--red-700)">${ICON.cross}<p><strong>Not your name, email, CV or photo</strong>until you both agree to meet</p></li>
        <li class="check" style="color:var(--red-700)">${ICON.cross}<p><strong>Not your age, gender or nationality</strong>Skillink never asks for them</p></li>
      </ul>
    </div>
    <div class="panel">${quotaBar(activeRequestCount(p.id))}</div>
  </aside>`;
}

function readForm(form) {
  const fd = new FormData(form);
  return {
    lang: fd.get('lang'),
    langOther: fd.get('langOther') || '',
    format: fd.get('format'),
    skills: fd.getAll('skills'),
    answers: { first: fd.get('first').trim(), why: fd.get('why').trim(), questions: fd.get('questions').trim() },
  };
}

function bindWrite(root, ctx) {
  root.querySelector('#withdraw')?.addEventListener('click', async (e) => {
    const ok = await confirmDialog({ title: 'Withdraw your shared thinking?', message: 'The company will no longer see it. It goes back to your private drafts so you can edit and share again.', confirmLabel: 'Withdraw' });
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
  form.querySelectorAll('input[name="format"]').forEach((r) =>
    r.addEventListener('change', () => form.querySelectorAll('.hint[id^="h-"]').forEach((h) => (h.textContent = FORMAT_HINT[r.value]))),
  );
  const langSel = form.querySelector('#ed-lang');
  langSel.addEventListener('change', () => (form.querySelector('#lang-other-wrap').hidden = langSel.value !== 'other'));

  form.querySelector('#save-draft').addEventListener('click', () => {
    clearTimeout(timer);
    saveSubmission(p.id, chId, readForm(form), false);
    toast('Private draft saved in this browser.');
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
    toast(`Shared with ${company(challenge(chId).companyId).name}.`);
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
      ${sub?.status === 'submitted' ? '<p class="small muted">Your shared thinking is attached to this request.</p>' : '<p class="notice notice--amber small">You haven\'t shared your thinking on this challenge yet. Requests with shared thinking give the company something real to talk about.</p>'}
      <form id="req-form">
        <fieldset><legend>Pick a time at ${esc(getState().event.venue)}</legend>
          ${slots.length ? `<div class="slots">${slots.map((s, i) => `<label class="slot"><input type="radio" name="slot" value="${s.id}" ${i === 0 ? 'checked' : ''}><span>${esc(slotLabel(s.id).split(', ').pop())}<small>${esc(fmtDate(s.start, { weekday: true }))}</small></span></label>`).join('')}</div>` : '<p class="notice notice--amber">All of this company\'s times are booked. Try another challenge.</p>'}
        </fieldset>
        <p class="small muted">The company accepts or declines, then the City of Espoo event team confirms the time. Your name is shared only after the company accepts.</p>
        <div class="row row--end">
          <button type="button" class="btn btn--ghost" data-close>Cancel</button>
          <button type="submit" class="btn btn--primary" ${slots.length ? '' : 'disabled'}>Send request (${used + 1} of ${REQUEST_CAP})</button>
        </div>
      </form>`,
    onBind: (dlg, close) => {
      dlg.querySelector('#req-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const slotId = new FormData(e.target).get('slot');
        const res = requestMeeting(p.id, ch.id, slotId);
        if (!res.ok) return toast(res.error, 'error');
        close();
        toast(`Request sent to ${c.name}. ${activeRequestCount(p.id)} of ${REQUEST_CAP} used.`);
      });
    },
  });
}

function renderMeetings(state) {
  const p = currentParticipant();
  if (!p) return noParticipant();
  const mine = state.meetings.filter((m) => m.participantId === p.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const invites = mine.filter((m) => m.initiator === 'recruiter' && m.partyStatus === 'invited');
  const requests = mine.filter((m) => m.initiator === 'participant');
  const others = mine.filter((m) => m.initiator === 'recruiter' && m.partyStatus !== 'invited');
  const confirmed = mine.filter(isConfirmed);
  const used = activeRequestCount(p.id);
  const requestable = state.challenges.filter((ch) => !existingMeeting(p.id, ch.id));

  const row = (m, actions) => {
    const ch = challenge(m.challengeId);
    return `<li>
      <div class="list__main"><h4>${esc(company(m.companyId).name)}</h4><p>${esc(ch.title)}</p><p>${esc(slotLabel(m.slotId))}, ${esc(state.slots.find((s) => s.id === m.slotId)?.location || '')}</p></div>
      ${statusPill(m)}
      <div class="list__actions">${actions || ''}</div>
    </li>`;
  };

  return `
  <div class="split">
    <div>
      ${invites.length ? `<section class="section" aria-labelledby="inv-h">
        <div class="section__head"><h2 id="inv-h">Invitations for you</h2><p class="small muted">A company read your thinking and wants to talk.</p></div>
        <ul class="list">${invites.map((m) => row(m, `<button type="button" class="btn btn--sm btn--pine" data-accept="${m.id}">Accept and share my name</button><button type="button" class="btn btn--sm btn--ghost" data-decline="${m.id}">Decline</button>`)).join('')}</ul>
        <p class="small muted" style="margin-top:var(--s2)">Accepting shares your name and email with that company only. Invitations don't use your request quota.</p>
      </section>` : ''}

      <section class="section" aria-labelledby="req-h">
        <div class="section__head"><h2 id="req-h">Your requests</h2><p class="small muted">Oldest first.</p></div>
        ${requests.length ? `<ul class="list">${requests.map((m) => row(m, m.partyStatus === 'requested' || (m.partyStatus === 'accepted' && m.organizerStatus === 'pending') ? `<button type="button" class="btn btn--sm btn--ghost" data-cancel="${m.id}">Cancel request</button>` : '')).join('')}</ul>` : `<div class="empty"><h3>No requests yet</h3><p>You can request up to ${REQUEST_CAP} conversations.</p></div>`}
      </section>

      ${others.length ? `<section class="section" aria-labelledby="oth-h"><div class="section__head"><h2 id="oth-h">Invitations you answered</h2></div><ul class="list">${others.map((m) => row(m)).join('')}</ul></section>` : ''}

      <section class="section" aria-labelledby="new-h">
        <div class="section__head"><h2 id="new-h">Request a new conversation</h2></div>
        ${used >= REQUEST_CAP ? `<div class="notice notice--amber"><div><p class="notice__title">You've used all ${REQUEST_CAP} requests</p><p>Cancel a request above to free one. The limit keeps conversations meaningful for everyone, and companies can still invite you.</p></div></div>` : requestable.length ? `<ul class="list">${requestable.map((ch) => `<li><div class="list__main"><h4>${esc(company(ch.companyId).name)}</h4><p>${esc(ch.title)}</p></div>${langBadge(ch.language)}<div class="list__actions"><button type="button" class="btn btn--sm btn--secondary" data-request="${ch.id}">Request<span class="sr-only"> a conversation with ${esc(company(ch.companyId).name)}</span></button></div></li>`).join('')}</ul>` : '<p class="muted">You have an open conversation with every company.</p>'}
      </section>

      ${confirmed.length ? `<section class="section" aria-labelledby="after-h">
        <div class="section__head"><h2 id="after-h">After your conversations</h2><p class="small muted">Your answer is private. The company only learns the outcome if you both choose to continue.</p></div>
        <ul class="list">${confirmed.map((m) => afterRow(state, m)).join('')}</ul>
      </section>` : ''}
    </div>
    <aside class="stack">
      <div class="panel">${quotaBar(used)}<p class="small muted" style="margin-top:var(--s3)">Requests you send count toward the limit until they're declined or you cancel them.</p></div>
      <div class="panel">
        <h3>Your schedule</h3>
        ${confirmed.length ? `<ul class="list" style="border:0">${confirmed.map((m) => `<li style="padding:var(--s3) 0"><div class="list__main"><h4>${esc(slotLabel(m.slotId))}</h4><p>${esc(company(m.companyId).name)}</p></div></li>`).join('')}</ul><button type="button" class="btn btn--secondary btn--sm" id="my-ics" style="margin-top:var(--s3)">Download calendar file (.ics)</button>` : '<p class="small muted">Confirmed conversations appear here.</p>'}
      </div>
      <div class="panel panel--quiet"><h3>Moving to Espoo?</h3><p class="small">Help with relocation, family and language courses is open to everyone. <a href="#/participant/support">International support</a></p></div>
    </aside>
  </div>`;
}

function afterRow(state, m) {
  const f = state.feedback[m.id] || {};
  const outcome = feedbackOutcome(m.id);
  const c = company(m.companyId);
  const choice = f.participant;
  return `<li>
    <div class="list__main"><h4>${esc(c.name)}</h4><p>Would you like to continue the conversation?</p>
      ${outcome === 'mutual' ? `<p style="color:var(--pine-700);font-weight:700;margin-top:4px">You both chose to continue. Contact: ${esc(c.recruiter || 'recruiter')} (${esc(c.recruiterEmail || '')})</p>` : ''}
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
      toast('Accepted. The company can now see your name and email. The event team will confirm the time.');
    }),
  );
  root.querySelectorAll('[data-decline]').forEach((b) =>
    b.addEventListener('click', () => {
      respondToMeeting(b.dataset.decline, false);
      toast('Invitation declined. The company is not told why.');
    }),
  );
  root.querySelectorAll('[data-cancel]').forEach((b) =>
    b.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Cancel this request?', message: 'The company will no longer see it, and one request is freed up.', confirmLabel: 'Cancel request' });
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

// ---------- international support ----------
function renderSupport() {
  const links = [
    { t: 'Work in Finland', d: 'The national service for international talent: finding work, moving, permits, and the Spouse Program for partners looking for work too.', href: 'https://www.workinfinland.com/en' },
    { t: 'City of Espoo international services', d: 'Settling in Espoo: housing, schools and daycare, health services, and advice in many languages.', href: 'https://www.espoo.fi/en' },
    { t: 'InfoFinland', d: 'Plain-language guides in more than ten languages, including Finnish and Swedish courses near you.', href: 'https://www.infofinland.fi/en' },
  ];
  return `
  <div class="split">
    <div>
      <h1>Support for international talent</h1>
      <p class="lede">If a conversation turns into a job offer in Espoo, these public services help with moving, family and language. They are free and open to everyone.</p>
      <div class="notice" style="margin:var(--s5) 0"><div><p class="notice__title">We never ask where you're from</p><p>Skillink doesn't collect nationality, background, age, gender or photos. This page is shown to every participant, and using it tells nobody anything about you.</p></div></div>
      <ul class="list">${links
        .map((l) => `<li><div class="list__main"><h4>${esc(l.t)}</h4><p>${esc(l.d)}</p></div><div class="list__actions"><a class="btn btn--sm btn--secondary" href="${l.href}" target="_blank" rel="noopener noreferrer">Open ${esc(l.t)}<span class="sr-only"> (opens in a new tab)</span></a></div></li>`)
        .join('')}</ul>
      <section class="section" aria-labelledby="topics-h">
        <h2 id="topics-h">Common questions after a match</h2>
        <details class="disclosure"><summary>My partner is moving too. Is there help for them?</summary><p>Yes. Work in Finland's Spouse Program connects partners with employers, networks and career coaching in the Helsinki region, including Espoo.</p></details>
        <details class="disclosure"><summary>Do I need to speak Finnish?</summary><p>Every challenge states its real language requirement. Many teams work in English. If you'd like to learn Finnish or Swedish, Espoo offers courses for adults, from beginner level.</p></details>
        <details class="disclosure"><summary>What about residence permits?</summary><p>Work in Finland and the Finnish Immigration Service explain the routes, including the fast track for specialists. Your future employer can usually help with the application.</p></details>
      </section>
    </div>
    <aside class="panel panel--trust">
      <h3>Why this is here</h3>
      <p class="small">Espoo wants international talent to stay, not just arrive. Practical support is part of a fair recruitment process, and it is offered the same way to everyone.</p>
    </aside>
  </div>`;
}

function noParticipant() {
  return `<div class="empty"><h2>No participant data in this browser</h2><p>Personal data from the last event was deleted after the 30-day retention period. Start as a new participant from the bar above, or reset the demo data.</p></div>`;
}

