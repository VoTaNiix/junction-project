import { esc, fmtDate, daysUntil, richText, langName, LANGS, fmtTime } from '../ui.js';
import { skill } from '../esco.js';
import { company, meetingStatus, REQUEST_CAP, slot } from '../store.js';
import { format as fmtOf, intent as intentOf, conversationFormats } from '../formats.js';

export const ICON = {
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity=".14"/><path d="m7.5 12.5 3 3 6-7"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity=".14"/><path d="m8.5 8.5 7 7M15.5 8.5l-7 7"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  heartFilled: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  arrowUpRight: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  swap: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>',
};

// One icon per collaboration format, so format badges never rely on colour alone.
const FORMAT_ICON = {
  hiring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  rnd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3M7.5 15h9"/></svg>',
  pilot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="3" y="3" width="11" height="11" rx="2"/><rect x="10" y="10" width="11" height="11" rx="2"/></svg>',
  open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M3 21h18M6 21V3h9v18M15 5l4 1.5V21"/><path d="M12 12h.01" stroke-width="3"/></svg>',
};

export function formatBadge(id, { label } = {}) {
  const f = fmtOf(id);
  return `<span class="fbadge fbadge--${esc(f.id)}">${FORMAT_ICON[f.id] || ''}<span>${esc(label || f.label)}</span></span>`;
}

/** Colour-coded collaboration format badges, with icon and text. */
export function formatBadges(ids = [], { label = 'Collaboration formats' } = {}) {
  return `<ul class="formats" aria-label="${esc(label)}">${ids.map((id) => `<li>${formatBadge(id)}</li>`).join('')}</ul>`;
}

/** The solver's self-declared intent, styled with the matching format colour. */
export function intentBadge(id) {
  const it = intentOf(id);
  return `<span class="fbadge fbadge--${esc(it.format)} fbadge--intent">${FORMAT_ICON[it.format] || ''}<span><span class="sr-only">Approaching this as: </span>${esc(it.label)}</span></span>`;
}

/** Radio chips for what a requested or invited conversation is about. */
export function formatChoice(ch, selected, name = 'mformat') {
  return `<fieldset style="margin-bottom:var(--s4)"><legend>What would this conversation be about?</legend>
    <div class="fchips" style="margin-top:var(--s2)">${conversationFormats(ch)
      .map((id) => `<label class="fchip fchip--${id}"><input type="radio" name="${name}" value="${id}" ${id === selected ? 'checked' : ''}><span>${esc(fmtOf(id).label)}</span></label>`)
      .join('')}</div>
  </fieldset>`;
}

export const PARTS = [
  { key: 'first', n: 1, label: 'What would you do first to tackle this challenge?' },
  { key: 'why', n: 2, label: 'Why would you take that approach, and what practical perspective do you bring?' },
  { key: 'questions', n: 3, label: 'What critical questions would you ask the host team in your live conversation?' },
];

export function langBadge(text) {
  return `<span class="lang-badge" title="Real language requirement">${ICON.globe}<span><span class="sr-only">Language requirement: </span>${esc(text)}</span></span>`;
}

export function escoTags(ids, max = 99) {
  const shown = ids.slice(0, max);
  const more = ids.length - shown.length;
  return `<ul class="tags" aria-label="ESCO skills">${shown.map((id) => `<li class="tag tag--esco">${esc(skill(id).label)}</li>`).join('')}${
    more > 0 ? `<li class="tag">+${more} more</li>` : ''
  }</ul>`;
}

export function statusPill(m) {
  const st = meetingStatus(m);
  return `<span class="pill pill--${st.tone}">${esc(st.label)}</span>`;
}

export function deadlineText(iso) {
  const d = daysUntil(iso);
  const when = d < 0 ? 'closed' : d === 0 ? 'closes today' : d === 1 ? '1 day left' : `${d} days left`;
  return `<span class="deadline">Share by <strong>${esc(fmtDate(iso))}</strong> <span class="muted">(${when})</span></span>`;
}

