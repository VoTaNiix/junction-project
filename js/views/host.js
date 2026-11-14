// Challenge host: hiring managers, R&D leads and innovation partners.
import { esc, fmtDateTime, fmtDate, toast, openDialog, langName, addDays } from '../ui.js';
import { skill, searchSkills } from '../esco.js';
import {
  getState, company, challenge, participant, setCurrentCompany, revealedTo, pseudoLabel, inviteParticipant, respondToMeeting,
  freeSlots, existingMeeting, isConfirmed, canRevealIdentity, setFeedback, addChallenge, requestCoWriting, feedbackOutcome,
  findSubmission, meeting,
} from '../store.js';
import { FORMATS, intent as intentOf, defaultFormatFor, languagesFromText } from '../formats.js';
import { talentAction, showTalentSide } from '../sides.js';
import {
  statusPill, slotLabel, submissionBody, mtToggle, bindTranslation, translationTargets, verifiedBadge, langBadge, escoTags,
  ICON, deadlineText, formatBadges, formatBadge, intentBadge, formatChoice,
} from './shared.js';

const ui = { group: 'challenge' };

export function tabs(state) {
  const cid = state.currentCompanyId;
  const incoming = state.meetings.filter((m) => m.companyId === cid && m.initiator === 'participant' && m.partyStatus === 'requested').length;
  return [
    { id: 'feed', label: 'Review dashboard' },
    { id: 'meetings', label: 'Conversations', count: incoming },
    { id: 'new', label: 'Post a challenge' },
    { id: 'challenges', label: 'Your challenges' },
  ];
}

