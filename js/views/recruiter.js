import { esc, fmtDateTime, fmtDate, toast, openDialog, langName, addDays } from '../ui.js';
import { skill, searchSkills } from '../esco.js';
import {
  getState, company, challenge, participant, update, revealedTo, pseudoLabel, inviteParticipant, respondToMeeting,
  freeSlots, existingMeeting, isConfirmed, canRevealIdentity, setFeedback, addChallenge, requestCoWriting, feedbackOutcome,
} from '../store.js';
import { statusPill, slotLabel, submissionBody, mtToggle, bindTranslation, translationTargets, verifiedBadge, langBadge, escoTags, ICON, deadlineText } from './shared.js';

const ui = { group: 'challenge' };

export function tabs(state) {
  const cid = state.currentCompanyId;
  const incoming = state.meetings.filter((m) => m.companyId === cid && m.initiator === 'participant' && m.partyStatus === 'requested').length;
  return [
    { id: 'feed', label: 'Shared thinking' },
    { id: 'meetings', label: 'Conversations', count: incoming },
    { id: 'new', label: 'Post a challenge' },
    { id: 'challenges', label: 'Your challenges' },
  ];
}

export function context(state) {
  return `<label for="company-pick">Recruiting for</label>
    <select id="company-pick">${state.companies.map((c) => `<option value="${c.id}" ${c.id === state.currentCompanyId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`;
}

export function bindContext(root) {
  root.querySelector('#company-pick')?.addEventListener('change', (e) => {
    update((s) => (s.currentCompanyId = e.target.value));
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
      respondToMeeting(b.dataset.respond, accept);
      toast(accept ? 'Accepted. You can now see this participant\'s name and email. The event team will confirm the time.' : 'Request declined. The participant gets their request back.');
    }),
  );
  root.querySelectorAll('[data-fb]').forEach((b) =>
    b.addEventListener('click', () => {
      setFeedback(b.dataset.fb, 'recruiter', b.dataset.choice);
      toast('Your private choice is saved.');
    }),
  );
  if (ctx.tab === 'new') bindNew(root);
}

function companySubs(state) {
  const chIds = state.challenges.filter((c) => c.companyId === state.currentCompanyId).map((c) => c.id);
  return state.submissions.filter((s) => s.status === 'submitted' && chIds.includes(s.challengeId));
}

function whoBlock(state, pid, meetingObj) {
  const cid = state.currentCompanyId;
  const p = participant(pid);
  if (p && revealedTo(cid, pid)) {
    return `${esc(p.name)}<small>${esc(p.email)}. ${verifiedBadge('Identity shared after you both agreed to meet')}</small>`;
  }
  return `${esc(pseudoLabel(pid))}<small>${ICON.lock} Name and contact stay hidden until you both agree to meet</small>`;
}

// ---------- feed ----------
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
        <div class="sub__who">${whoBlock(state, s.participantId, m)}</div>
        <span class="pill pill--muted pill--plain">Written in ${esc(langName(s))}</span>
        <span class="small muted">Shared ${esc(fmtDateTime(s.submittedAt))}</span>
      </div>
      <div class="sub__body">
        ${ui.group === 'time' ? `<p class="small muted" style="margin-bottom:var(--s3)">On: ${esc(ch.title)}</p>` : ''}
        ${submissionBody(s)}
      </div>
      <div class="sub__foot">
        ${canTranslate ? mtToggle(s) : ''}
        <span style="margin-left:auto" class="row">
          ${m ? `${statusPill(m)}${m.partyStatus === 'requested' ? `<button type="button" class="btn btn--sm btn--pine" data-respond="${m.id}" data-answer="yes">Accept their request</button>` : ''}` : `<button type="button" class="btn btn--sm btn--primary" data-invite="${s.participantId}" data-ch="${s.challengeId}">Invite to a conversation</button>`}
        </span>
      </div>
    </article>`;
  };

  let body;
  if (!subs.length) {
    body = `<div class="empty"><h3>No shared thinking yet</h3><p>Participants can share until each challenge's deadline. Check that your <a href="#/recruiter/challenges">challenges</a> are clear and specific.</p></div>`;
  } else if (ui.group === 'time') {
    body = `<div class="stack">${subs.map(card).join('')}</div>`;
  } else {
    body = chs
      .map((ch) => {
        const list = subs.filter((s) => s.challengeId === ch.id);
        return `<section class="section" aria-labelledby="g-${ch.id}"><div class="section__head"><h2 id="g-${ch.id}">${esc(ch.title)}</h2><p class="small muted">${list.length} shared</p></div>
          ${list.length ? `<div class="stack">${list.map(card).join('')}</div>` : '<p class="muted">Nothing shared on this challenge yet.</p>'}</section>`;
      })
      .join('');
  }

  return `
    <div class="notice" role="note" aria-labelledby="zr-h">
      <span style="color:var(--trust-900)">${ICON.check}</span>
      <div><p class="notice__title" id="zr-h">Never ranked, scored or filtered by AI</p>
      <p>Shared thinking is listed by the time it was shared, oldest first${ui.group === 'challenge' ? ', grouped by challenge' : ''}. Skillink has no match scores and no automatic shortlists. People decide who to talk to.</p></div>
    </div>
    <div class="section__head" style="margin-top:var(--s6)">
      <h1 style="margin:0">Shared thinking for ${esc(c.name)}</h1>
      <div class="row" role="group" aria-label="Group shared thinking">
        <span class="small muted">Show</span>
        <button type="button" class="btn btn--sm btn--ghost" data-group="challenge" aria-pressed="${ui.group === 'challenge'}">By challenge</button>
        <button type="button" class="btn btn--sm btn--ghost" data-group="time" aria-pressed="${ui.group === 'time'}">All, by time shared</button>
      </div>
    </div>
    ${body}`;
}

