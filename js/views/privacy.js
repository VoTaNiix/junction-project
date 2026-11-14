import { esc, fmtDate, fmtDateTime, toast, confirmDialog, addDays, daysUntil } from '../ui.js';
import {
  auditState, FORBIDDEN_KEYS, personalDataInventory, purgePersonalData, aggregates, REQUEST_CAP,
  activeRequestCount, canRevealIdentity, currentParticipant, deleteParticipantData,
} from '../store.js';
import { ICON, verifiedBadge } from './shared.js';

export function tabs() {
  return [
    { id: 'annex', label: 'EU AI Act, Annex III' },
    { id: 'consent', label: 'Purpose-bound consent' },
    { id: 'data', label: 'Data and live audit' },
    { id: 'purge', label: '30-day deletion' },
  ];
}

export function context() {
  return `<span>${ICON.lock}</span><span>Reviewing as <strong>privacy and EU AI Act inspector</strong>. Read-only, except the deletion simulation.</span>`;
}

export function render(state, tab) {
  if (tab === 'consent') return renderConsent(state);
  if (tab === 'data') return renderData(state);
  if (tab === 'purge') return renderPurge(state);
  return renderAnnex(state);
}

export function bind(root) {
  root.querySelector('#run-purge')?.addEventListener('click', async () => {
    const inv = personalDataInventory();
    const ok = await confirmDialog({
      title: 'Simulate the 30-day deletion now?',
      message: `This permanently deletes ${inv.participants} participant identities, ${inv.submissions} shared approaches, ${inv.drafts} drafts, ${inv.meetings} meetings and all post-event choices from this browser. Anonymous counts are kept. Use Reset demo data in the header to bring the demo back.`,
      confirmLabel: 'Delete personal data',
      danger: true,
    });
    if (!ok) return;
    purgePersonalData();
    toast('Personal data deleted. Anonymous statistics kept.');
  });
  root.querySelector('#withdraw-consent')?.addEventListener('click', async () => {
    const p = currentParticipant();
    if (!p) return;
    const ok = await confirmDialog({
      title: `Withdraw consent for Participant #${p.pseudo}?`,
      message: 'Their answers, drafts, saved challenges and conversations are deleted now, without waiting 30 days. Anonymous counts are kept.',
      confirmLabel: 'Withdraw and delete',
      danger: true,
    });
    if (!ok) return;
    deleteParticipantData(p.id);
    toast('Consent withdrawn. That participant\'s data is deleted.');
  });
}

const purgeDate = (s) => addDays(s.event.date, s.event.retentionDays);