export function context(state) {
  return `<label for="company-pick">Hosting as</label>
    <select id="company-pick">${state.companies.map((c) => `<option value="${c.id}" ${c.id === state.currentCompanyId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`;
}

export function bindContext(root) {
  root.querySelector('#company-pick')?.addEventListener('change', (e) => {
    setCurrentCompany(e.target.value);
  });
}

export function render(state, tab) {
  if (tab === 'meetings') return renderMeetings(state);
  if (tab === 'new') return renderNew(state);
  if (tab === 'challenges') return renderChallenges(state);
  return renderFeed(state);
}

export function bind(root, ctx) {
  bindTranslation(root, ctx.rerender);
  root.querySelectorAll('[data-invite]').forEach((b) => b.addEventListener('click', () => openInvite(b.dataset.invite, b.dataset.ch)));
  root.querySelectorAll('[data-group]').forEach((b) =>
    b.addEventListener('click', () => {
      ui.group = b.dataset.group;
      ctx.rerender();
    }),
  );
  root.querySelectorAll('[data-respond]').forEach((b) =>
    b.addEventListener('click', () => {
      const accept = b.dataset.answer === 'yes';
      const pid = meeting(b.dataset.respond)?.participantId;
      respondToMeeting(b.dataset.respond, accept);
      toast(
        accept ? 'Accepted. You can now see this solver\'s name and email. The event team will confirm the time.' : 'Request declined. The solver gets their request back.',
        'ok',
        pid ? talentAction(pid, 'meetings') : null,
      );
    }),
  );
  root.querySelectorAll('[data-fb]').forEach((b) =>
    b.addEventListener('click', () => {
      setFeedback(b.dataset.fb, 'host', b.dataset.choice);
      toast('Your private choice is saved.');
    }),
  );
  if (ctx.tab === 'new') bindNew(root);
}

function companySubs(state) {
  const chIds = state.challenges.filter((c) => c.companyId === state.currentCompanyId).map((c) => c.id);
  return state.submissions.filter((s) => s.status === 'submitted' && chIds.includes(s.challengeId));
}

function whoBlock(state, pid) {
  const cid = state.currentCompanyId;
  const p = participant(pid);
  if (p && revealedTo(cid, pid)) {
    return `${esc(p.name)}<small>${esc(p.email)}. ${verifiedBadge('Identity shared after you both agreed to meet')}</small>`;
  }
  return `${esc(pseudoLabel(pid))}<small>${ICON.lock} Name, team and contact stay hidden until you both agree to meet</small>`;
}

// ---------- host review dashboard ----------
function renderFeed(state) {
  const subs = companySubs(state).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const c = company(state.currentCompanyId);
  const chs = state.challenges.filter((x) => x.companyId === c.id);
  const card = (s) => {
    const ch = challenge(s.challengeId);
    const m = existingMeeting(s.participantId, s.challengeId);
    const canTranslate = s.lang !== 'en' || translationTargets(s).length;
    return `<article class="sub" aria-label="Shared thinking from ${esc(pseudoLabel(s.participantId))}">
      <div class="sub__head">
        <div class="sub__who">${whoBlock(state, s.participantId)}</div>
        ${intentBadge(s.intent)}
        <span class="pill pill--muted pill--plain">Written in ${esc(langName(s))}</span>
        <span class="small muted">Shared ${esc(fmtDateTime(s.submittedAt))}</span>
      </div>
      <div class="sub__body">
        ${ui.group === 'time' ? `<p class="small muted" style="margin-bottom:var(--s3)">On: ${esc(ch.title)}</p>` : ''}
        ${s.skills && s.skills.length ? `<div class="sub__skills"><span class="small muted">ESCO skills they say they draw on</span>${escoTags(s.skills)}</div>` : ''}
        ${submissionBody(s)}
      </div>
      <div class="sub__foot">
        ${canTranslate ? mtToggle(s) : ''}
        <span style="margin-left:auto" class="row">
          ${m ? `${formatBadge(m.format)}${statusPill(m)}${m.partyStatus === 'requested' ? `<button type="button" class="btn btn--sm btn--pine" data-respond="${m.id}" data-answer="yes">Accept their request</button>` : ''}` : `<button type="button" class="btn btn--sm btn--primary" data-invite="${s.participantId}" data-ch="${s.challengeId}">Invite to a conversation</button>`}
        </span>
      </div>
    </article>`;
  };

  let body;
  if (!subs.length) {
    body = `<div class="empty"><h3>No shared thinking yet</h3><p>Solvers can share until each challenge's deadline. Check that your <a href="#/host/challenges">challenges</a> are clear and specific.</p></div>`;
  } else if (ui.group === 'time') {
    body = `<div class="stack">${subs.map(card).join('')}</div>`;
  } else {
    body = chs
      .map((ch) => {
        const list = subs.filter((s) => s.challengeId === ch.id);
        return `<section class="section" aria-labelledby="g-${ch.id}"><div class="section__head"><div><h2 id="g-${ch.id}">${esc(ch.title)}</h2>${formatBadges(ch.formats)}</div><p class="small muted">${list.length} shared</p></div>
          ${list.length ? `<div class="stack">${list.map(card).join('')}</div>` : '<p class="muted">Nothing shared on this challenge yet.</p>'}</section>`;
      })
      .join('');
  }

  const waiting = state.meetings.filter((m) => m.companyId === c.id && m.initiator === 'participant' && m.partyStatus === 'requested').length;
  return `
    <section class="pagehead" aria-labelledby="feed-h">
      <div>
        <p class="eyebrow">Pseudonymous review</p>
        <h1 id="feed-h">Host review dashboard</h1>
        <p>Shared thinking for ${esc(c.name)}, from talent, researchers and project partners.</p>
      </div>
      <div class="row" role="group" aria-label="Group shared thinking">
        <span class="small muted">Show</span>
        <button type="button" class="btn btn--sm btn--ghost" data-group="challenge" aria-pressed="${ui.group === 'challenge'}">By challenge</button>
        <button type="button" class="btn btn--sm btn--ghost" data-group="time" aria-pressed="${ui.group === 'time'}">All, by time shared</button>
      </div>
    </section>
    <div class="metrics" style="margin:var(--s4) 0 var(--s5)">
      <div class="metric"><div class="metric__v">${chs.length}</div><div class="metric__l">Your challenges</div></div>
      <div class="metric"><div class="metric__v">${subs.length}</div><div class="metric__l">Shared thinking received</div></div>
      <div class="metric"><div class="metric__v">${waiting}</div><div class="metric__l">Conversation requests waiting for you</div></div>
    </div>
    <div class="notice" role="note" aria-labelledby="zr-h">
      <span style="color:var(--brand-900)">${ICON.check}</span>
      <div><p class="notice__title" id="zr-h">Never ranked, scored or filtered by AI</p>
      <p>Shared thinking is listed by the time it was shared, oldest first${ui.group === 'challenge' ? ', grouped by challenge' : ''}. There are no match scores, no automatic shortlists, and no logos or company sizes to judge by. People decide who to talk to.</p></div>
    </div>
    <div style="margin-top:var(--s7)">${body}</div>`;
}