export function challengeCard(ch, { actions = '', compact = false } = {}) {
  const c = company(ch.companyId);
  // Decorative band tinted by the first format; the badges below carry the meaning in text.
  const lead = fmtOf((ch.formats || ['open'])[0]).id;
  return `<article class="ccard" aria-labelledby="t-${esc(ch.id)}">
    <div class="ccard__art ccard__art--${esc(lead)}" aria-hidden="true">${FORMAT_ICON[lead] || ''}</div>
    <div class="ccard__body">
    ${formatBadges(ch.formats || ['open'], { label: `Collaboration formats ${c ? c.name : ''} is open to` })}
    <div class="ccard__meta">
      <span class="ccard__company">${esc(c ? c.name : 'Host')}</span>
      <span>${esc(ch.industry)}</span>
      ${langBadge(ch.language)}
      ${ch.coWritten ? '<span class="pill pill--info pill--plain">Co-written with Business Espoo</span>' : ''}
    </div>
    <h3 id="t-${esc(ch.id)}">${esc(ch.title)}</h3>
    ${ch.summary ? `<p class="ccard__summary">${esc(ch.summary)}</p>` : ''}
    ${compact ? '' : `<p class="ccard__context">${esc(ch.context)}</p>
    <p class="ccard__tricky"><strong>What makes this tricky?</strong> ${esc(ch.tricky)}</p>`}
    ${escoTags(ch.escoTags, compact ? 3 : 99)}
    <div class="ccard__foot">${deadlineText(ch.deadline)}<div class="row">${actions}</div></div>
    </div>
  </article>`;
}

/**
 * Short preview card for the problem board and saved challenges: format band, save button,
 * format badges, title, one-line summary, two skills and the host. The whole card opens the
 * challenge page (#/participant/challenge/:id), where the full details and actions live.
 */
export function challengePreview(ch, { saved = false, status = '' } = {}) {
  const c = company(ch.companyId);
  const lead = fmtOf((ch.formats || ['open'])[0]).id;
  const name = c ? c.name : 'Host';
  return `<article class="pcard" aria-labelledby="t-${esc(ch.id)}">
    <div class="ccard__art ccard__art--${esc(lead)}" aria-hidden="true">${FORMAT_ICON[lead] || ''}</div>
    <button type="button" class="pcard__save" data-bookmark="${esc(ch.id)}" id="bm-${esc(ch.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Saved' : 'Save'}: ${esc(ch.title)}" title="${saved ? 'Saved to your workspace' : 'Save for later'}">${saved ? ICON.heartFilled : ICON.heart}</button>
    <div class="pcard__body">
      ${formatBadges(ch.formats || ['open'], { label: `Collaboration formats ${name} is open to` })}
      <h3 id="t-${esc(ch.id)}"><a class="pcard__link" href="#/participant/challenge/${esc(ch.id)}">${esc(ch.title)}</a></h3>
      ${ch.summary ? `<p class="pcard__summary">${esc(ch.summary)}</p>` : ''}
      ${escoTags(ch.escoTags, 2)}
      <div class="pcard__foot">
        <span class="pcard__host"><span class="pcard__initial" aria-hidden="true">${esc(name.charAt(0))}</span><span><strong>${esc(name)}</strong><small>${esc(ch.industry)} · share by ${esc(fmtDate(ch.deadline))}</small></span></span>
        ${status ? `<span class="pill pill--ok">${esc(status)}</span>` : `<span class="pcard__explore" aria-hidden="true">Explore ${ICON.arrowUpRight}</span>`}
      </div>
    </div>
  </article>`;
}

/** The purpose-bound consent notice solvers agree to before sharing. */
export function consentNotice(state) {
  const deleteOn = new Date(`${state.event.date}T12:00:00`);
  deleteOn.setDate(deleteOn.getDate() + state.event.retentionDays);
  return `
    <p><strong>Purpose.</strong> To arrange conversations between you and challenge hosts at ${esc(state.event.name)}, whether about a role, a research collaboration or a pilot. Not for other events, marketing, or training any AI model.</p>
    <p><strong>Who is responsible.</strong> The City of Espoo, as the event organizer with Business Espoo, is the data controller.</p>
    <p><strong>What we keep.</strong> A solver ID, your name and email, the answers you share and how you are approaching each challenge, the challenges you save, and your conversation requests.</p>
    <p><strong>What we never ask for.</strong> Nationality, ethnic background, age, gender, photos, CVs, pitch decks, logos, company size or funding stage.</p>
    <p><strong>Who sees what.</strong> Hosts see your answers under your solver ID. Your name, email and any team or company you belong to are shared with a host only after you both agree to meet.</p>
    <p><strong>How long.</strong> Everything personal is deleted ${esc(String(state.event.retentionDays))} days after the event, on ${esc(fmtDate(deleteOn.toISOString().slice(0, 10), { year: true }))}. Only anonymous counts remain.</p>
    <p><strong>Your rights.</strong> You can see, correct or delete your data at any time. Withdraw consent in My workspace and your data is deleted straight away.</p>`;
}

