import { esc, fmtDate, daysUntil, richText, langName, LANGS, fmtTime } from '../ui.js';
import { skill } from '../esco.js';
import { company, meetingStatus, REQUEST_CAP, slot } from '../store.js';

export const ICON = {
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity=".14"/><path d="m7.5 12.5 3 3 6-7"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity=".14"/><path d="m8.5 8.5 7 7M15.5 8.5l-7 7"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
};

export const PARTS = [
  { key: 'first', n: 1, label: 'What would you do first?' },
  { key: 'why', n: 2, label: 'Why would you take that approach?' },
  { key: 'questions', n: 3, label: 'What would you ask the company in your conversation?' },
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
  return `<article class="ccard" aria-labelledby="t-${esc(ch.id)}">
    <div class="ccard__meta">
      <span class="ccard__company">${esc(c ? c.name : 'Company')}</span>
      <span>${esc(ch.industry)}</span>
      ${langBadge(ch.language)}
      ${ch.coWritten ? '<span class="pill pill--info pill--plain" title="Co-written with City of Espoo Business Services">Co-written with Espoo Business Services</span>' : ''}
    </div>
    <h3 id="t-${esc(ch.id)}">${esc(ch.title)}</h3>
    ${compact ? '' : `<p class="ccard__context">${esc(ch.context)}</p>
    <p class="ccard__tricky"><strong>What makes this tricky:</strong> ${esc(ch.tricky)}</p>`}
    ${escoTags(ch.escoTags, compact ? 3 : 99)}
    <div class="ccard__foot">${deadlineText(ch.deadline)}<div class="row">${actions}</div></div>
  </article>`;
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
    <div class="sbs__col sbs__col--mt" lang="${esc(target)}"><div class="sbs__label"><span class="mt-badge">[EU-Hosted Machine Translation]</span> ${esc(
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