function openInvite(pid, chId) {
  const state = getState();
  const c = company(state.currentCompanyId);
  const ch = challenge(chId);
  const slots = freeSlots(c.id);
  const sub = findSubmission(pid, chId);
  openDialog({
    title: `Invite ${pseudoLabel(pid)}`,
    body: `<p>About: <strong>${esc(ch.title)}</strong></p>
      ${sub ? `<p class="small muted">They are approaching this as: <strong>${esc(intentOf(sub.intent).label)}</strong>.</p>` : ''}
      <form id="inv-form">
        ${formatChoice(ch, defaultFormatFor(ch, sub?.intent))}
        <fieldset><legend>Pick one of your times at ${esc(state.event.venue)}</legend>
        ${slots.length ? `<div class="slots">${slots.map((s, i) => `<label class="slot"><input type="radio" name="slot" value="${s.id}" ${i === 0 ? 'checked' : ''}><span>${esc(slotLabel(s.id).split(', ').pop())}<small>${esc(fmtDate(s.start, { weekday: true }))}</small></span></label>`).join('')}</div>` : '<p class="notice notice--amber">All your times are booked.</p>'}
        </fieldset>
        <p class="small muted">The solver decides whether to accept. You'll see their name and email only if they do. The City of Espoo event team then confirms the time.</p>
        <div class="row row--end"><button type="button" class="btn btn--ghost" data-close>Cancel</button><button type="submit" class="btn btn--primary" ${slots.length ? '' : 'disabled'}>Send invitation</button></div>
      </form>`,
    onBind: (dlg, close) =>
      dlg.querySelector('#inv-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const res = inviteParticipant(c.id, pid, chId, fd.get('slot'), fd.get('mformat'));
        if (!res.ok) return toast(res.error, 'error');
        close();
        toast(`Invitation sent to ${pseudoLabel(pid)}.`, 'ok', talentAction(pid, 'meetings'));
      }),
  });
}

// ---------- meetings ----------
function renderMeetings(state) {
  const cid = state.currentCompanyId;
  const ms = state.meetings.filter((m) => m.companyId === cid).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const incoming = ms.filter((m) => m.initiator === 'participant' && m.partyStatus === 'requested');
  const rest = ms.filter((m) => !incoming.includes(m));
  const confirmed = ms.filter(isConfirmed);
  const line = (m, actions = '') => `<li>
    <div class="list__main"><h4>${canRevealIdentity(m) && participant(m.participantId) ? esc(participant(m.participantId).name) : esc(pseudoLabel(m.participantId))}</h4>
      <p>${esc(challenge(m.challengeId).title)}</p><p>${esc(slotLabel(m.slotId))}. ${m.initiator === 'participant' ? 'They asked you.' : 'You invited them.'}</p>
      ${canRevealIdentity(m) && participant(m.participantId) ? `<p>${esc(participant(m.participantId).email)}</p>` : ''}
      <div style="margin-top:var(--s2)">${formatBadge(m.format)}</div>
    </div>${statusPill(m)}<div class="list__actions">${actions}</div></li>`;
  return `
    <section aria-labelledby="in-h">
      <div class="section__head"><h1 id="in-h" style="margin:0">Requests from solvers</h1><p class="small muted">Oldest first. Read their thinking on the <a href="#/host/feed">Review dashboard</a>.</p></div>
      ${incoming.length ? `<ul class="list">${incoming.map((m) => line(m, `<button type="button" class="btn btn--sm btn--pine" data-respond="${m.id}" data-answer="yes">Accept</button><button type="button" class="btn btn--sm btn--ghost" data-respond="${m.id}" data-answer="no">Decline</button>`)).join('')}</ul>` : '<div class="empty"><h3>No requests waiting</h3><p>New requests appear here as solvers send them.</p></div>'}
    </section>
    <section class="section" aria-labelledby="all-h">
      <div class="section__head"><h2 id="all-h">All conversations</h2></div>
      ${rest.length ? `<ul class="list">${rest.map((m) => line(m)).join('')}</ul>` : '<p class="muted">No other conversations yet.</p>'}
    </section>
    ${confirmed.length ? `<section class="section" aria-labelledby="pe-h">
      <div class="section__head"><h2 id="pe-h">After the event</h2><p class="small muted">Private. The solver never sees your choice; contact details are exchanged only if you both choose to continue, whether for a job interview, an R&D project or pilot scoping.</p></div>
      <ul class="list">${confirmed.map((m) => {
        const f = state.feedback[m.id] || {};
        const out = feedbackOutcome(m.id);
        const p = participant(m.participantId);
        return `<li><div class="list__main"><h4>${p ? esc(p.name) : esc(pseudoLabel(m.participantId))}</h4><p>${esc(challenge(m.challengeId).title)}</p><div style="margin-top:var(--s2)">${formatBadge(m.format)}</div>${out === 'mutual' ? '<p style="color:var(--pine-700);font-weight:700;margin-top:var(--s2)">You both chose to continue. Reach out to them directly.</p>' : ''}</div>
        <div class="list__actions" role="group" aria-label="Your private choice"><button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="continue" aria-pressed="${f.host === 'continue'}">Let's continue</button><button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="notnow" aria-pressed="${f.host === 'notnow'}">Not now</button></div></li>`;
      }).join('')}</ul></section>` : ''}`;
}

