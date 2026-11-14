// Single source of truth for Skillink. All mutations go through this module so that
// persistence, identity rules, the request cap and the purge stay in one place.
import { buildSeed } from './seed.js';

const KEY = 'skillink.v2';
const OLD_KEYS = ['skillink.v1'];
const VERSION = 2;
export const REQUEST_CAP = 5;
export const OPT_IN_TARGET = 0.4;

// Keys that must never exist anywhere in state (EU AI Act / GDPR guardrail, see the
// eu-ai-act-and-fairness skill). The Privacy view audits the live state against this list.
// The last group blocks pedigree signals that would bias B2B and R&D matchmaking.
export const FORBIDDEN_KEYS = [
  'nationality', 'ethnicity', 'ethnicBackground', 'race', 'age', 'birthDate', 'dateOfBirth',
  'gender', 'sex', 'photo', 'photoUrl', 'avatar', 'religion', 'maritalStatus', 'disability',
  'cv', 'resume', 'score', 'matchScore', 'rank', 'rating', 'fitScore',
  'pitchDeck', 'logo', 'logoUrl', 'companySize', 'employeeCount', 'fundingStage', 'revenue',
];

let state = null;
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable (private mode); the demo still runs in memory */
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === VERSION) {
        state = parsed;
        return state;
      }
    }
  } catch {
    /* fall through to seed */
  }
  state = buildSeed();
  try {
    OLD_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  persist();
  return state;
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(opts = {}) {
  persist();
  if (opts.render !== false) listeners.forEach((fn) => fn(state));
}

export function update(mutator, opts) {
  mutator(state);
  emit(opts);
}

export function resetDemo() {
  state = buildSeed();
  emit();
}

// ---------- lookups ----------
export const byId = (list, id) => list.find((x) => x.id === id);
export const company = (id) => byId(state.companies, id);
export const challenge = (id) => byId(state.challenges, id);
export const participant = (id) => byId(state.participants, id);
export const slot = (id) => byId(state.slots, id);
export const meeting = (id) => byId(state.meetings, id);

export function currentParticipant() {
  return participant(state.currentParticipantId) || null;
}

const nowIso = () => new Date().toISOString();
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

function log(actor, action, detail) {
  state.decisionLog.unshift({ at: nowIso(), actor, action, detail });
  state.decisionLog = state.decisionLog.slice(0, 60);
}

// ---------- identity (pseudonymity by default) ----------
// The ONLY place that decides whether a name may be shown. Mutual = the counterparty accepted.
export function canRevealIdentity(m) {
  return !!m && m.partyStatus === 'accepted';
}

export function isConfirmed(m) {
  return m.partyStatus === 'accepted' && m.organizerStatus === 'approved';
}

/** Whether a given company may see this participant's real identity. */
export function revealedTo(companyId, participantId) {
  return state.meetings.some(
    (m) => m.companyId === companyId && m.participantId === participantId && canRevealIdentity(m),
  );
}

export function pseudoLabel(participantId) {
  const p = participant(participantId);
  return p ? `Solver #${p.pseudo}` : 'Solver (deleted)';
}

// ---------- meetings ----------
const ACTIVE = (m) => m.partyStatus !== 'declined' && m.partyStatus !== 'cancelled';

export function activeRequestCount(participantId) {
  return state.meetings.filter(
    (m) => m.participantId === participantId && m.initiator === 'participant' && ACTIVE(m),
  ).length;
}

export function slotTaken(slotId) {
  return state.meetings.some((m) => m.slotId === slotId && ACTIVE(m) && m.organizerStatus !== 'declined');
}

export function freeSlots(companyId) {
  return state.slots.filter((s) => s.companyId === companyId && !slotTaken(s.id));
}

export function existingMeeting(participantId, challengeId) {
  return state.meetings.find(
    (m) => m.participantId === participantId && m.challengeId === challengeId && ACTIVE(m) && m.organizerStatus !== 'declined',
  );
}

export function requestMeeting(participantId, challengeId, slotId, format) {
  if (activeRequestCount(participantId) >= REQUEST_CAP) {
    return { ok: false, error: `You have used all ${REQUEST_CAP} meeting requests. Cancel one to request another.` };
  }
  if (existingMeeting(participantId, challengeId)) {
    return { ok: false, error: 'You already have a conversation request open for this challenge.' };
  }
  if (slotTaken(slotId)) return { ok: false, error: 'That time was just taken. Pick another time.' };
  const ch = challenge(challengeId);
  update((s) => {
    s.meetings.push({
      id: uid('m'), challengeId, companyId: ch.companyId, participantId, slotId, format: format || 'open',
      initiator: 'participant', partyStatus: 'requested', organizerStatus: 'pending', createdAt: nowIso(),
    });
    log('solver', 'requested meeting', `${pseudoLabel(participantId)} → ${company(ch.companyId).name}`);
  });
  return { ok: true };
}

export function inviteParticipant(companyId, participantId, challengeId, slotId, format) {
  if (existingMeeting(participantId, challengeId)) {
    return { ok: false, error: 'There is already an open conversation with this solver for this challenge.' };
  }
  if (slotTaken(slotId)) return { ok: false, error: 'That time is already booked. Pick another time.' };
  update((s) => {
    s.meetings.push({
      id: uid('m'), challengeId, companyId, participantId, slotId, format: format || 'open',
      initiator: 'host', partyStatus: 'invited', organizerStatus: 'pending', createdAt: nowIso(),
    });
    log('host', 'invited solver', `${company(companyId).name} → ${pseudoLabel(participantId)}`);
  });
  return { ok: true };
}

/** The counterparty answers: the solver answers invites, the host answers requests. */
export function respondToMeeting(meetingId, accept) {
  update((s) => {
    const m = byId(s.meetings, meetingId);
    if (!m) return;
    const actor = m.initiator === 'participant' ? 'host' : 'solver';
    m.partyStatus = accept ? 'accepted' : 'declined';
    m.respondedAt = nowIso();
    log(actor, accept ? 'accepted meeting' : 'declined meeting', `${company(m.companyId).name} / ${pseudoLabel(m.participantId)}`);
  });
}

export function cancelMeeting(meetingId) {
  update((s) => {
    const m = byId(s.meetings, meetingId);
    if (!m) return;
    m.partyStatus = 'cancelled';
    log('solver', 'cancelled request', `${pseudoLabel(m.participantId)} → ${company(m.companyId).name}`);
  });
}

export function organizerDecision(meetingId, approve) {
  update((s) => {
    const m = byId(s.meetings, meetingId);
    if (!m) return;
    m.organizerStatus = approve ? 'approved' : 'declined';
    m.organizerAt = nowIso();
    if (approve && isConfirmed(m) && !s.feedback[m.id]) s.feedback[m.id] = { participant: null, host: null };
    log('organizer', approve ? 'approved meeting' : 'declined meeting', `${company(m.companyId).name} / ${pseudoLabel(m.participantId)}`);
  });
}

/** One label used everywhere so a status reads the same in every role. */
export function meetingStatus(m) {
  if (m.partyStatus === 'cancelled') return { key: 'cancelled', label: 'Cancelled', tone: 'muted' };
  if (m.partyStatus === 'declined') return { key: 'declined', label: 'Declined', tone: 'danger' };
  if (m.organizerStatus === 'declined') return { key: 'org-declined', label: 'Declined by organizer', tone: 'danger' };
  if (m.partyStatus === 'requested') return { key: 'requested', label: 'Waiting for host', tone: 'wait' };
  if (m.partyStatus === 'invited') return { key: 'invited', label: 'Waiting for solver', tone: 'wait' };
  if (m.organizerStatus === 'pending') return { key: 'mutual', label: 'Mutual, awaiting organizer', tone: 'info' };
  return { key: 'confirmed', label: 'Confirmed', tone: 'ok' };
}

// ---------- participant workspace ----------
export function toggleBookmark(participantId, challengeId) {
  update((s) => {
    const list = s.bookmarks[participantId] || (s.bookmarks[participantId] = []);
    const i = list.indexOf(challengeId);
    if (i >= 0) list.splice(i, 1);
    else list.push(challengeId);
  });
}

export function findSubmission(participantId, challengeId) {
  return state.submissions.find((x) => x.participantId === participantId && x.challengeId === challengeId);
}

export function saveSubmission(participantId, challengeId, data, submit, opts) {
  let result = { ok: true };
  update((s) => {
    let sub = s.submissions.find((x) => x.participantId === participantId && x.challengeId === challengeId);
    if (!sub) {
      sub = { id: uid('s'), challengeId, participantId, status: 'draft', translations: {} };
      s.submissions.push(sub);
    }
    if (sub.status === 'submitted' && !submit) {
      result = { ok: false, error: 'This approach is already shared. Withdraw it first to edit it.' };
      return;
    }
    Object.assign(sub, {
      intent: data.intent || 'open',
      lang: data.lang,
      langOther: data.langOther || '',
      format: data.format,
      skills: data.skills,
      answers: data.answers,
      updatedAt: nowIso(),
    });
    if (submit) {
      sub.status = 'submitted';
      sub.submittedAt = nowIso();
      s.consents[participantId] = { purpose: 'event-matchmaking', at: nowIso() };
      log('solver', 'shared approach', `${pseudoLabel(participantId)} → ${challenge(challengeId).title}`);
    }
  }, opts);
  return result;
}

export function withdrawSubmission(submissionId) {
  update((s) => {
    const sub = byId(s.submissions, submissionId);
    if (sub) {
      sub.status = 'draft';
      delete sub.submittedAt;
    }
  });
}

export function deleteDraft(submissionId) {
  update((s) => {
    s.submissions = s.submissions.filter((x) => !(x.id === submissionId && x.status === 'draft'));
  });
}

export function createParticipant() {
  update((s) => {
    const n = String(1000 + Math.floor(Math.random() * 8999));
    const p = { id: `p-${n}`, pseudo: `ESP-${n}`, name: 'New demo solver', email: `solver.${n}@example.com` };
    s.participants.push(p);
    s.currentParticipantId = p.id;
  });
}

// ---------- companies ----------
export function addChallenge(data) {
  const id = uid('ch');
  update((s) => {
    s.challenges.push({ id, createdAt: nowIso(), ...data });
    log('host', 'published challenge', `${company(data.companyId).name}: ${data.title}`);
  });
  return id;
}

export function requestCoWriting(companyId, note) {
  update((s) => {
    s.coWriteRequests.push({ id: uid('cw'), companyId, note, at: nowIso(), status: 'queued' });
  });
}

// ---------- post-event mutual opt-in ----------
export function setFeedback(meetingId, side, choice) {
  update((s) => {
    const f = s.feedback[meetingId] || (s.feedback[meetingId] = { participant: null, host: null });
    f[side] = choice;
  });
}

export function feedbackOutcome(meetingId) {
  const f = state.feedback[meetingId];
  if (!f || !f.participant || !f.host) return 'waiting';
  return f.participant === 'continue' && f.host === 'continue' ? 'mutual' : 'closed';
}

// ---------- aggregates (anonymous, no individual profiling) ----------
const THEMES = [
  { id: 'data', label: 'Data and measurement', words: ['data', 'metric', 'measure', 'log', 'kpi', 'forecast', 'how many', 'how much', 'mitta', 'mätdata', 'hur många'] },
  { id: 'people', label: 'Users, customers and residents', words: ['user', 'customer', 'resident', 'passenger', 'pedestrian', 'asiakas', 'käyttäjä', 'asukas', 'kund', 'användare', 'invånare'] },
  { id: 'ownership', label: 'Ownership and decision-making', words: ['who ', 'owns', 'owner', 'decide', 'approv', 'legal', 'kuka', 'päättää', 'vem', 'äger'] },
  { id: 'risk', label: 'Constraints, cost and safety', words: ['cost', 'budget', 'warranty', 'safety', 'risk', 'penalis', 'contract', 'worse', 'kustann', 'riski', 'säkerhet'] },
  { id: 'access', label: 'Getting hands-on access', words: ['can i', 'visit', 'ride', 'read', 'remote access', 'on site', 'voinko', 'paikan päällä'] },
  { id: 'success', label: 'Goals and what success means', words: ['success', 'goal', 'matters more', 'consider', 'onnistu', 'tavoite', 'mål', 'actually used'] },
];

function questionText(sub) {
  return ((sub.translations && sub.translations.en && sub.translations.en.questions) || sub.answers.questions || '').toLowerCase();
}

export function themeCounts(subs) {
  const counts = Object.fromEntries(THEMES.map((t) => [t.id, 0]));
  let questions = 0;
  subs.forEach((sub) => {
    const text = questionText(sub);
    questions += (text.match(/\?/g) || []).length;
    THEMES.forEach((t) => {
      if (t.words.some((w) => text.includes(w))) counts[t.id] += 1;
    });
  });
  return { counts, questions };
}

export const THEME_LABELS = Object.fromEntries(THEMES.map((t) => [t.id, t.label]));

function emptyPersonAggregates() {
  return {
    responsesPerChallenge: {},
    skillSupply: {},
    languages: {},
    intents: {},
    meetingFormats: {},
    confirmedFormats: {},
    meetings: { requested: 0, invited: 0, confirmed: 0, declined: 0 },
    optIn: { mutual: 0, answered: 0, held: 0 },
    byCompany: {},
  };
}

function computePersonAggregates(s) {
  const a = emptyPersonAggregates();
  const submitted = s.submissions.filter((x) => x.status === 'submitted');
  submitted.forEach((sub) => {
    a.responsesPerChallenge[sub.challengeId] = (a.responsesPerChallenge[sub.challengeId] || 0) + 1;
    (sub.skills || []).forEach((k) => (a.skillSupply[k] = (a.skillSupply[k] || 0) + 1));
    const lang = sub.lang === 'other' ? 'other' : sub.lang;
    a.languages[lang] = (a.languages[lang] || 0) + 1;
    const it = sub.intent || 'open';
    a.intents[it] = (a.intents[it] || 0) + 1;
  });
  s.meetings.forEach((m) => {
    if (m.initiator === 'participant') a.meetings.requested += 1;
    else a.meetings.invited += 1;
    if (isConfirmed(m)) a.meetings.confirmed += 1;
    if (m.partyStatus === 'declined' || m.organizerStatus === 'declined') a.meetings.declined += 1;
    const f = m.format || 'open';
    a.meetingFormats[f] = (a.meetingFormats[f] || 0) + 1;
    if (isConfirmed(m)) a.confirmedFormats[f] = (a.confirmedFormats[f] || 0) + 1;
  });
  s.meetings.filter(isConfirmed).forEach((m) => {
    a.optIn.held += 1;
    const f = s.feedback[m.id];
    if (f && f.participant && f.host) {
      a.optIn.answered += 1;
      if (f.participant === 'continue' && f.host === 'continue') a.optIn.mutual += 1;
    }
  });
  s.companies.forEach((c) => {
    const chIds = s.challenges.filter((ch) => ch.companyId === c.id).map((ch) => ch.id);
    const subs = submitted.filter((x) => chIds.includes(x.challengeId));
    const ms = s.meetings.filter((m) => m.companyId === c.id);
    const bookmarks = Object.values(s.bookmarks).flat().filter((id) => chIds.includes(id)).length;
    const conf = ms.filter(isConfirmed);
    const t = themeCounts(subs);
    a.byCompany[c.id] = {
      responses: subs.length,
      bookmarks,
      requests: ms.filter((m) => m.initiator === 'participant').length,
      invites: ms.filter((m) => m.initiator === 'host').length,
      mutual: ms.filter(canRevealIdentity).length,
      confirmed: conf.length,
      continued: conf.filter((m) => feedbackOutcome(m.id) === 'mutual').length,
      themes: t.counts,
      questions: t.questions,
      languages: subs.reduce((acc, x) => ((acc[x.lang] = (acc[x.lang] || 0) + 1), acc), {}),
      intents: subs.reduce((acc, x) => ((acc[x.intent || 'open'] = (acc[x.intent || 'open'] || 0) + 1), acc), {}),
      confirmedFormats: conf.reduce((acc, m) => ((acc[m.format || 'open'] = (acc[m.format || 'open'] || 0) + 1), acc), {}),
    };
  });
  return a;
}

function addInto(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === 'number') target[k] = (target[k] || 0) + v;
    else if (v && typeof v === 'object') addInto(target[k] || (target[k] = {}), v);
  }
  return target;
}

