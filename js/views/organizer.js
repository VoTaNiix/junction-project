import { esc, fmtDateTime, toast, fmtDate } from '../ui.js';
import { skill } from '../esco.js';
import {
  company, challenge, participant, pseudoLabel, organizerDecision, isConfirmed, canRevealIdentity, aggregates,
  setFeedback, feedbackOutcome, OPT_IN_TARGET, clearAllFeedback, THEME_LABELS, slot,
} from '../store.js';
import { FORMATS, INTENTS, format as fmtOf } from '../formats.js';
import { statusPill, slotLabel, verifiedBadge, ICON, formatBadge } from './shared.js';
import { buildIcs, buildBrellaCsv, buildTavataJson, downloadFile, confirmedMeetings } from '../exports.js';

const ui = { preview: 'ics', reportCompany: null, track: '' };

export function tabs(state) {
  const ready = state.meetings.filter((m) => m.partyStatus === 'accepted' && m.organizerStatus === 'pending').length;
  return [
    { id: 'queue', label: 'Approval queue', count: ready },
    { id: 'schedule', label: 'Schedule and export' },
    { id: 'insights', label: 'Insights' },
    { id: 'optin', label: 'After the event' },
    { id: 'reports', label: 'Company reports' },
  ];
}

export function context(state) {
  return `<span>${ICON.person}</span><span>${esc(state.event.organizers || 'City of Espoo')} event team, <strong>${esc(state.event.name)}</strong>, ${esc(fmtDate(state.event.date, { weekday: true }))}</span>`;
}

export function render(state, tab) {
  if (tab === 'schedule') return renderSchedule(state);
  if (tab === 'insights') return renderInsights(state);
  if (tab === 'optin') return renderOptIn(state);
  if (tab === 'reports') return renderReports(state);
  return renderQueue(state);
}

export function bind(root, ctx) {
  root.querySelectorAll('[data-decide]').forEach((b) =>
    b.addEventListener('click', () => {
      const approve = b.dataset.answer === 'approve';
      organizerDecision(b.dataset.decide, approve);
      toast(approve ? 'Approved. The conversation is on the schedule.' : 'Declined. Both sides are told the time is not available.');
    }),
  );
  root.querySelectorAll('input[name="track"]').forEach((r) =>
    r.addEventListener('change', () => {
      ui.track = r.value;
      ctx.rerender();
    }),
  );
  root.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', () => doExport(b.dataset.export)));
  root.querySelectorAll('[data-preview]').forEach((b) =>
    b.addEventListener('click', () => {
      ui.preview = b.dataset.preview;
      ctx.rerender();
    }),
  );
  root.querySelectorAll('[data-sim]').forEach((b) =>
    b.addEventListener('click', () => {
      setFeedback(b.dataset.sim, b.dataset.side, b.dataset.choice);
    }),
  );
  root.querySelector('#clear-optin')?.addEventListener('click', () => {
    clearAllFeedback();
    toast('All post-event choices cleared.');
  });
  root.querySelector('#report-company')?.addEventListener('change', (e) => {
    ui.reportCompany = e.target.value;
    ctx.rerender();
  });
  root.querySelector('#print-report')?.addEventListener('click', () => window.print());
  root.querySelector('#download-report')?.addEventListener('click', () => {
    const el = root.querySelector('.report');
    const css = [...document.styleSheets].flatMap((sh) => {
      try {
        return [...sh.cssRules].map((r) => r.cssText);
      } catch {
        return [];
      }
    });
    const c = company(ui.reportCompany);
    downloadFile(`skillink-value-report-${c.id}.html`, 'text/html;charset=utf-8', `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Skillink value report, ${esc(c.name)}</title><style>${css.join('\n')}</style></head><body><main>${el.outerHTML}</main></body></html>`);
    toast('Report downloaded as an HTML file.');
  });
}