// ---------- 10-minute challenge template ----------
const LANG_PRESETS = [
  { t: 'English is fine', l: ['en'] },
  { t: 'English or Finnish', l: ['en', 'fi'] },
  { t: 'English or Swedish', l: ['en', 'sv'] },
  { t: 'Finnish, Swedish, or English', l: ['fi', 'sv', 'en'] },
  { t: 'Finnish required', l: ['fi'] },
  { t: 'Swedish required', l: ['sv'] },
];
const INDUSTRIES = ['Energy', 'Public sector', 'Manufacturing', 'Deep tech', 'Construction', 'SaaS', 'Mobility', 'Health', 'Retail', 'Other'];
const TEMPLATES = {
  Energy: { title: 'Our [system] struggles when [specific condition]', summary: 'Keep [system] working when [hard case] happens.', context: 'We operate [what] for [who] in Espoo. Today it works when [normal case], but when [hard case] we see [concrete problem, with a number if possible].', tricky: 'The obvious fix of [X] fails because [constraint]. We also cannot [limitation].', tags: ['gt-energy-eff', 'gt-demand', 'ai-timeseries'] },
  Construction: { title: '[Material or process] traceability on [type of site]', summary: '[What gets lost] between [step] and [step].', context: 'We work on [type of project] in Espoo. Today [what happens], which means [impact on cost, carbon or safety, with a number].', tricky: 'Crews have [time limit], records are [format], and [certification or rule] requires [evidence].', tags: ['ce-circular', 'ce-trace', 'gt-lca'] },
  default: { title: 'We need to [goal] without [constraint]', summary: '[The bottleneck in one plain sentence].', context: 'Our team at [company] in Espoo is working on [area]. Right now, [what happens], which means [impact on people or business].', tricky: 'We already tried [attempt] and it did not work because [reason]. The hard part is [tension].', tags: [] },
};
const FORMAT_LINE = {
  hiring: 'We are hiring for this and want to meet people who would tackle it.',
  rnd: 'We would welcome a thesis, a research group or a joint R&D project on this.',
  pilot: 'We are looking for a pilot or project partner, from a solo specialist to a small startup.',
  open: 'We are open to hiring, partnering or piloting, whichever fits best.',
};

const EMPTY_DRAFT = { formats: [], title: '', summary: '', context: '', tricky: '', tags: [], language: 'English is fine', languageCustom: '', industry: '', deadline: '', cowrite: false, cwBottleneck: '', cwToday: '', cwTried: '' };
const draft = { ...EMPTY_DRAFT, formats: [], tags: [] };

function readiness(d) {
  return [
    { ok: d.formats.length >= 1, t: 'At least one collaboration format' },
    { ok: d.title.trim().length >= 12, t: 'A title that names the problem' },
    { ok: d.summary.trim().length >= 20, t: 'A one-line problem summary' },
    { ok: d.context.trim().length >= 80, t: 'Real-world context, a few sentences' },
    { ok: d.tricky.trim().length >= 40, t: 'What makes it tricky' },
    { ok: d.tags.length >= 2 && d.tags.length <= 6, t: '2 to 6 ESCO skills' },
    { ok: !!(d.language === 'custom' ? d.languageCustom.trim() : d.language), t: 'A real language requirement' },
    { ok: !!d.industry, t: 'Sector or topic' },
    { ok: !!d.deadline, t: 'Deadline for solvers' },
  ];
}

