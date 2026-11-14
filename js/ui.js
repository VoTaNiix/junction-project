// Small DOM helpers. No framework: views return HTML strings and bind events afterwards.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const FMT_LOCALE = 'en-GB';
const TZ = 'Europe/Helsinki';

export function fmtDate(iso, opts = {}) {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00+02:00`) : new Date(iso);
  return d.toLocaleDateString(FMT_LOCALE, { day: 'numeric', month: 'short', year: opts.year ? 'numeric' : undefined, weekday: opts.weekday ? 'short' : undefined, timeZone: TZ });
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString(FMT_LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: TZ });
}

export function fmtDateTime(iso) {
  return `${fmtDate(iso)}, ${fmtTime(iso)}`;
}

export function daysUntil(isoDate) {
  const target = new Date(`${isoDate}T23:59:00+02:00`).getTime();
  return Math.ceil((target - Date.now()) / 86400000);
}

export function addDays(isoDate, n) {
  const d = new Date(`${isoDate}T12:00:00+02:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const LANGS = {
  en: { label: 'English', native: 'English' },
  fi: { label: 'Finnish', native: 'Suomi' },
  sv: { label: 'Swedish', native: 'Svenska' },
  other: { label: 'Other language', native: 'Other' },
};

export function langName(sub) {
  if (sub.lang === 'other') return sub.langOther || 'Other language';
  return (LANGS[sub.lang] || LANGS.other).label;
}

// ---------- toasts ----------
export function toast(message, tone = 'ok') {
  const region = document.getElementById('toasts');
  if (!region) return;
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.textContent = message;
  region.appendChild(el);
  setTimeout(() => el.classList.add('is-leaving'), 3800);
  setTimeout(() => el.remove(), 4300);
}

// ---------- dialogs ----------
export function openDialog({ title, body, onBind, wide = false }) {
  const dlg = document.createElement('dialog');
  dlg.className = `dialog${wide ? ' dialog--wide' : ''}`;
  dlg.setAttribute('aria-labelledby', 'dlg-title');
  dlg.innerHTML = `
    <div class="dialog__head">
      <h2 id="dlg-title">${esc(title)}</h2>
      <button type="button" class="btn btn--ghost btn--icon" data-close aria-label="Close dialog">✕</button>
    </div>
    <div class="dialog__body">${body}</div>`;
  document.body.appendChild(dlg);
  const close = () => {
    dlg.close();
    dlg.remove();
  };
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) close();
  });
  dlg.addEventListener('close', () => dlg.remove());
  dlg.showModal();
  if (onBind) onBind(dlg, close);
  return { dlg, close };
}

export function confirmDialog({ title, message, confirmLabel, danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    openDialog({
      title,
      body: `<p>${message}</p>
        <div class="row row--end">
          <button type="button" class="btn btn--ghost" data-close>Keep as is</button>
          <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-yes>${esc(confirmLabel)}</button>
        </div>`,
      onBind: (dlg, close) => {
        dlg.querySelector('[data-yes]').addEventListener('click', () => {
          answered = true;
          close();
          resolve(true);
        });
        dlg.addEventListener('close', () => !answered && resolve(false));
      },
    });
  });
}

// ---------- tabs (WAI-ARIA tabs pattern, links-based) ----------
export function tabNav(role, tabs, active) {
  return `<nav class="subnav" aria-label="Sections">
    <ul>${tabs
      .map(
        (t) => `<li><a href="#/${role}/${t.id}" class="subnav__link" ${t.id === active ? 'aria-current="page"' : ''}>${esc(t.label)}${
          t.count ? ` <span class="count" aria-label="${t.count} waiting">${t.count}</span>` : ''
        }</a></li>`,
      )
      .join('')}</ul>
  </nav>`;
}

/** Render bullet-formatted text ("- a\n- b") as a list, prose as paragraphs. */
export function richText(text, format) {
  const t = String(text || '').trim();
  if (!t) return '<p class="muted">No answer written.</p>';
  const lines = t.split(/\n+/);
  if (format === 'bullets' || lines.every((l) => /^\s*[-•*]\s+/.test(l))) {
    return `<ul class="bullets">${lines.map((l) => `<li>${esc(l.replace(/^\s*[-•*]\s+/, ''))}</li>`).join('')}</ul>`;
  }
  return lines.map((l) => `<p>${esc(l)}</p>`).join('');
}