function openInvite(pid, chId) {
  const state = getState();
  const c = company(state.currentCompanyId);
  const slots = freeSlots(c.id);
  openDialog({
    title: `Invite ${pseudoLabel(pid)}`,
    body: `<p>About: <strong>${esc(challenge(chId).title)}</strong></p>
      <form id="inv-form">
        <fieldset><legend>Pick one of your times at ${esc(state.event.venue)}</legend>
        ${slots.length ? `<div class="slots">${slots.map((s, i) => `<label class="slot"><input type="radio" name="slot" value="${s.id}" ${i === 0 ? 'checked' : ''}><span>${esc(slotLabel(s.id).split(', ').pop())}<small>${esc(fmtDate(s.start, { weekday: true }))}</small></span></label>`).join('')}</div>` : '<p class="notice notice--amber">All your times are booked.</p>'}
        </fieldset>
        <p class="small muted">The participant decides whether to accept. You'll see their name and email only if they do. The City of Espoo event team then confirms the time.</p>
        <div class="row row--end"><button type="button" class="btn btn--ghost" data-close>Cancel</button><button type="submit" class="btn btn--primary" ${slots.length ? '' : 'disabled'}>Send invitation</button></div>
      </form>`,
    onBind: (dlg, close) =>
      dlg.querySelector('#inv-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const res = inviteParticipant(c.id, pid, chId, new FormData(e.target).get('slot'));
        if (!res.ok) return toast(res.error, 'error');
        close();
        toast(`Invitation sent to ${pseudoLabel(pid)}.`);
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
    </div>${statusPill(m)}<div class="list__actions">${actions}</div></li>`;
  return `
    <section aria-labelledby="in-h">
      <div class="section__head"><h1 id="in-h" style="margin:0">Requests from participants</h1><p class="small muted">Oldest first. Read their thinking on the <a href="#/recruiter/feed">Shared thinking</a> tab.</p></div>
      ${incoming.length ? `<ul class="list">${incoming.map((m) => line(m, `<button type="button" class="btn btn--sm btn--pine" data-respond="${m.id}" data-answer="yes">Accept</button><button type="button" class="btn btn--sm btn--ghost" data-respond="${m.id}" data-answer="no">Decline</button>`)).join('')}</ul>` : '<div class="empty"><h3>No requests waiting</h3><p>New requests appear here as participants send them.</p></div>'}
    </section>
    <section class="section" aria-labelledby="all-h">
      <div class="section__head"><h2 id="all-h">All conversations</h2></div>
      ${rest.length ? `<ul class="list">${rest.map((m) => line(m)).join('')}</ul>` : '<p class="muted">No other conversations yet.</p>'}
    </section>
    ${confirmed.length ? `<section class="section" aria-labelledby="pe-h">
      <div class="section__head"><h2 id="pe-h">After the event</h2><p class="small muted">Private. The participant never sees your choice; contact details are exchanged only if you both choose to continue.</p></div>
      <ul class="list">${confirmed.map((m) => {
        const f = state.feedback[m.id] || {};
        const out = feedbackOutcome(m.id);
        const p = participant(m.participantId);
        return `<li><div class="list__main"><h4>${p ? esc(p.name) : esc(pseudoLabel(m.participantId))}</h4><p>${esc(challenge(m.challengeId).title)}</p>${out === 'mutual' ? '<p style="color:var(--pine-700);font-weight:700">You both chose to continue. Reach out to them directly.</p>' : ''}</div>
        <div class="list__actions" role="group" aria-label="Your private choice"><button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="continue" aria-pressed="${f.recruiter === 'continue'}">Let's continue</button><button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="notnow" aria-pressed="${f.recruiter === 'notnow'}">Not now</button></div></li>`;
      }).join('')}</ul></section>` : ''}`;
}

// ---------- 10-minute challenge template ----------
const LANG_PRESETS = ['English is fine', 'Finnish or English', 'Swedish & English', 'Finnish B1+ required, English for team syncs', 'Finnish required'];
const INDUSTRIES = ['Energy', 'Public sector', 'Manufacturing', 'Deep tech', 'SaaS', 'Mobility', 'Health', 'Retail', 'Other'];
const TEMPLATES = {
  Energy: { title: 'Our [system] struggles when [specific condition]', context: 'We operate [what] for [who] in Espoo. Today it works when [normal case], but when [hard case] we see [concrete problem, with a number if possible].', tricky: 'The obvious fix of [X] fails because [constraint]. We also cannot [limitation].', tags: ['gt-energy-eff', 'gt-demand', 'ai-timeseries'] },
  SaaS: { title: 'Customers [do something unwanted] after [moment]', context: 'We sell [product] to [customer type]. Around [number]% of customers [problem] within [time].', tricky: 'Our data shows [what you see], but not [what you need to know]. Customers differ in [ways].', tags: ['b2b-onboarding', 'b2b-success', 'sd-journey'] },
  default: { title: 'We need to [goal] without [constraint]', context: 'Our team at [company] in Espoo is working on [area]. Right now, [what happens], which means [impact on people or business].', tricky: 'We already tried [attempt] and it did not work because [reason]. The hard part is [tension].', tags: [] },
};

const draft = { title: '', context: '', tricky: '', tags: [], language: 'English is fine', languageCustom: '', industry: '', deadline: '', cowrite: false };

function readiness(d) {
  return [
    { ok: d.title.trim().length >= 12, t: 'A title that names the problem' },
    { ok: d.context.trim().length >= 80, t: 'Real-world context, a few sentences' },
    { ok: d.tricky.trim().length >= 40, t: 'What makes it tricky' },
    { ok: d.tags.length >= 2 && d.tags.length <= 6, t: '2 to 6 ESCO skills' },
    { ok: !!(d.language === 'custom' ? d.languageCustom.trim() : d.language), t: 'A real language requirement' },
    { ok: !!d.industry, t: 'Industry or topic' },
    { ok: !!d.deadline, t: 'Deadline for participants' },
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
      <p class="lede" style="margin-top:0">Ten minutes. Describe something your team is actually working on. Participants answer this, not a job ad, so clear and specific beats polished. Challenges must be published before participant registration closes.</p>

      <div class="panel panel--trust">
        <div class="row row--between">
          <div><h3 style="margin:0">Co-write with City of Espoo Business Services</h3><p class="small" style="margin:4px 0 0">Short on time? A business advisor helps turn your notes into a clear challenge. Free for Espoo employers.</p></div>
          <button type="button" class="toggle" role="switch" id="cowrite" aria-checked="${draft.cowrite}"><span class="toggle__track" aria-hidden="true"></span>Request co-writing support</button>
        </div>
        <div id="cowrite-panel" ${draft.cowrite ? '' : 'hidden'} style="margin-top:var(--s4)">
          <p class="small">Start from a template, then fill in the brackets. Your advisor reviews the draft within one working day.</p>
          <div class="row">
            <button type="button" class="btn btn--sm btn--secondary" id="prefill">Fill empty fields with a starting template</button>
            <button type="button" class="btn btn--sm btn--ghost" id="refine">Check my draft</button>
          </div>
          <div id="refine-out" aria-live="polite"></div>
        </div>
      </div>

      <fieldset class="qblock"><legend class="sr-only">The problem</legend>
        <h3><span class="qblock__n">1</span><label for="n-title">Problem title</label></h3>
        <p class="hint" id="n-title-h">Name the problem, not the role. For example: "Our gateways go silent at −25 °C".</p>
        <input type="text" id="n-title" name="title" aria-describedby="n-title-h" value="${esc(draft.title)}" maxlength="120" />
        <h3 style="margin-top:var(--s4)"><label for="n-context">Real-world context</label></h3>
        <p class="hint" id="n-context-h">What is your team actually wrestling with? Who is affected, and what happens today?</p>
        <textarea id="n-context" name="context" aria-describedby="n-context-h" rows="4">${esc(draft.context)}</textarea>
      </fieldset>

      <fieldset class="qblock"><legend class="sr-only">What makes this tricky</legend>
        <h3><span class="qblock__n">2</span><label for="n-tricky">What makes this tricky?</label></h3>
        <p class="hint" id="n-tricky-h">The constraint only your team knows about. This is what makes generic, copy-pasted answers easy to spot.</p>
        <textarea id="n-tricky" name="tricky" aria-describedby="n-tricky-h" rows="3">${esc(draft.tricky)}</textarea>
      </fieldset>

      <div class="qblock">
        <h3><span class="qblock__n">3</span><label for="esco-input">ESCO skills this touches</label></h3>
        <p class="hint" id="esco-h">Search the European skills taxonomy. Pick 2 to 6. Skills describe the problem; they're never used to rank people.</p>
        <div class="picker">
          <div class="picker__chosen" id="esco-chosen" aria-label="Chosen skills"></div>
          <input type="text" id="esco-input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="esco-list" aria-describedby="esco-h" placeholder="Type a skill or domain, e.g. energy, user research" autocomplete="off" />
          <ul class="picker__list" id="esco-list" role="listbox" aria-label="Matching ESCO skills" hidden></ul>
        </div>
      </div>

      <fieldset class="qblock"><legend class="sr-only">Language and timing</legend>
        <h3><span class="qblock__n">4</span><label for="n-lang">Real language requirement</label></h3>
        <p class="hint" id="n-lang-h">What does the job really need day to day? Over-asking for Finnish shuts out people who would do well.</p>
        <select id="n-lang" name="language" aria-describedby="n-lang-h">${LANG_PRESETS.map((l) => `<option ${draft.language === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}<option value="custom" ${draft.language === 'custom' ? 'selected' : ''}>Something else…</option></select>
        <input type="text" id="n-lang-custom" name="languageCustom" placeholder="Describe the requirement" value="${esc(draft.languageCustom)}" ${draft.language === 'custom' ? '' : 'hidden'} style="margin-top:var(--s2)" aria-label="Custom language requirement" />
        <div class="grid grid--2" style="margin-top:var(--s4)">
          <div class="field"><label for="n-ind">Industry or topic</label><select id="n-ind" name="industry"><option value="">Choose…</option>${INDUSTRIES.map((i) => `<option ${draft.industry === i ? 'selected' : ''}>${i}</option>`).join('')}</select></div>
          <div class="field"><label for="n-deadline">Participants share by</label><input type="date" id="n-deadline" name="deadline" min="${minDate}" max="${maxDate}" value="${esc(draft.deadline)}" /><p class="hint">At least two days before the event, so there's time to arrange conversations.</p></div>
        </div>
      </fieldset>

      <p class="field-error" id="n-error" hidden></p>
      <div class="row row--end">
        <button type="submit" class="btn btn--primary">Publish challenge</button>
      </div>
    </form>
    <aside class="stack" style="position:sticky;top:var(--s4)">
      <div class="panel"><h3>Ready to publish when you have</h3><ul class="checks" id="ready-list"></ul></div>
      <div class="panel panel--quiet small"><p><strong>Why problems, not job ads?</strong></p><p>People show how they think about something real. You get better conversations, and candidates who don't fit a CV template still get seen.</p></div>
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
    ['title', 'context', 'tricky', 'language', 'languageCustom', 'industry', 'deadline'].forEach((k) => (draft[k] = fd.get(k) ?? ''));
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
  form.querySelector('#n-lang').addEventListener('change', (e) => (form.querySelector('#n-lang-custom').hidden = e.target.value !== 'custom'));

  const sw = root.querySelector('#cowrite');
  sw.addEventListener('click', () => {
    syncDraft();
    draft.cowrite = !draft.cowrite;
    sw.setAttribute('aria-checked', String(draft.cowrite));
    root.querySelector('#cowrite-panel').hidden = !draft.cowrite;
    if (draft.cowrite) {
      requestCoWriting(getState().currentCompanyId, 'Requested from the challenge template');
      toast('Co-writing support requested. An Espoo Business Services advisor will review your draft within one working day.');
    }
  });
  root.querySelector('#prefill').addEventListener('click', () => {
    syncDraft();
    const t = TEMPLATES[draft.industry] || TEMPLATES.default;
    let filled = 0;
    [['title', 'n-title'], ['context', 'n-context'], ['tricky', 'n-tricky']].forEach(([k, id]) => {
      const el = form.querySelector(`#${id}`);
      if (!el.value.trim()) {
        el.value = t[k];
        filled += 1;
      }
    });
    t.tags.forEach((tag) => !draft.tags.includes(tag) && draft.tags.length < 6 && draft.tags.push(tag));
    syncDraft();
    paintChosen();
    paintReady();
    toast(filled ? `Filled ${filled} empty field${filled > 1 ? 's' : ''}. Replace the [brackets] with your details.` : 'All text fields already have content. Use "Check my draft" for suggestions.');
  });
  root.querySelector('#refine').addEventListener('click', () => {
    syncDraft();
    const tips = [];
    if (/\[[^\]]+\]/.test(draft.title + draft.context + draft.tricky)) tips.push('Replace the remaining [bracketed] parts with your real details.');
    if (!/\d/.test(draft.context)) tips.push('Add one concrete number to the context: how many users, sites, hours or euros.');
    if (/\b(rockstar|ninja|passionate|dynamic|fast-paced)\b/i.test(draft.title + draft.context)) tips.push('Drop job-ad words like "passionate" or "fast-paced". Describe the problem instead.');
    if (draft.tricky.trim().length < 40) tips.push('Say what you have already tried, or which constraint makes the obvious answer fail.');
    if (draft.language === 'Finnish required') tips.push('Check whether Finnish is needed from day one. "Finnish or English" widens the pool a lot.');
    if (draft.tags.length < 2) tips.push('Add at least two ESCO skills so participants can find the challenge.');
    root.querySelector('#refine-out').innerHTML = `<div class="callout" style="margin-top:var(--s3)"><strong>${tips.length ? 'Suggestions from your advisor checklist' : 'Looks clear and specific.'}</strong>${tips.length ? `<ul class="bullets">${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    syncDraft();
    const missing = readiness(draft).filter((r) => !r.ok);
    const err = root.querySelector('#n-error');
    if (missing.length) {
      err.hidden = false;
      err.textContent = `Before publishing, add: ${missing.map((m) => m.t.toLowerCase()).join('; ')}.`;
      err.setAttribute('tabindex', '-1');
      err.focus();
      return;
    }
    if (/\[[^\]]+\]/.test(draft.title + draft.context + draft.tricky)) {
      err.hidden = false;
      err.textContent = 'Some template [brackets] are still in the text. Replace them with your real details.';
      err.focus();
      return;
    }
    const s = getState();
    addChallenge({
      companyId: s.currentCompanyId,
      title: draft.title.trim(),
      context: draft.context.trim(),
      tricky: draft.tricky.trim(),
      escoTags: [...draft.tags],
      language: draft.language === 'custom' ? draft.languageCustom.trim() : draft.language,
      industry: draft.industry,
      deadline: draft.deadline,
      coWritten: draft.cowrite,
    });
    Object.assign(draft, { title: '', context: '', tricky: '', tags: [], language: 'English is fine', languageCustom: '', industry: '', deadline: '', cowrite: false });
    toast('Challenge published. Participants can see it on the problem board now.');
    location.hash = '#/recruiter/challenges';
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
    <div class="section__head"><h1 style="margin:0">Your challenges</h1><a class="btn btn--primary btn--sm" href="#/recruiter/new">Post a challenge</a></div>
    ${chs.length ? `<ul class="list">${chs
      .map(
        (ch) => `<li><div class="list__main"><h4>${esc(ch.title)}</h4><p>${deadlineText(ch.deadline)}</p><div style="margin-top:var(--s2)">${escoTags(ch.escoTags)}</div></div>
        ${langBadge(ch.language)}<div class="list__actions"><a class="btn btn--sm btn--ghost" href="#/recruiter/feed">${count(ch.id)} shared</a></div></li>`,
      )
      .join('')}</ul>` : '<div class="empty"><h3>No challenges yet</h3><p>Post your first challenge. It takes about ten minutes.</p></div>'}`;
}