function renderNew(state) {
  const c = company(state.currentCompanyId);
  const minDate = new Date().toISOString().slice(0, 10);
  const maxDate = addDays(state.event.date, -2);
  return `
  <div class="split">
    <form id="ch-form" novalidate aria-labelledby="new-h" class="stack">
      <h1 id="new-h">Post a challenge for ${esc(c.name)}</h1>
      <p class="lede" style="margin-top:0">Ten minutes. Describe the actual bottleneck your team is wrestling with, not a boilerplate job ad or procurement RFP. Clear and specific beats polished. Challenges must be published before solver registration closes.</p>

      <div class="panel panel--trust">
        <div class="row row--between">
          <div><h3 style="margin:0">Business Espoo co-writing assistant</h3><p class="small" style="margin:4px 0 0">Short on time? Answer three quick questions and the assistant shapes them into a 10-minute challenge. A Business Espoo or City of Espoo advisor then reviews it. Free for Espoo hosts.</p></div>
          <button type="button" class="toggle" role="switch" id="cowrite" aria-checked="${draft.cowrite}"><span class="toggle__track" aria-hidden="true"></span>Request co-writing support</button>
        </div>
        <div id="cowrite-panel" ${draft.cowrite ? '' : 'hidden'} style="margin-top:var(--s4)">
          <div class="stack" style="gap:var(--s3)">
            <div class="field"><label for="cw-bottleneck">What is the bottleneck, in one sentence?</label><input type="text" id="cw-bottleneck" name="cwBottleneck" value="${esc(draft.cwBottleneck)}" placeholder="e.g. Our gateways go silent when it is very cold" /></div>
            <div class="field"><label for="cw-today">What happens today because of it?</label><p class="hint" id="cw-today-h">A number helps: hours lost, sites affected, euros, users.</p><textarea id="cw-today" name="cwToday" rows="2" aria-describedby="cw-today-h">${esc(draft.cwToday)}</textarea></div>
            <div class="field"><label for="cw-tried">What have you tried, or what rules out the obvious fix?</label><textarea id="cw-tried" name="cwTried" rows="2">${esc(draft.cwTried)}</textarea></div>
          </div>
          <div class="row" style="margin-top:var(--s4)">
            <button type="button" class="btn btn--sm btn--primary" id="cw-draft">Draft my challenge from these notes</button>
            <button type="button" class="btn btn--sm btn--secondary" id="prefill">Fill empty fields with a starting template</button>
            <button type="button" class="btn btn--sm btn--ghost" id="refine">Check my draft</button>
          </div>
          <p class="small muted" style="margin-top:var(--s3)">The assistant follows a fixed, published template. It does not use AI and never sees anyone's answers.</p>
          <div id="refine-out" aria-live="polite"></div>
        </div>
      </div>

      <fieldset class="qblock" aria-describedby="n-formats-h">
        <legend class="sr-only">Collaboration format</legend>
        <h3><span class="qblock__n">1</span>What kind of collaboration are you open to?</h3>
        <p class="hint" id="n-formats-h">Choose one or more. Solvers see these as badges and can filter by them.</p>
        <div class="fpick">${FORMATS.map((f) => `<label class="fpick__opt fpick__opt--${f.id}"><input type="checkbox" name="formats" value="${f.id}" ${draft.formats.includes(f.id) ? 'checked' : ''}><span><strong>${esc(f.hostLabel)}</strong><span class="small">${esc(f.label)}: ${esc(f.desc)}</span></span></label>`).join('')}</div>
      </fieldset>

      <fieldset class="qblock"><legend class="sr-only">The problem</legend>
        <h3><span class="qblock__n">2</span><label for="n-title">Problem title</label></h3>
        <p class="hint" id="n-title-h">Name the problem, not the role or the product. For example: "Industrial edge IoT anomaly detection".</p>
        <input type="text" id="n-title" name="title" aria-describedby="n-title-h" value="${esc(draft.title)}" maxlength="120" />
        <h3 style="margin-top:var(--s4)"><label for="n-summary">Problem summary</label></h3>
        <p class="hint" id="n-summary-h">One plain sentence that a newcomer would understand.</p>
        <input type="text" id="n-summary" name="summary" aria-describedby="n-summary-h" value="${esc(draft.summary)}" maxlength="160" />
        <h3 style="margin-top:var(--s4)"><label for="n-context">Real-world context</label></h3>
        <p class="hint" id="n-context-h">What is your team actually wrestling with? Who is affected, and what happens today?</p>
        <textarea id="n-context" name="context" aria-describedby="n-context-h" rows="4">${esc(draft.context)}</textarea>
      </fieldset>

      <fieldset class="qblock"><legend class="sr-only">What makes this tricky</legend>
        <h3><span class="qblock__n">3</span><label for="n-tricky">What makes this tricky?</label></h3>
        <p class="hint" id="n-tricky-h">The constraint only your team knows about. This is what makes generic, AI-written answers and pitches easy to spot.</p>
        <textarea id="n-tricky" name="tricky" aria-describedby="n-tricky-h" rows="3">${esc(draft.tricky)}</textarea>
      </fieldset>

      <div class="qblock">
        <h3><span class="qblock__n">4</span><label for="esco-input">ESCO skills this touches</label></h3>
        <p class="hint" id="esco-h">Search the European skills taxonomy. Pick 2 to 6. Skills describe the problem; they're never used to rank people.</p>
        <div class="picker">
          <div class="picker__chosen" id="esco-chosen" aria-label="Chosen skills"></div>
          <input type="text" id="esco-input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="esco-list" aria-describedby="esco-h" placeholder="Type a skill or domain, e.g. energy, research, circular" autocomplete="off" />
          <ul class="picker__list" id="esco-list" role="listbox" aria-label="Matching ESCO skills" hidden></ul>
        </div>
      </div>

      <fieldset class="qblock"><legend class="sr-only">Language and timing</legend>
        <h3><span class="qblock__n">5</span><label for="n-lang">Real language requirement</label></h3>
        <p class="hint" id="n-lang-h">What does the work really need day to day? Over-asking for Finnish shuts out people and teams who would do well.</p>
        <select id="n-lang" name="language" aria-describedby="n-lang-h">${LANG_PRESETS.map((l) => `<option ${draft.language === l.t ? 'selected' : ''}>${esc(l.t)}</option>`).join('')}<option value="custom" ${draft.language === 'custom' ? 'selected' : ''}>Something else…</option></select>
        <input type="text" id="n-lang-custom" name="languageCustom" placeholder="Describe the requirement" value="${esc(draft.languageCustom)}" ${draft.language === 'custom' ? '' : 'hidden'} style="margin-top:var(--s2)" aria-label="Custom language requirement" />
        <div class="grid grid--2" style="margin-top:var(--s4)">
          <div class="field"><label for="n-ind">Sector or topic</label><select id="n-ind" name="industry"><option value="">Choose…</option>${INDUSTRIES.map((i) => `<option ${draft.industry === i ? 'selected' : ''}>${i}</option>`).join('')}</select></div>
          <div class="field"><label for="n-deadline">Solvers share by</label><input type="date" id="n-deadline" name="deadline" min="${minDate}" max="${maxDate}" value="${esc(draft.deadline)}" /><p class="hint">At least two days before the event, so there's time to arrange conversations.</p></div>
        </div>
      </fieldset>

      <p class="field-error" id="n-error" hidden></p>
      <div class="row row--end">
        <button type="submit" class="btn btn--primary">Publish challenge</button>
      </div>
    </form>
    <aside class="stack" style="position:sticky;top:var(--s4)">
      <div class="panel"><h3>Ready to publish when you have</h3><ul class="checks" id="ready-list"></ul></div>
      <div class="panel panel--quiet small"><p><strong>Why problems, not job ads or RFPs?</strong></p><p>People show how they think about something real. You get better conversations, and talent, researchers and small teams who don't fit a CV template or a vendor list still get seen.</p></div>
    </aside>
  </div>`;
}