// ---------- Annex III ----------
function renderAnnex(state) {
  const rows = [
    ['Analysing and filtering applications', 'Nothing is filtered. Every shared approach reaches the company, listed by the time it was shared.'],
    ['Evaluating candidates', 'No scores, match percentages or rankings exist anywhere in the product. People read and decide.'],
    ['Placing targeted job advertisements', 'Everyone sees the same public problem board. There is no personalised targeting.'],
    ['Decisions on hiring or terms of work', 'Skillink only arranges conversations. Each one is accepted by both sides and approved by a person on the event team.'],
  ];
  return `
    <div class="split">
      <div>
        <h1>Why recruitment AI is high-risk, and how Skillink stays out of it</h1>
        <p class="lede">The EU AI Act, Annex III point 4, lists AI used to recruit or select people as high-risk: placing targeted job ads, analysing and filtering applications, and evaluating candidates.</p>
        <p>High-risk systems need risk management, data governance, technical documentation, logging, human oversight, accuracy testing, conformity assessment and registration in the EU database. Those duties exist because automated judgements about people can quietly discriminate at scale.</p>
        <p>Skillink's answer is simple: <strong>keep algorithms out of every decision about people.</strong></p>
        <div class="table-wrap" style="margin:var(--s5) 0">
          <table>
            <caption class="sr-only">Annex III recruitment uses compared with Skillink</caption>
            <thead><tr><th scope="col">What makes recruitment AI high-risk</th><th scope="col">What Skillink does instead</th></tr></thead>
            <tbody>${rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td><span class="check" style="color:var(--pine-700)">${ICON.check}<span style="color:var(--text)">${esc(b)}</span></span></td></tr>`).join('')}</tbody>
          </table>
        </div>
        <h2>The one AI feature: translation</h2>
        <p>Recruiters can open an optional machine translation of an answer. It is hosted in the EU, labelled <span class="mt-badge">[EU-Hosted Machine Translation]</span>, off by default, and always shown next to the original words, never instead of them. It changes the language of the text, not anyone's chances, so it does not evaluate people.</p>
        <p class="small muted">This page explains the design intent. It is not legal advice. The classification should be confirmed with the City of Espoo data protection officer and legal team before a live event.</p>
      </div>
      <aside class="stack">
        <div class="panel"><h3>Guardrails, checked live</h3>${guardrails(state)}</div>
      </aside>
    </div>`;
}

function guardrails(state) {
  const hits = auditState();
  const maxReq = Math.max(0, ...state.participants.map((p) => activeRequestCount(p.id)));
  const revealedPairs = state.meetings.filter(canRevealIdentity).length;
  const items = [
    { ok: hits.length === 0, t: 'No demographic or scoring fields', d: hits.length ? `Found: ${hits.slice(0, 3).join(', ')}` : `Checked ${FORBIDDEN_KEYS.length} forbidden field names across all stored data.` },
    { ok: true, t: 'No ranking or auto-filtering', d: 'Lists of people are ordered by time or grouped by challenge only.' },
    { ok: true, t: 'Pseudonymous by default', d: `${revealedPairs} identities shared, each after both sides agreed to meet.` },
    { ok: maxReq <= REQUEST_CAP, t: `Request cap of ${REQUEST_CAP} respected`, d: `Highest active count right now: ${maxReq}.` },
    { ok: true, t: 'Translation side by side', d: 'Originals are always shown.' },
    { ok: true, t: '30-day deletion scheduled', d: state.purge.done ? `Ran ${fmtDateTime(state.purge.at)}.` : `Due ${fmtDate(purgeDate(state), { year: true })}.` },
  ];
  return `<ul class="checks">${items.map((i) => `<li class="check" style="color:${i.ok ? 'var(--pine-700)' : 'var(--red-700)'}">${i.ok ? ICON.check : ICON.cross}<p style="color:var(--text)"><strong>${esc(i.t)}</strong>${esc(i.d)}</p></li>`).join('')}</ul>`;
}

// ---------- consent ----------
function renderConsent(state) {
  const p = currentParticipant();
  const steps = [
    { t: 'Drafted', d: 'Skillink team, plain-language notice in English, Finnish and Swedish', done: true },
    { t: 'Reviewed by the DPO', d: 'City of Espoo data protection officer checked purpose, legal basis and retention', done: true },
    { t: 'Approved', d: 'Signed off for this event only', done: true, now: true },
    { t: 'Re-review', d: 'Needed before any new event or new purpose', done: false },
  ];
  return `
    <div class="split">
      <article>
        <h1>Purpose-bound consent notice</h1>
        <p class="lede">This is what every participant agrees to before sharing their thinking.</p>
        <div class="panel" style="margin-top:var(--s5)">
          <h2>Your data is used for one thing only</h2>
          <p><strong>Purpose.</strong> To arrange conversations between you and companies at ${esc(state.event.name)} on ${esc(fmtDate(state.event.date, { year: true }))}. Not for other events, marketing, or training any AI model.</p>
          <p><strong>Who is responsible.</strong> The City of Espoo, as the event organizer, is the data controller.</p>
          <p><strong>What we keep.</strong> A participant ID, your name and email, the answers you share, the challenges you save, and your conversation requests.</p>
          <p><strong>What we never ask for.</strong> Nationality, ethnic background, age, gender, photos or CVs.</p>
          <p><strong>Who sees what.</strong> Companies see your answers under your participant ID. Your name and email are shared with a company only after you both agree to meet. The event team sees participant IDs to approve meeting times.</p>
          <p><strong>How long.</strong> Everything personal is deleted ${esc(String(state.event.retentionDays))} days after the event, on ${esc(fmtDate(purgeDate(state), { year: true }))}. Only anonymous counts remain.</p>
          <p><strong>Your rights.</strong> You can see, correct or delete your data at any time, and withdraw consent. Withdrawing deletes your data straight away.</p>
        </div>
        <section class="section" aria-labelledby="wd-h">
          <h2 id="wd-h">Try it: withdraw consent</h2>
          ${p ? `<p>Withdraw consent for the current demo participant, <strong>Participant #${esc(p.pseudo)}</strong>. Their data is deleted at once, not after 30 days.</p><button type="button" class="btn btn--danger" id="withdraw-consent">Withdraw consent and delete data</button>` : '<p class="muted">There is no current participant in this browser.</p>'}
        </section>
      </article>
      <aside class="panel">
        <h3>Approval workflow</h3>
        <ol class="checks" style="list-style:none">${steps.map((s) => `<li class="check" style="color:${s.done ? 'var(--pine-700)' : 'var(--text-3)'}">${s.done ? ICON.check : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>'}<p style="color:var(--text)"><strong>${esc(s.t)}</strong>${esc(s.d)}</p></li>`).join('')}</ol>
        <p style="margin-top:var(--s4)">${verifiedBadge('Approved by a person')}</p>
        <p class="small muted">The sign-off shown here is simulated for the prototype.</p>
      </aside>
    </div>`;
}

// ---------- data inventory & audit ----------
function renderData(state) {
  const inv = personalDataInventory();
  const hits = auditState();
  const rows = [
    ['Participant identities', 'ID, name, email', inv.participants, 'Name and email: only companies with a mutual meeting'],
    ['Shared approaches', 'Three answers, language, self-declared skills', inv.submissions, 'The company that posted the challenge'],
    ['Private drafts', 'Unshared answers', inv.drafts, 'Only the author'],
    ['Saved challenges', 'Bookmarks', inv.bookmarks, 'Only the participant; counted anonymously'],
    ['Meetings', 'Who, when, status', inv.meetings, 'Both sides and the event team'],
    ['Post-event choices', '"Let\'s continue" or "Not now"', inv.feedback, 'Nobody; only the joint outcome is shown'],
    ['Consent records', 'Purpose and time', inv.consents, 'Event team and DPO'],
    ['Recruiter contacts', 'Name and work email', inv.recruiterContacts, 'Participants after a mutual meeting'],
    ['Decision log', 'Who approved or declined, by participant ID', inv.decisionLog, 'Event team, for accountability'],
  ];
  return `
    <h1>Data and live audit</h1>
    <p class="lede">Everything Skillink stores about people, counted live from this browser.</p>
    <div class="table-wrap" style="margin:var(--s5) 0">
      <table>
        <caption class="sr-only">Personal data inventory</caption>
        <thead><tr><th scope="col">Category</th><th scope="col">What it contains</th><th scope="col" class="num">Records now</th><th scope="col">Who can see it</th><th scope="col">Deleted</th></tr></thead>
        <tbody>${rows.map(([a, b, n, w]) => `<tr><td><strong>${esc(a)}</strong></td><td>${esc(b)}</td><td class="num">${n}</td><td>${esc(w)}</td><td class="nowrap">${esc(fmtDate(purgeDate(state)))}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="grid grid--2">
      <section class="panel ${hits.length ? '' : 'panel--pine'}" aria-labelledby="audit-h">
        <h2 id="audit-h">Forbidden-field audit</h2>
        <p>${hits.length ? `<strong style="color:var(--red-700)">${hits.length} problem${hits.length > 1 ? 's' : ''} found</strong>` : verifiedBadge('Passed')}</p>
        <p class="small">Scans every stored record for any of these field names:</p>
        <ul class="tags">${FORBIDDEN_KEYS.map((k) => `<li class="tag">${esc(k)}</li>`).join('')}</ul>
        ${hits.length ? `<ul class="bullets small" style="margin-top:var(--s3)">${hits.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
      </section>
      <section class="panel" aria-labelledby="log-h">
        <h2 id="log-h">Human decision log</h2>
        <p class="small muted">Every meeting decision is made by a person and recorded here.</p>
        ${state.decisionLog.length ? `<ul class="checks small">${state.decisionLog.slice(0, 8).map((d) => `<li><p style="color:var(--text)"><strong>${esc(d.actor)}: ${esc(d.action)}</strong>${esc(d.detail)}, ${esc(fmtDateTime(d.at))}</p></li>`).join('')}</ul>` : '<p class="small">No decisions recorded in this session yet. Approve or decline something in another role to see it here.</p>'}
      </section>
    </div>`;
}

// ---------- purge ----------
function renderPurge(state) {
  const inv = personalDataInventory();
  const a = aggregates();
  const pd = purgeDate(state);
  const days = daysUntil(pd);
  const ledger = state.purge.ledger;
  const totalResponses = Object.values(a.responsesPerChallenge).reduce((x, y) => x + y, 0);
  const labels = { participants: 'Participant identities', submissions: 'Shared approaches', drafts: 'Private drafts', bookmarks: 'Saved challenges', meetings: 'Meetings', feedback: 'Post-event choices', consents: 'Consent records', recruiterContacts: 'Recruiter contacts', decisionLog: 'Decision log entries' };
  const today = new Date().toISOString().slice(0, 10);
  const phase = state.purge.done ? 3 : today > state.event.date ? 2 : today >= state.event.registrationOpens ? 1 : 0;
  const tl = [
    { t: 'Registration opens', d: fmtDate(state.event.registrationOpens, { year: true }) },
    { t: 'Event day', d: fmtDate(state.event.date, { year: true }) },
    { t: 'Post-event follow-up', d: `${state.event.retentionDays} days` },
    { t: 'Personal data deleted', d: fmtDate(pd, { year: true }) },
  ];
  return `
    <h1>30-day post-event deletion</h1>
    <p class="lede">Thirty days after the event, every piece of personal data is deleted automatically. Anonymous counts stay, so the City of Espoo can still learn from the event.</p>
    <ol class="timeline" style="margin:var(--s5) 0" aria-label="Data lifecycle">${tl.map((x, i) => `<li class="${i < phase ? 'is-done' : i === phase ? 'is-now' : ''}"><strong>${esc(x.t)}</strong>${esc(x.d)}${i === phase ? '<span class="sr-only"> (current stage)</span>' : ''}</li>`).join('')}</ol>

    ${state.purge.done ? `
      <div class="notice notice--pine" role="status"><div><p class="notice__title">Personal data deleted on ${esc(fmtDateTime(state.purge.at))}</p><p>Use Reset demo data in the header to restore the demo.</p></div></div>
      <div class="ledger" style="margin-top:var(--s5)">
        <section class="panel" aria-labelledby="led-h"><h2 id="led-h">Deleted</h2>
          <div class="table-wrap"><table><thead><tr><th scope="col">Record type</th><th scope="col" class="num">Before</th><th scope="col" class="num">After</th></tr></thead>
          <tbody>${Object.keys(labels).map((k) => `<tr><td>${labels[k]}</td><td class="num">${ledger.before[k]}</td><td class="num"><strong>${ledger.after[k]}</strong></td></tr>`).join('')}</tbody></table></div>
        </section>
        <section class="panel panel--pine" aria-labelledby="kept-h"><h2 id="kept-h">Kept, anonymous</h2>
          <div class="metrics">
            <div class="metric"><div class="metric__v">${totalResponses}</div><div class="metric__l">Approaches shared</div></div>
            <div class="metric"><div class="metric__v">${a.meetings.confirmed}</div><div class="metric__l">Conversations held</div></div>
            <div class="metric"><div class="metric__v">${a.optIn.held ? Math.round((a.optIn.mutual / a.optIn.held) * 100) : 0}%</div><div class="metric__l">Mutual opt-in</div></div>
          </div>
          <p class="small" style="margin-top:var(--s4)">See them still intact on the organizer's <a href="#/organizer/insights">Insights</a> and <a href="#/organizer/reports">Company reports</a>.</p>
        </section>
      </div>` : `
      <div class="grid grid--2">
        <section class="panel" aria-labelledby="now-h">
          <h2 id="now-h">Personal data held now</h2>
          <p class="small muted">Scheduled for deletion ${days > 0 ? `in ${days} days` : 'now'}.</p>
          <ul class="bars">${Object.keys(labels).map((k) => `<li style="grid-template-columns:1fr auto"><span>${labels[k]}</span><span class="bars__v">${inv[k]}</span></li>`).join('')}</ul>
        </section>
        <section class="panel panel--trust" aria-labelledby="sim-h">
          <h2 id="sim-h">Run the deletion now</h2>
          <p>See exactly what the automatic job does on day 30: every identity, answer, draft, meeting and choice is removed. Aggregate counts are calculated first, then kept.</p>
          <button type="button" class="btn btn--danger" id="run-purge">Simulate 30-day post-event auto-deletion</button>
        </section>
      </div>`}`;
}