// ---------- approval queue ----------
function renderQueue(state) {
  const byTime = (a, b) => a.createdAt.localeCompare(b.createdAt);
  const inTrack = (m) => !ui.track || (m.format || 'open') === ui.track;
  const allReady = state.meetings.filter((m) => m.partyStatus === 'accepted' && m.organizerStatus === 'pending');
  const allWaiting = state.meetings.filter((m) => (m.partyStatus === 'requested' || m.partyStatus === 'invited') && m.organizerStatus === 'pending');
  const ready = allReady.filter(inTrack).sort(byTime);
  const waiting = allWaiting.filter(inTrack).sort(byTime);
  const open = [...allReady, ...allWaiting];
  const chip = (id, label) => `<label class="fchip${id ? ` fchip--${id}` : ''}"><input type="radio" name="track" value="${id}" ${ui.track === id ? 'checked' : ''}><span>${esc(label)} <span class="fchip__n">${open.filter((m) => !id || (m.format || 'open') === id).length}</span></span></label>`;
  const line = (m, actions) => `<li>
    <div class="list__main"><h4>${esc(company(m.companyId).name)} and ${esc(pseudoLabel(m.participantId))}</h4>
      <p>${esc(challenge(m.challengeId).title)}</p>
      <p>${esc(slotLabel(m.slotId))}, ${esc(slot(m.slotId)?.location || '')}. ${m.initiator === 'participant' ? 'Requested by the solver' : 'Invited by the host'} ${esc(fmtDateTime(m.createdAt))}.</p>
      <div style="margin-top:var(--s2)">${formatBadge(m.format)}</div></div>
    ${statusPill(m)}<div class="list__actions">${actions}</div></li>`;
  const recent = state.decisionLog.filter((d) => d.actor === 'organizer').slice(0, 6);
  return `
    <div class="split">
      <div>
        <fieldset class="filters__formats" style="margin-bottom:var(--s5)">
          <legend>Track</legend>
          <div class="fchips">${chip('', 'All tracks')}${FORMATS.map((f) => chip(f.id, f.label)).join('')}</div>
          <p class="hint">Counts are open requests and invitations, by what each conversation is about.</p>
        </fieldset>
        <section aria-labelledby="ready-h">
          <div class="section__head"><h1 id="ready-h" style="margin:0">Ready for your approval</h1><p class="small muted">Both sides said yes. Oldest first${ui.track ? `, ${esc(fmtOf(ui.track).label)} only` : ', across hiring and matchmaking tracks'}.</p></div>
          ${ready.length ? `<ul class="list">${ready.map((m) => line(m, `<button type="button" class="btn btn--sm btn--pine" data-decide="${m.id}" data-answer="approve">Approve</button><button type="button" class="btn btn--sm btn--ghost" data-decide="${m.id}" data-answer="decline">Decline</button>`)).join('')}</ul>` : `<div class="empty"><h3>Nothing waiting for approval${ui.track ? ' in this track' : ''}</h3><p>Conversations appear here once a solver and a host have both said yes.</p></div>`}
        </section>
        <section class="section" aria-labelledby="wait-h">
          <div class="section__head"><h2 id="wait-h">Waiting for the other side</h2><p class="small muted">You can decline these, for example to resolve a clash. Approval opens once both sides agree.</p></div>
          ${waiting.length ? `<ul class="list">${waiting.map((m) => line(m, `<button type="button" class="btn btn--sm btn--ghost" data-decide="${m.id}" data-answer="decline">Decline</button>`)).join('')}</ul>` : '<p class="muted">No open requests or invitations.</p>'}
        </section>
      </div>
      <aside class="stack">
        <div class="panel panel--pine"><h3>People stay in control</h3><p class="small">Every conversation, whether about a role, research or a pilot, is confirmed by a person on the event team. Nothing is approved automatically, and the queue is ordered by time only.</p></div>
        <div class="panel"><h3>Your recent decisions</h3>${recent.length ? `<ul class="checks">${recent.map((d) => `<li class="check" style="color:${d.action.includes('approved') ? 'var(--pine-700)' : 'var(--red-700)'}">${d.action.includes('approved') ? ICON.check : ICON.cross}<p style="color:var(--text)"><strong>${esc(d.action[0].toUpperCase() + d.action.slice(1))}</strong>${esc(d.detail)}</p></li>`).join('')}</ul>` : '<p class="small muted">Decisions you make appear here.</p>'}</div>
      </aside>
    </div>`;
}

