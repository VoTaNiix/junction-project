// Interface language for the whole site: English, Finnish (Suomi) and Swedish (Svenska).
//
// Every piece of interface text is written in place as tr({ en, fi, sv }), so each translation
// sits next to the English it translates. Text that people wrote themselves (challenges, answers,
// names) is never translated here: it stays in the language its author chose, and the
// side-by-side translation feature handles it where needed.
//
// The choice is a per-viewer preference, kept in localStorage under its own key, so it survives
// Reset demo data and is not part of the shared demo state.

const KEY = 'skillink.lang';

export const UI_LANGS = [
  { id: 'en', label: 'English', locale: 'en-GB' },
  { id: 'fi', label: 'Suomi', locale: 'fi-FI' },
  { id: 'sv', label: 'Svenska', locale: 'sv-FI' },
];

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (UI_LANGS.some((l) => l.id === saved)) return saved;
  } catch {
    /* storage may be blocked; fall back to English */
  }
  return 'en';
}

let lang = initial();

export const getLang = () => lang;

/** BCP 47 locale for dates and times in the current language. */
export const locale = () => UI_LANGS.find((l) => l.id === lang).locale;

export function setLang(id) {
  if (!UI_LANGS.some((l) => l.id === id)) return;
  lang = id;
  document.documentElement.lang = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* preference is optional */
  }
}

/**
 * Picks the current language from { en, fi, sv } and fills {placeholders} from vars.
 * The result is plain text: escape it with esc() when it goes into HTML, as with any other text.
 */
export function tr(texts, vars) {
  let s = texts[lang] ?? texts.en;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}

/** Plural helper: tr(n === 1 ? one : other) with {n} filled in. */
export function trn(n, one, other, vars = {}) {
  return tr(n === 1 ? one : other, { n, ...vars });
}