export function quotaBar(used) {
  const full = used >= REQUEST_CAP;
  return `<div class="quota${full ? ' quota--full' : ''}" role="group" aria-label="Meeting request quota">
    <div class="quota__label"><span>${used} / ${REQUEST_CAP} meeting requests used</span><span class="muted">${full ? 'Limit reached' : `${REQUEST_CAP - used} left`}</span></div>
    <div class="quota__bar" aria-hidden="true">${Array.from({ length: REQUEST_CAP }, (_, i) => `<span class="${i < used ? 'is-used' : ''}"></span>`).join('')}</div>
  </div>`;
}

export function slotLabel(slotId) {
  const s = slot(slotId);
  if (!s) return '';
  return `${fmtDate(s.start, { weekday: true })}, ${fmtTime(s.start)}–${fmtTime(s.end)}`;
}

// ---------- EU-hosted machine translation (simulated) ----------
// Translation is opt-in per submission and ALWAYS shown next to the original, never instead of it.
const translateOn = new Map(); // submissionId -> target language code

export function translationTargets(sub) {
  return Object.keys(sub.translations || {}).filter((k) => k !== sub.lang);
}

export function mtToggle(sub) {
  const target = translateOn.get(sub.id);
  const targets = translationTargets(sub);
  const on = !!target;
  const select =
    on && targets.length > 1
      ? `<label class="small row" style="gap:6px">Into <select data-mt-target="${esc(sub.id)}" style="min-height:32px;padding:2px 8px;width:auto">${targets
          .map((t) => `<option value="${t}" ${t === target ? 'selected' : ''}>${LANGS[t].label}</option>`)
          .join('')}</select></label>`
      : '';
  return `<div class="row" style="gap:var(--s3)">
    <button type="button" class="toggle" id="mt-${esc(sub.id)}" data-mt="${esc(sub.id)}" data-default="${esc(defaultTarget(sub))}" aria-pressed="${on}">
      <span class="toggle__track" aria-hidden="true"></span>
      EU-Hosted Machine Translation (Simulated)
    </button>${select}</div>`;
}

export function bindTranslation(root, rerender) {
  root.querySelectorAll('[data-mt]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.mt;
      if (translateOn.has(id)) translateOn.delete(id);
      else translateOn.set(id, btn.dataset.default || 'en');
      rerender();
    }),
  );
  root.querySelectorAll('[data-mt-target]').forEach((sel) =>
    sel.addEventListener('change', () => {
      translateOn.set(sel.dataset.mtTarget, sel.value);
      rerender();
    }),
  );
}

export function defaultTarget(sub) {
  const t = translationTargets(sub);
  if (t.includes('en')) return 'en';
  return t[0] || (sub.lang === 'en' ? 'fi' : 'en');
}

export function renderTranslation(sub, partKey) {
  const original = richText(sub.answers[partKey], sub.format);
  const target = translateOn.get(sub.id);
  if (!target) return original;
  const tr = sub.translations && sub.translations[target];
  const translated = tr
    ? richText(tr[partKey], sub.format)
    : `<p class="muted small">No translation is stored for this answer in the offline demo. In a live deployment the EU-hosted translation service would return the ${esc(
        LANGS[target]?.label || 'translated',
      )} text here, still shown next to the original.</p>`;
  return `<div class="sbs">
    <div class="sbs__col" lang="${esc(sub.lang === 'other' ? '' : sub.lang)}"><div class="sbs__label">Original, ${esc(langName(sub))}</div>${original}</div>
    <div class="sbs__col sbs__col--mt" lang="${esc(target)}"><div class="sbs__label"><span class="mt-badge">[EU-Hosted Machine Translation — Original Always Shown]</span> ${esc(
      LANGS[target]?.label || '',
    )}</div>${translated}</div>
  </div>`;
}

export function submissionBody(sub) {
  return PARTS.map(
    (p) => `<div class="sub__part${p.key === 'questions' ? ' sub__part--core' : ''}">
      <h4>${p.n}. ${esc(p.label)}</h4>
      ${renderTranslation(sub, p.key)}
    </div>`,
  ).join('');
}

export function verifiedBadge(text = 'Confirmed by a person') {
  return `<span class="verified">${ICON.check}${esc(text)}</span>`;
}