function bindNew(root) {
  const form = root.querySelector('#ch-form');
  const chosen = root.querySelector('#esco-chosen');
  const input = root.querySelector('#esco-input');
  const list = root.querySelector('#esco-list');
  const readyList = root.querySelector('#ready-list');
  let active = -1;
  let results = [];

  const syncDraft = () => {
    const fd = new FormData(form);
    ['title', 'summary', 'context', 'tricky', 'language', 'languageCustom', 'industry', 'deadline', 'cwBottleneck', 'cwToday', 'cwTried'].forEach((k) => (draft[k] = fd.get(k) ?? ''));
    draft.formats = fd.getAll('formats');
  };
  const paintReady = () => {
    readyList.innerHTML = readiness(draft)
      .map((r) => `<li class="check" style="color:${r.ok ? 'var(--pine-700)' : 'var(--text-3)'}">${r.ok ? ICON.check : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>'}<p style="color:var(--text)">${esc(r.t)}<span class="sr-only">${r.ok ? ', done' : ', not done yet'}</span></p></li>`)
      .join('');
  };
  const paintChosen = () => {
    chosen.innerHTML = draft.tags.map((id) => `<button type="button" class="chip" data-remove="${id}" aria-label="Remove ${esc(skill(id).label)}">${esc(skill(id).label)} <span aria-hidden="true">✕</span></button>`).join('');
    chosen.querySelectorAll('[data-remove]').forEach((b) =>
      b.addEventListener('click', () => {
        draft.tags = draft.tags.filter((t) => t !== b.dataset.remove);
        paintChosen();
        paintReady();
        input.focus();
      }),
    );
  };
  const paintList = () => {
    results = searchSkills(input.value, draft.tags).slice(0, 12);
    list.hidden = !results.length || document.activeElement !== input;
    input.setAttribute('aria-expanded', String(!list.hidden));
    list.innerHTML = results.map((s, i) => `<li role="option" id="opt-${s.id}" data-id="${s.id}" aria-selected="${i === active}">${esc(s.label)}<span>${esc(s.domain)}</span></li>`).join('');
    input.setAttribute('aria-activedescendant', active >= 0 && results[active] ? `opt-${results[active].id}` : '');
    list.querySelectorAll('li').forEach((li) => li.addEventListener('mousedown', (e) => (e.preventDefault(), choose(li.dataset.id))));
  };
  const choose = (id) => {
    if (draft.tags.length >= 6) return toast('Pick at most 6 skills. Remove one to add another.', 'warn');
    draft.tags.push(id);
    input.value = '';
    active = -1;
    paintChosen();
    paintList();
    paintReady();
  };
  input.addEventListener('input', () => ((active = -1), paintList()));
  input.addEventListener('focus', paintList);
  input.addEventListener('blur', () => setTimeout(() => ((list.hidden = true), input.setAttribute('aria-expanded', 'false')), 100));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') (e.preventDefault(), (active = Math.min(active + 1, results.length - 1)), paintList());
    else if (e.key === 'ArrowUp') (e.preventDefault(), (active = Math.max(active - 1, 0)), paintList());
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) choose(results[active].id);
      else if (results.length === 1) choose(results[0].id);
    } else if (e.key === 'Escape') (list.hidden = true), input.setAttribute('aria-expanded', 'false');
  });

  form.addEventListener('input', () => (syncDraft(), paintReady()));
  form.addEventListener('change', () => (syncDraft(), paintReady()));
  form.querySelector('#n-lang').addEventListener('change', (e) => (form.querySelector('#n-lang-custom').hidden = e.target.value !== 'custom'));

  const sw = root.querySelector('#cowrite');
  sw.addEventListener('click', () => {
    syncDraft();
    draft.cowrite = !draft.cowrite;
    sw.setAttribute('aria-checked', String(draft.cowrite));
    root.querySelector('#cowrite-panel').hidden = !draft.cowrite;
    if (draft.cowrite) {
      requestCoWriting(getState().currentCompanyId, 'Requested from the challenge template');
      toast('Co-writing support requested. A Business Espoo advisor will review your draft within one working day.');
    }
  });

  const fillEmpty = (pairs) => {
    let filled = 0;
    pairs.forEach(([id, value]) => {
      const el = form.querySelector(`#${id}`);
      if (value && !el.value.trim()) {
        el.value = value;
        filled += 1;
      }
    });
    return filled;
  };

  root.querySelector('#cw-draft').addEventListener('click', () => {
    syncDraft();
    const b = draft.cwBottleneck.trim();
    const today = draft.cwToday.trim();
    const tried = draft.cwTried.trim();
    if (!b || !today) {
      toast('Answer the first two questions, then try again.', 'warn');
      (b ? form.querySelector('#cw-today') : form.querySelector('#cw-bottleneck')).focus();
      return;
    }
    const sentence = (t) => {
      const s = t.charAt(0).toUpperCase() + t.slice(1);
      return /[.!?]$/.test(s) ? s : `${s}.`;
    };
    const formats = draft.formats.length ? draft.formats : ['open'];
    const context = [sentence(today), ...formats.map((f) => FORMAT_LINE[f])].join(' ');
    const filled = fillEmpty([
      ['n-title', '[Name the problem in a few words]'],
      ['n-summary', sentence(b)],
      ['n-context', context],
      ['n-tricky', tried ? sentence(tried) : 'The obvious fix of [X] does not work because [constraint].'],
    ]);
    syncDraft();
    paintReady();
    toast(filled ? `Drafted ${filled} field${filled > 1 ? 's' : ''} from your notes. Replace any [brackets], and fields you had written were kept.` : 'Every field already has your text, so nothing was replaced. Use "Check my draft" for suggestions.');
  });

  root.querySelector('#prefill').addEventListener('click', () => {
    syncDraft();
    const t = TEMPLATES[draft.industry] || TEMPLATES.default;
    const filled = fillEmpty([
      ['n-title', t.title],
      ['n-summary', t.summary],
      ['n-context', t.context],
      ['n-tricky', t.tricky],
    ]);
    t.tags.forEach((tag) => !draft.tags.includes(tag) && draft.tags.length < 6 && draft.tags.push(tag));
    syncDraft();
    paintChosen();
    paintReady();
    toast(filled ? `Filled ${filled} empty field${filled > 1 ? 's' : ''}. Replace the [brackets] with your details.` : 'All text fields already have content. Use "Check my draft" for suggestions.');
  });

  root.querySelector('#refine').addEventListener('click', () => {
    syncDraft();
    const all = `${draft.title} ${draft.summary} ${draft.context} ${draft.tricky}`;
    const tips = [];
    if (!draft.formats.length) tips.push('Choose at least one collaboration format, so solvers know whether you are hiring, researching or piloting.');
    if (/\[[^\]]+\]/.test(all)) tips.push('Replace the remaining [bracketed] parts with your real details.');
    if (!/\d/.test(draft.context)) tips.push('Add one concrete number to the context: how many users, sites, hours or euros.');
    if (/\b(rockstar|ninja|passionate|dynamic|fast-paced)\b/i.test(all)) tips.push('Drop job-ad words like "passionate" or "fast-paced". Describe the problem instead.');
    if (/\b(rfp|tender|procurement|vendor|requirements specification)\b/i.test(all)) tips.push('Describe the bottleneck, not procurement requirements. Pilot partners answer a real problem better than an RFP.');
    if (draft.formats.includes('rnd') && !/\b(data|lab|publish|thesis|research)\b/i.test(all)) tips.push('For R&D: say what data or lab access a researcher would get, and whether results can be published.');
    if (draft.formats.includes('pilot') && !/\b(week|month|site|scope|pilot)\b/i.test(all)) tips.push('For a pilot: say how big a first pilot could be, such as one site or six weeks.');
    if (draft.tricky.trim().length < 40) tips.push('Say what you have already tried, or which constraint makes the obvious answer fail.');
    if (draft.language === 'Finnish required' || draft.language === 'Swedish required') tips.push('Check whether one language is needed from day one. "English or Finnish" widens the pool a lot.');
    if (draft.tags.length < 2) tips.push('Add at least two ESCO skills so solvers can find the challenge.');
    root.querySelector('#refine-out').innerHTML = `<div class="callout" style="margin-top:var(--s3)"><strong>${tips.length ? 'Suggestions from the advisor checklist' : 'Looks clear and specific.'}</strong>${tips.length ? `<ul class="bullets">${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    syncDraft();
    const missing = readiness(draft).filter((r) => !r.ok);
    const err = root.querySelector('#n-error');
    err.setAttribute('tabindex', '-1');
    if (missing.length) {
      err.hidden = false;
      err.textContent = `Before publishing, add: ${missing.map((m) => m.t.toLowerCase()).join('; ')}.`;
      err.focus();
      return;
    }
    if (/\[[^\]]+\]/.test(draft.title + draft.summary + draft.context + draft.tricky)) {
      err.hidden = false;
      err.textContent = 'Some template [brackets] are still in the text. Replace them with your real details.';
      err.focus();
      return;
    }
    const s = getState();
    const language = draft.language === 'custom' ? draft.languageCustom.trim() : draft.language;
    const preset = LANG_PRESETS.find((l) => l.t === language);
    const newId = addChallenge({
      companyId: s.currentCompanyId,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      formats: [...draft.formats],
      context: draft.context.trim(),
      tricky: draft.tricky.trim(),
      escoTags: [...draft.tags],
      language,
      languages: preset ? preset.l : languagesFromText(language),
      industry: draft.industry,
      deadline: draft.deadline,
      coWritten: draft.cowrite,
    });
    Object.assign(draft, { ...EMPTY_DRAFT, formats: [], tags: [] });
    toast('Challenge published. Solvers can see it on the problem board now.', 'ok', { label: 'See it as talent', run: () => showTalentSide(null, `challenge/${newId}`) });
    location.hash = '#/host/challenges';
  });

  paintChosen();
  paintReady();
}

// ---------- your challenges ----------
function renderChallenges(state) {
  const c = company(state.currentCompanyId);
  const chs = state.challenges.filter((x) => x.companyId === c.id);
  const count = (id) => state.submissions.filter((s) => s.status === 'submitted' && s.challengeId === id).length;
  return `
    <div class="section__head"><h1 style="margin:0">Your challenges</h1><a class="btn btn--primary btn--sm" href="#/host/new">Post a challenge</a></div>
    ${chs.length ? `<ul class="list">${chs
      .map(
        (ch) => `<li><div class="list__main">${formatBadges(ch.formats)}<h4 style="margin-top:var(--s2)">${esc(ch.title)}</h4><p>${deadlineText(ch.deadline)}</p><div style="margin-top:var(--s2)">${escoTags(ch.escoTags)}</div></div>
        ${langBadge(ch.language)}<div class="list__actions"><a class="btn btn--sm btn--ghost" href="#/host/feed">${count(ch.id)} shared<span class="sr-only"> on ${esc(ch.title)}</span></a></div></li>`,
      )
      .join('')}</ul>` : '<div class="empty"><h3>No challenges yet</h3><p>Post your first challenge. It takes about ten minutes.</p></div>'}`;
}