/** Live aggregates plus anything archived by a previous purge. Never contains individuals. */
export function aggregates() {
  const live = computePersonAggregates(state);
  const archived = state.purge.aggregates;
  const person = archived ? addInto(JSON.parse(JSON.stringify(archived)), live) : live;
  const skillDemand = {};
  const formatDemand = {};
  state.challenges.forEach((ch) => {
    ch.escoTags.forEach((k) => (skillDemand[k] = (skillDemand[k] || 0) + 1));
    (ch.formats || ['open']).forEach((f) => (formatDemand[f] = (formatDemand[f] || 0) + 1));
  });
  return { ...person, skillDemand, formatDemand };
}

// ---------- 30-day purge ----------
export function personalDataInventory(s = state) {
  return {
    participants: s.participants.length,
    submissions: s.submissions.filter((x) => x.status === 'submitted').length,
    drafts: s.submissions.filter((x) => x.status === 'draft').length,
    bookmarks: Object.values(s.bookmarks).flat().length,
    meetings: s.meetings.length,
    feedback: Object.keys(s.feedback).length,
    consents: Object.keys(s.consents).length,
    hostContacts: s.companies.filter((c) => c.hostEmail).length,
    decisionLog: s.decisionLog.length,
  };
}

export function purgePersonalData() {
  update((s) => {
    const before = personalDataInventory(s);
    const snapshot = computePersonAggregates(s);
    s.purge.aggregates = s.purge.aggregates ? addInto(s.purge.aggregates, snapshot) : snapshot;
    s.participants = [];
    s.submissions = [];
    s.bookmarks = {};
    s.meetings = [];
    s.feedback = {};
    s.consents = {};
    s.coWriteRequests = [];
    s.decisionLog = [];
    s.companies.forEach((c) => {
      c.hostName = null;
      c.hostRole = null;
      c.hostEmail = null;
    });
    s.currentParticipantId = null;
    s.purge.done = true;
    s.purge.at = nowIso();
    s.purge.ledger = { before, after: personalDataInventory(s) };
  });
}