// ---------- schedule & export ----------
function doExport(kind) {
  const ms = confirmedMeetings();
  if (!ms.length) return toast('No confirmed conversations to export yet.', 'warn');
  if (kind === 'ics') downloadFile('skillink-espoo-schedule.ics', 'text/calendar;charset=utf-8', buildIcs(ms));
  if (kind === 'brella') downloadFile('skillink-brella-schedule.csv', 'text/csv;charset=utf-8', '﻿' + buildBrellaCsv(ms));
  if (kind === 'tavata') downloadFile('skillink-tavata-schedule.json', 'application/json', buildTavataJson(ms));
  toast(`Exported ${ms.length} confirmed conversation${ms.length > 1 ? 's' : ''}.`);
}

function renderSchedule(state) {
  const ms = confirmedMeetings().sort((a, b) => slot(a.slotId).start.localeCompare(slot(b.slotId).start));
  const preview = ui.preview === 'brella' ? buildBrellaCsv(ms) : ui.preview === 'tavata' ? buildTavataJson(ms) : buildIcs(ms);
  return `
    <div class="section__head"><h1 style="margin:0">Confirmed conversations</h1><p class="small muted">${ms.length} on ${esc(fmtDate(state.event.date, { weekday: true }))}, by time.</p></div>
    ${ms.length ? `<div class="table-wrap"><table>
      <caption class="sr-only">Confirmed conversations</caption>
      <thead><tr><th scope="col">Time</th><th scope="col">Where</th><th scope="col">Host</th><th scope="col">Solver</th><th scope="col">Format</th><th scope="col">Challenge</th></tr></thead>
      <tbody>${ms.map((m) => `<tr><td class="nowrap">${esc(slotLabel(m.slotId).split(', ').pop())}</td><td>${esc(slot(m.slotId).location.replace('Dipoli, Otaniemi, ', ''))}</td><td>${esc(company(m.companyId).name)}</td><td>${canRevealIdentity(m) && participant(m.participantId) ? `${esc(participant(m.participantId).name)}<br><span class="muted">${esc(participant(m.participantId).email)}</span>` : esc(pseudoLabel(m.participantId))}</td><td>${formatBadge(m.format)}</td><td>${esc(challenge(m.challengeId).title)}</td></tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty"><h3>No confirmed conversations yet</h3><p>Approve conversations in the <a href="#/organizer/queue">approval queue</a> to build the schedule.</p></div>'}

    <section class="section" aria-labelledby="exp-h">
      <div class="section__head"><h2 id="exp-h">Export to calendars and event platforms</h2></div>
      <p>Skillink decides who talks and why. Brella and Tavata run the event day. Exports include the collaboration format of each conversation, and names only for conversations both sides agreed to.</p>
      <div class="row" style="margin:var(--s4) 0">
        <button type="button" class="btn btn--primary" data-export="ics">Download calendar invites (.ics)</button>
        <button type="button" class="btn btn--secondary" data-export="brella">Download Brella schedule (CSV)</button>
        <button type="button" class="btn btn--secondary" data-export="tavata">Download Tavata schedule (JSON)</button>
      </div>
      <div class="panel" style="padding:0;overflow:hidden">
        <div class="row" role="group" aria-label="Preview format" style="padding:var(--s3) var(--s4);border-bottom:1px solid var(--line)">
          <span class="small muted">Preview</span>
          ${[['ics', '.ics'], ['brella', 'Brella CSV'], ['tavata', 'Tavata JSON']].map(([k, l]) => `<button type="button" class="btn btn--sm btn--ghost" data-preview="${k}" aria-pressed="${ui.preview === k}">${l}</button>`).join('')}
        </div>
        <pre id="export-preview" tabindex="0" aria-label="Export preview" style="margin:0;padding:var(--s4);max-height:320px;overflow:auto;font-size:12.5px;line-height:1.5;background:var(--surface-quiet);white-space:pre">${esc(preview)}</pre>
      </div>
      <p class="small muted" style="margin-top:var(--s3)">Brella and Tavata columns follow a generic schedule layout. Map them to each platform's current import format when connecting a live event.</p>
    </section>`;
}

// ---------- insights ----------
function bars(items, max, { gap = false } = {}) {
  return `<ul class="bars">${items
    .map((it) => `<li><span class="bars__label">${esc(it.label)}</span><div class="bars__track" aria-hidden="true"><div class="bars__fill${gap && it.gap ? ' bars__fill--gap' : ''}${it.tone ? ` bars__fill--${it.tone}` : ''}" style="width:${max ? Math.round((it.value / max) * 100) : 0}%"></div></div><span class="bars__v">${it.value}<span class="sr-only"> ${esc(it.unit || '')}</span></span></li>`)
    .join('')}</ul>`;
}

/** Responses grouped by the format a solver's self-declared intent points to. */
function interestByFormat(intents) {
  const out = Object.fromEntries(FORMATS.map((f) => [f.id, 0]));
  INTENTS.forEach((it) => (out[it.format] += (intents || {})[it.id] || 0));
  return out;
}

function renderInsights(state) {
  const a = aggregates();
  const responses = state.challenges.map((ch) => ({ label: `${company(ch.companyId).name}: ${ch.title}`, value: a.responsesPerChallenge[ch.id] || 0, unit: 'responses' }));
  const totalResponses = Object.values(a.responsesPerChallenge).reduce((x, y) => x + y, 0);
  const demand = Object.entries(a.skillDemand)
    .map(([id, n]) => ({ id, label: skill(id).label, value: n, supply: a.skillSupply[id] || 0 }))
    .sort((x, y) => y.value - x.value || y.supply - x.supply || x.label.localeCompare(y.label));
  const unmet = demand.filter((d) => d.supply === 0).map((d) => ({ ...d, gap: true }));
  const langs = Object.entries(a.languages).map(([k, v]) => ({ label: { en: 'English', fi: 'Finnish', sv: 'Swedish', other: 'Other' }[k] || k, value: v, unit: 'responses' }));
  const rate = a.optIn.held ? a.optIn.mutual / a.optIn.held : 0;
  const interest = interestByFormat(a.intents);
  const formatGaps = FORMATS.filter((f) => (a.formatDemand[f.id] || 0) > 0 && !interest[f.id]);
  const quiet = state.challenges.filter((ch) => !a.responsesPerChallenge[ch.id]);
  return `
    <h1>Event insights</h1>
    <div class="notice" role="note"><span style="color:var(--brand-900)">${ICON.lock}</span><div><p class="notice__title">Aggregate counts only</p><p>Nothing on this page describes an individual or a team. Formats and skills come from host challenges and from what solvers chose to declare.${state.purge.done ? ` Includes anonymous statistics kept after the personal-data deletion on ${esc(fmtDate(state.purge.at))}.` : ''}</p></div></div>
    <div class="metrics" style="margin:var(--s6) 0">
      <div class="metric"><div class="metric__v">${state.challenges.length}</div><div class="metric__l">Challenges posted</div></div>
      <div class="metric"><div class="metric__v">${totalResponses}</div><div class="metric__l">Approaches shared</div></div>
      <div class="metric"><div class="metric__v">${a.meetings.confirmed}</div><div class="metric__l">Conversations confirmed</div></div>
      <div class="metric"><div class="metric__v">${Math.round(rate * 100)}%</div><div class="metric__l">Mutual "let's continue" (target ${Math.round(OPT_IN_TARGET * 100)}%)</div></div>
    </div>

    <section class="panel" aria-labelledby="i-fmt" style="margin-bottom:var(--s5)">
      <h2 id="i-fmt">Hiring, R&D and pilot interest</h2>
      <p class="small muted">Challenges that offer each format, approaches shared by solvers approaching it that way, and conversations confirmed about it. Open Format challenges and "open to discussing" solvers are counted under Open Format.</p>
      <div class="table-wrap"><table>
        <caption class="sr-only">Interest by collaboration format</caption>
        <thead><tr><th scope="col">Collaboration format</th><th scope="col" class="num">Challenges offering it</th><th scope="col" class="num">Approaches shared</th><th scope="col" class="num">Conversations confirmed</th></tr></thead>
        <tbody>${FORMATS.map((f) => `<tr><th scope="row">${formatBadge(f.id)}</th><td class="num">${a.formatDemand[f.id] || 0}</td><td class="num">${interest[f.id]}</td><td class="num">${a.confirmedFormats[f.id] || 0}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>

    <div class="grid grid--2">
      <section class="panel" aria-labelledby="i-resp"><h2 id="i-resp">Responses per challenge</h2>${bars(responses, Math.max(1, ...responses.map((r) => r.value)))}</section>
      <section class="panel" aria-labelledby="i-dem"><h2 id="i-dem">Top ESCO skills in demand</h2><p class="small muted">Number of challenges asking for each skill, most requested first.</p>${bars(demand.slice(0, 10), Math.max(1, ...demand.map((d) => d.value)))}</section>
      <section class="panel" aria-labelledby="i-unmet"><h2 id="i-unmet">Unmet ecosystem needs</h2><p class="small muted">Where hosts asked for something nobody offered. Useful for planning training, research calls and future events.</p>
        ${formatGaps.length ? `<p class="small"><strong>Formats with no takers yet:</strong> ${formatGaps.map((f) => esc(f.label)).join(', ')}.</p>` : ''}
        ${quiet.length ? `<p class="small"><strong>Challenges with no responses yet:</strong> ${quiet.map((ch) => esc(ch.title)).join(', ')}.</p>` : ''}
        <h3 class="small" style="margin-top:var(--s3)">Skills no solver declared drawing on</h3>
        ${unmet.length ? bars(unmet.slice(0, 10), Math.max(1, ...unmet.map((d) => d.value)), { gap: true }) : '<p class="muted">Every requested skill was offered at least once.</p>'}</section>
      <section class="panel" aria-labelledby="i-lang"><h2 id="i-lang">Languages people wrote in</h2>${langs.length ? bars(langs, Math.max(1, ...langs.map((l) => l.value))) : '<p class="muted">No responses yet.</p>'}<p class="small muted" style="margin-top:var(--s3)">Writing in Finnish or Swedish never affects who is invited. Hosts can open a side-by-side translation.</p></section>
    </div>`;
}

// ---------- post-event opt-in ----------
function renderOptIn(state) {
  const ms = state.meetings.filter(isConfirmed).sort((a, b) => slot(a.slotId).start.localeCompare(slot(b.slotId).start));
  const a = aggregates();
  const rate = a.optIn.held ? a.optIn.mutual / a.optIn.held : 0;
  const pct = Math.round(rate * 100);
  const below = rate < OPT_IN_TARGET;
  const side = (m, who, label, extra = '') => {
    const v = (state.feedback[m.id] || {})[who];
    return `<div class="optin__cell"><h4>${esc(label)}</h4>${extra}<div class="row" role="group" aria-label="${esc(label)}">
      <button type="button" class="btn btn--sm btn--ghost" data-sim="${m.id}" data-side="${who}" data-choice="continue" aria-pressed="${v === 'continue'}">Let's continue</button>
      <button type="button" class="btn btn--sm btn--ghost" data-sim="${m.id}" data-side="${who}" data-choice="notnow" aria-pressed="${v === 'notnow'}">Not now</button>
    </div><p class="small muted" style="margin:var(--s2) 0 0">${v ? 'Answered privately' : 'Not answered yet'}</p></div>`;
  };
  const result = (m) => {
    const out = feedbackOutcome(m.id);
    const c = company(m.companyId);
    const p = participant(m.participantId);
    if (out === 'mutual') {
      return `<div class="optin__cell optin__result is-mutual" aria-live="polite">${verifiedBadge('Both chose to continue')}
        <div class="contact-card"><strong>Contact details exchanged</strong><br>${esc(p ? p.name : '')} receives ${esc(c.hostName || '')}, ${esc(c.hostEmail || '')}<br>${esc(c.name)} receives ${esc(p ? p.email : '')}</div></div>`;
    }
    if (out === 'closed') return `<div class="optin__cell optin__result" aria-live="polite"><strong>No contact shared</strong><p class="small muted" style="margin:4px 0 0">Neither side is told who chose "not now".</p></div>`;
    return `<div class="optin__cell optin__result" aria-live="polite"><strong>Waiting for both answers</strong><p class="small muted" style="margin:4px 0 0">Nothing is shared until both have answered.</p></div>`;
  };
  return `
    <div class="split">
      <div>
        <h1>After the event: mutual opt-in</h1>
        <p class="lede">Each side privately chooses "Let's continue" or "Not now" after their conversation. Contact details are exchanged only when both say continue, so they can carry on outside Skillink: a job interview, an R&D project or pilot scoping.</p>
        <p class="small muted">This simulator lets you play both sides. In a live event, each person answers on their own device.</p>
        ${ms.length ? ms.map((m) => `<div class="optin" role="group" aria-label="${esc(company(m.companyId).name)} and ${esc(pseudoLabel(m.participantId))}">
          ${side(m, 'participant', `${pseudoLabel(m.participantId)}`, `<p style="margin:0 0 var(--s2)">${formatBadge(m.format)}</p>`)}
          ${side(m, 'host', `${company(m.companyId).name}`)}
          ${result(m)}
        </div>`).join('') : '<div class="empty"><h3>No confirmed conversations</h3><p>Approve conversations first, then come back after the event.</p></div>'}
        ${ms.length ? '<div class="row" style="margin-top:var(--s4)"><button type="button" class="btn btn--ghost btn--sm" id="clear-optin">Clear all choices</button></div>' : ''}
      </div>
      <aside class="panel" style="position:sticky;top:var(--s4)">
        <h2>Pilot KPI</h2>
        <p class="small">Share of held conversations where both sides chose to continue, across every format.</p>
        <div class="kpi" style="margin-top:var(--s6)">
          <div class="kpi__track" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Mutual opt-in rate">
            <div class="kpi__fill${below ? ' is-below' : ''}" style="width:${pct}%"></div>
            <div class="kpi__target" style="left:${OPT_IN_TARGET * 100}%"><span>Target ${Math.round(OPT_IN_TARGET * 100)}%</span></div>
          </div>
          <div class="metric__v" style="margin-top:var(--s2)">${pct}%</div>
          <p class="small" style="margin:0">${a.optIn.mutual} of ${a.optIn.held} conversations, ${a.optIn.answered} fully answered.</p>
          <p class="small" style="margin:0;font-weight:700;color:${below ? 'var(--amber-800)' : 'var(--pine-700)'}">${below ? (() => { const need = Math.max(1, Math.ceil(OPT_IN_TARGET * a.optIn.held) - a.optIn.mutual); return `Below target: ${need} more mutual opt-in${need === 1 ? '' : 's'} needed.`; })() : 'On or above the 40% pilot target.'}</p>
        </div>
      </aside>
    </div>`;
}

// ---------- company value report ----------
function renderReports(state) {
  if (!ui.reportCompany || !company(ui.reportCompany)) ui.reportCompany = state.companies[0]?.id;
  const c = company(ui.reportCompany);
  const a = aggregates();
  const r = a.byCompany[c.id] || { responses: 0, bookmarks: 0, requests: 0, invites: 0, mutual: 0, confirmed: 0, continued: 0, themes: {}, questions: 0, languages: {}, intents: {}, confirmedFormats: {} };
  const chs = state.challenges.filter((x) => x.companyId === c.id);
  const themes = Object.entries(r.themes || {}).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]);
  const funnel = [
    { label: 'Saved the challenge', value: r.bookmarks },
    { label: 'Shared their thinking', value: r.responses },
    { label: 'Conversation requests and invitations', value: r.requests + r.invites },
    { label: 'Agreed by both sides', value: r.mutual },
    { label: 'Confirmed by the event team', value: r.confirmed },
    { label: 'Both chose to continue afterwards', value: r.continued },
  ];
  const who = INTENTS.map((it) => ({ label: it.label, value: (r.intents || {})[it.id] || 0, unit: 'approaches', tone: it.format }));
  const conv = r.confirmed ? Math.round((r.continued / r.confirmed) * 100) : 0;
  const outcomes = FORMATS.map((f) => ({ label: f.label, value: (r.confirmedFormats || {})[f.id] || 0, unit: 'conversations', tone: f.id })).filter((x) => x.value > 0);
  return `
    <div class="row row--between no-print" style="margin-bottom:var(--s5)">
      <div class="field" style="min-width:260px"><label for="report-company">Host</label><select id="report-company">${state.companies.map((x) => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div class="row"><button type="button" class="btn btn--secondary" id="print-report">Print or save as PDF</button><button type="button" class="btn btn--ghost" id="download-report">Download report (HTML)</button></div>
    </div>
    <article class="report" aria-labelledby="rep-h">
      <header class="report__head">
        <div><p class="small muted" style="margin:0">Skillink value report</p><h1 id="rep-h" style="margin:0">${esc(c.name)}</h1></div>
        <div class="small" style="text-align:right">${esc(state.event.name)}<br>${esc(fmtDate(state.event.date, { year: true }))}, ${esc(state.event.venue)}<br><span class="muted">Generated ${esc(fmtDateTime(new Date().toISOString()))}</span></div>
      </header>
      <p>${esc(c.name)} posted ${chs.length} challenge${chs.length === 1 ? '' : 's'}: ${chs.map((x) => `<strong>${esc(x.title)}</strong> (${(x.formats || []).map((f) => esc(fmtOf(f).label)).join(', ')})`).join('; ') || 'none'}.</p>
      <div class="metrics" style="margin:var(--s5) 0">
        <div class="metric"><div class="metric__v">${r.responses}</div><div class="metric__l">People and teams showed their thinking</div></div>
        <div class="metric"><div class="metric__v">${r.questions}</div><div class="metric__l">Questions asked about your problem</div></div>
        <div class="metric"><div class="metric__v">${r.confirmed}</div><div class="metric__l">Conversations held</div></div>
        <div class="metric"><div class="metric__v">${conv}%</div><div class="metric__l">Ended in "let's continue" on both sides</div></div>
      </div>
      <div class="grid grid--2">
        <section aria-labelledby="rep-w"><h2 id="rep-w">Who engaged with your challenge</h2>
          <p class="small muted">How solvers said they were approaching it: as talent, researchers, pilot partners or open to the best fit. Self-declared, counted, never scored.</p>
          ${bars(who, Math.max(1, ...who.map((w) => w.value)))}</section>
        <section aria-labelledby="rep-f"><h2 id="rep-f">From interest to conversation</h2>${bars(funnel, Math.max(1, ...funnel.map((f) => f.value)))}</section>
        <section aria-labelledby="rep-t"><h2 id="rep-t">What solvers asked about</h2>
          <p class="small muted">Themes in the questions solvers wrote for you, grouped by a transparent keyword list. This describes questions, never people.</p>
          ${themes.length ? bars(themes.map(([k, v]) => ({ label: THEME_LABELS[k], value: v, unit: 'responses' })), Math.max(1, ...themes.map(([, v]) => v))) : '<p class="muted">No questions recorded.</p>'}
        </section>
        <section aria-labelledby="rep-o"><h2 id="rep-o">Meeting outcomes by format</h2>
          ${outcomes.length ? bars(outcomes, Math.max(1, ...outcomes.map((o) => o.value))) : '<p class="muted">No conversations held yet.</p>'}
          <p class="small muted" style="margin-top:var(--s3)">${r.continued} of ${r.confirmed} held conversation${r.confirmed === 1 ? '' : 's'} continued outside Skillink.</p>
        </section>
      </div>
      <p class="small muted" style="margin-top:var(--s6);border-top:1px solid var(--line);padding-top:var(--s3)">All figures are anonymous counts. No solver or team was scored, ranked or filtered by software. Prepared by the ${esc(state.event.organizers || 'City of Espoo')} event team.</p>
    </article>`;
}