/** Consent withdrawal: erase one participant's data now, keeping anonymous counts. */
export function deleteParticipantData(participantId) {
  update((s) => {
    const sub = { ...s, participants: s.participants.filter((p) => p.id === participantId) };
    sub.submissions = s.submissions.filter((x) => x.participantId === participantId);
    sub.meetings = s.meetings.filter((m) => m.participantId === participantId);
    sub.bookmarks = { [participantId]: s.bookmarks[participantId] || [] };
    const snapshot = computePersonAggregates(sub);
    s.purge.aggregates = s.purge.aggregates ? addInto(s.purge.aggregates, snapshot) : snapshot;
    const meetingIds = new Set(sub.meetings.map((m) => m.id));
    s.participants = s.participants.filter((p) => p.id !== participantId);
    s.submissions = s.submissions.filter((x) => x.participantId !== participantId);
    s.meetings = s.meetings.filter((m) => !meetingIds.has(m.id));
    meetingIds.forEach((id) => delete s.feedback[id]);
    delete s.bookmarks[participantId];
    delete s.consents[participantId];
    if (s.currentParticipantId === participantId) s.currentParticipantId = null;
  });
}

// ---------- compliance audit ----------
export function auditState() {
  const hits = [];
  const walk = (node, path) => {
    if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (FORBIDDEN_KEYS.includes(k)) hits.push(`${path}.${k}`);
        walk(v, `${path}.${k}`);
      }
    }
  };
  walk(state, 'state');
  return hits;
}
