import { esc, fmtDate, daysUntil, richText, langName, LANGS, fmtTime } from '../ui.js';
import { skill } from '../esco.js';
import { company, meetingStatus, REQUEST_CAP, slot } from '../store.js';
import { format as fmtOf, intent as intentOf, conversationFormats, sectorLabel, languageRequirementLabel } from '../formats.js';
import { tr } from '../i18n.js';

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

/** "Solver #ESP-4821" style labels stay as they are: they are IDs, not words. */
const formatsOpenTo = (name) => tr({ en: 'Collaboration formats {name} is open to', fi: 'Yhteistyömuodot, joihin {name} on avoin', sv: 'Samarbetsformer som {name} är öppen för' }, { name });

export function formatBadge(id, { label } = {}) {
  const f = fmtOf(id);
  return `<span class="fbadge fbadge--${esc(f.id)}">${FORMAT_ICON[f.id] || ''}<span>${esc(label || f.label)}</span></span>`;
}

/** Colour-coded collaboration format badges, with icon and text. */
export function formatBadges(ids = [], { label } = {}) {
  const aria = label || tr({ en: 'Collaboration formats', fi: 'Yhteistyömuodot', sv: 'Samarbetsformer' });
  return `<ul class="formats" aria-label="${esc(aria)}">${ids.map((id) => `<li>${formatBadge(id)}</li>`).join('')}</ul>`;
}

/** The solver's self-declared intent, styled with the matching format colour. */
export function intentBadge(id) {
  const it = intentOf(id);
  const sr = tr({ en: 'Approaching this as:', fi: 'Lähestyy tätä näin:', sv: 'Tar sig an detta som:' });
  return `<span class="fbadge fbadge--${esc(it.format)} fbadge--intent">${FORMAT_ICON[it.format] || ''}<span><span class="sr-only">${esc(sr)} </span>${esc(it.label)}</span></span>`;
}

/** Radio chips for what a requested or invited conversation is about. */
export function formatChoice(ch, selected, name = 'mformat') {
  const legend = tr({ en: 'What would this conversation be about?', fi: 'Mistä keskustelu käytäisiin?', sv: 'Vad skulle samtalet handla om?' });
  return `<fieldset style="margin-bottom:var(--s4)"><legend>${esc(legend)}</legend>
    <div class="fchips" style="margin-top:var(--s2)">${conversationFormats(ch)
      .map((id) => `<label class="fchip fchip--${id}"><input type="radio" name="${name}" value="${id}" ${id === selected ? 'checked' : ''}><span>${esc(fmtOf(id).label)}</span></label>`)
      .join('')}</div>
  </fieldset>`;
}

/** The three questions every solver answers. Labels follow the interface language. */
export const PARTS = [
  {
    key: 'first',
    n: 1,
    get label() {
      return tr({ en: 'What would you do first to tackle this challenge?', fi: 'Mitä tekisit ensimmäiseksi ratkaistaksesi tämän haasteen?', sv: 'Vad skulle du göra först för att ta dig an den här utmaningen?' });
    },
  },
  {
    key: 'why',
    n: 2,
    get label() {
      return tr({ en: 'Why would you take that approach, and what practical perspective do you bring?', fi: 'Miksi valitsisit tämän lähestymistavan, ja millaista käytännön näkökulmaa tuot mukanasi?', sv: 'Varför skulle du välja det sättet, och vilket praktiskt perspektiv bidrar du med?' });
    },
  },
  {
    key: 'questions',
    n: 3,
    get label() {
      return tr({ en: 'What critical questions would you ask the host team in your live conversation?', fi: 'Mitä kriittisiä kysymyksiä esittäisit yrityksen tiimille keskustelussa?', sv: 'Vilka kritiska frågor skulle du ställa till värdens team i samtalet?' });
    },
  },
];

export function langBadge(text) {
  const title = tr({ en: 'Real language requirement', fi: 'Todellinen kielivaatimus', sv: 'Verkligt språkkrav' });
  const sr = tr({ en: 'Language requirement:', fi: 'Kielivaatimus:', sv: 'Språkkrav:' });
  return `<span class="lang-badge" title="${esc(title)}">${ICON.globe}<span><span class="sr-only">${esc(sr)} </span>${esc(languageRequirementLabel(text))}</span></span>`;
}

export function escoTags(ids, max = 99) {
  const shown = ids.slice(0, max);
  const more = ids.length - shown.length;
  const aria = tr({ en: 'ESCO skills', fi: 'ESCO-taidot', sv: 'ESCO-färdigheter' });
  const moreText = tr({ en: '+{n} more', fi: '+{n} lisää', sv: '+{n} till' }, { n: more });
  return `<ul class="tags" aria-label="${esc(aria)}">${shown.map((id) => `<li class="tag tag--esco">${esc(skill(id).label)}</li>`).join('')}${
    more > 0 ? `<li class="tag">${esc(moreText)}</li>` : ''
  }</ul>`;
}

export function statusPill(m) {
  const st = meetingStatus(m);
  return `<span class="pill pill--${st.tone}">${esc(st.label)}</span>`;
}

export function deadlineText(iso) {
  const d = daysUntil(iso);
  const when =
    d < 0
      ? tr({ en: 'closed', fi: 'päättynyt', sv: 'stängd' })
      : d === 0
        ? tr({ en: 'closes today', fi: 'päättyy tänään', sv: 'stänger i dag' })
        : d === 1
          ? tr({ en: '1 day left', fi: '1 päivä jäljellä', sv: '1 dag kvar' })
          : tr({ en: '{n} days left', fi: '{n} päivää jäljellä', sv: '{n} dagar kvar' }, { n: d });
  const shareBy = tr({ en: 'Share by', fi: 'Jaa viimeistään', sv: 'Dela senast' });
  return `<span class="deadline">${esc(shareBy)} <strong>${esc(fmtDate(iso))}</strong> <span class="muted">(${esc(when)})</span></span>`;
}

export function challengeCard(ch, { actions = '', compact = false } = {}) {
  const c = company(ch.companyId);
  const name = c ? c.name : tr({ en: 'Host', fi: 'Yritys', sv: 'Värd' });
  const cowritten = tr({ en: 'Co-written with Business Espoo', fi: 'Kirjoitettu yhdessä Business Espoon kanssa', sv: 'Skriven tillsammans med Business Espoo' });
  const tricky = tr({ en: 'What makes this tricky?', fi: 'Mikä tästä tekee hankalaa?', sv: 'Vad gör det här knepigt?' });
  return `<article class="ccard" aria-labelledby="t-${esc(ch.id)}">
    ${formatBadges(ch.formats || ['open'], { label: formatsOpenTo(name) })}
    <div class="ccard__meta">
      <span class="ccard__company">${esc(name)}</span>
      <span>${esc(sectorLabel(ch.industry))}</span>
      ${langBadge(ch.language)}
      ${ch.coWritten ? `<span class="pill pill--info pill--plain">${esc(cowritten)}</span>` : ''}
    </div>
    <h3 id="t-${esc(ch.id)}">${esc(ch.title)}</h3>
    ${ch.summary ? `<p class="ccard__summary">${esc(ch.summary)}</p>` : ''}
    ${compact ? '' : `<p class="ccard__context">${esc(ch.context)}</p>
    <p class="ccard__tricky"><strong>${esc(tricky)}</strong> ${esc(ch.tricky)}</p>`}
    ${escoTags(ch.escoTags, compact ? 3 : 99)}
    <div class="ccard__foot">${deadlineText(ch.deadline)}<div class="row">${actions}</div></div>
  </article>`;
}

/**
 * Short preview card for the problem board and saved challenges: format badges and a save
 * button, title, one-line summary, two skills and the host. The top edge takes the colour of the
 * first format. The whole card opens the challenge page (#/participant/challenge/:id), where
 * the full details and actions live.
 */
export function challengePreview(ch, { saved = false, status = '' } = {}) {
  const c = company(ch.companyId);
  const lead = fmtOf((ch.formats || ['open'])[0]).id;
  const name = c ? c.name : tr({ en: 'Host', fi: 'Yritys', sv: 'Värd' });
  const saveLabel = saved ? tr({ en: 'Saved', fi: 'Tallennettu', sv: 'Sparad' }) : tr({ en: 'Save', fi: 'Tallenna', sv: 'Spara' });
  const saveTitle = saved
    ? tr({ en: 'Saved to your workspace', fi: 'Tallennettu työtilaasi', sv: 'Sparad på din arbetsyta' })
    : tr({ en: 'Save for later', fi: 'Tallenna myöhemmäksi', sv: 'Spara till senare' });
  const shareBy = tr({ en: 'share by {date}', fi: 'jaa viimeistään {date}', sv: 'dela senast {date}' }, { date: fmtDate(ch.deadline) });
  const explore = tr({ en: 'Explore', fi: 'Tutustu', sv: 'Utforska' });
  return `<article class="pcard pcard--${esc(lead)}" aria-labelledby="t-${esc(ch.id)}">
    <div class="pcard__top">
      ${formatBadges(ch.formats || ['open'], { label: formatsOpenTo(name) })}
      <button type="button" class="pcard__save" data-bookmark="${esc(ch.id)}" id="bm-${esc(ch.id)}" aria-pressed="${saved}" aria-label="${esc(saveLabel)}: ${esc(ch.title)}" title="${esc(saveTitle)}">${saved ? ICON.heartFilled : ICON.heart}</button>
    </div>
    <h3 id="t-${esc(ch.id)}"><a class="pcard__link" href="#/participant/challenge/${esc(ch.id)}">${esc(ch.title)}</a></h3>
    ${ch.summary ? `<p class="pcard__summary">${esc(ch.summary)}</p>` : ''}
    ${escoTags(ch.escoTags, 2)}
    <div class="pcard__foot">
      <span class="pcard__host"><span class="pcard__initial" aria-hidden="true">${esc(name.charAt(0))}</span><span><strong>${esc(name)}</strong><small>${esc(sectorLabel(ch.industry))} · ${esc(shareBy)}</small></span></span>
      ${status ? `<span class="pill pill--ok">${esc(status)}</span>` : `<span class="pcard__explore" aria-hidden="true">${esc(explore)} ${ICON.arrowUpRight}</span>`}
    </div>
  </article>`;
}

/** The purpose-bound consent notice solvers agree to before sharing. */
export function consentNotice(state) {
  const deleteOn = new Date(`${state.event.date}T12:00:00`);
  deleteOn.setDate(deleteOn.getDate() + state.event.retentionDays);
  const v = { event: state.event.name, days: state.event.retentionDays, date: fmtDate(deleteOn.toISOString().slice(0, 10), { year: true }) };
  const items = [
    [
      { en: 'Purpose.', fi: 'Tarkoitus.', sv: 'Syfte.' },
      {
        en: 'To arrange conversations between you and challenge hosts at {event}, whether about a role, a research collaboration or a pilot. Not for other events, marketing, or training any AI model.',
        fi: 'Keskustelujen järjestäminen sinun ja haasteita julkaisevien yritysten välille tapahtumassa {event}, oli kyse tehtävästä, tutkimusyhteistyöstä tai pilotista. Ei muihin tapahtumiin, markkinointiin eikä minkään tekoälymallin kouluttamiseen.',
        sv: 'Att ordna samtal mellan dig och värdarna för utmaningarna på {event}, oavsett om det gäller en tjänst, ett forskningssamarbete eller en pilot. Inte för andra evenemang, marknadsföring eller träning av någon AI-modell.',
      },
    ],
    [
      { en: 'Who is responsible.', fi: 'Rekisterinpitäjä.', sv: 'Personuppgiftsansvarig.' },
      {
        en: 'The City of Espoo, as the event organizer with Business Espoo, is the data controller.',
        fi: 'Espoon kaupunki tapahtuman järjestäjänä yhdessä Business Espoon kanssa on rekisterinpitäjä.',
        sv: 'Esbo stad, som arrangör av evenemanget tillsammans med Business Espoo, är personuppgiftsansvarig.',
      },
    ],
    [
      { en: 'What we keep.', fi: 'Mitä tallennamme.', sv: 'Vad vi sparar.' },
      {
        en: 'A solver ID, your name and email, the answers you share and how you are approaching each challenge, the challenges you save, and your conversation requests.',
        fi: 'Ratkaisijatunnuksen, nimesi ja sähköpostisi, jakamasi vastaukset ja sen, miten lähestyt kutakin haastetta, tallentamasi haasteet sekä keskustelupyyntösi.',
        sv: 'Ett lösar-ID, ditt namn och din e-post, svaren du delar och hur du tar dig an varje utmaning, utmaningarna du sparar och dina samtalsförfrågningar.',
      },
    ],
    [
      { en: 'What we never ask for.', fi: 'Mitä emme koskaan kysy.', sv: 'Vad vi aldrig frågar efter.' },
      {
        en: 'Nationality, ethnic background, age, gender, photos, CVs, pitch decks, logos, company size or funding stage.',
        fi: 'Kansallisuutta, etnistä taustaa, ikää, sukupuolta, valokuvia, ansioluetteloita, pitch deckejä, logoja, yrityksen kokoa tai rahoitusvaihetta.',
        sv: 'Nationalitet, etnisk bakgrund, ålder, kön, foton, CV:n, pitchdeck, logotyper, företagsstorlek eller finansieringsfas.',
      },
    ],
    [
      { en: 'Who sees what.', fi: 'Kuka näkee mitä.', sv: 'Vem ser vad.' },
      {
        en: 'Hosts see your answers under your solver ID. Your name, email and any team or company you belong to are shared with a host only after you both agree to meet.',
        fi: 'Yritykset näkevät vastauksesi ratkaisijatunnuksellasi. Nimesi, sähköpostisi ja mahdollinen tiimisi tai yrityksesi jaetaan yritykselle vasta, kun olette molemmat sopineet tapaamisesta.',
        sv: 'Värdarna ser dina svar under ditt lösar-ID. Ditt namn, din e-post och eventuellt team eller företag delas med en värd först när ni båda har kommit överens om att träffas.',
      },
    ],
    [
      { en: 'How long.', fi: 'Kuinka kauan.', sv: 'Hur länge.' },
      {
        en: 'Everything personal is deleted {days} days after the event, on {date}. Only anonymous counts remain.',
        fi: 'Kaikki henkilötiedot poistetaan {days} päivää tapahtuman jälkeen, {date}. Jäljelle jää vain anonyymeja lukumääriä.',
        sv: 'Alla personuppgifter raderas {days} dagar efter evenemanget, den {date}. Endast anonyma antal finns kvar.',
      },
    ],
    [
      { en: 'Your rights.', fi: 'Oikeutesi.', sv: 'Dina rättigheter.' },
      {
        en: 'You can see, correct or delete your data at any time. Withdraw consent in My workspace and your data is deleted straight away.',
        fi: 'Voit milloin tahansa nähdä, korjata tai poistaa tietosi. Peru suostumus Oma työtila -näkymässä, niin tietosi poistetaan heti.',
        sv: 'Du kan när som helst se, rätta eller radera dina uppgifter. Dra tillbaka samtycket på Min arbetsyta så raderas dina uppgifter direkt.',
      },
    ],
  ];
  return items.map(([head, body]) => `<p><strong>${esc(tr(head))}</strong> ${esc(tr(body, v))}</p>`).join('');
}

export function quotaBar(used) {
  const full = used >= REQUEST_CAP;
  const aria = tr({ en: 'Meeting request quota', fi: 'Tapaamispyyntöjen kiintiö', sv: 'Kvot för mötesförfrågningar' });
  const label = tr({ en: '{used} / {cap} meeting requests used', fi: '{used} / {cap} tapaamispyyntöä käytetty', sv: '{used} / {cap} mötesförfrågningar använda' }, { used, cap: REQUEST_CAP });
  const rest = full
    ? tr({ en: 'Limit reached', fi: 'Raja täynnä', sv: 'Gränsen nådd' })
    : tr({ en: '{n} left', fi: '{n} jäljellä', sv: '{n} kvar' }, { n: REQUEST_CAP - used });
  return `<div class="quota${full ? ' quota--full' : ''}" role="group" aria-label="${esc(aria)}">
    <div class="quota__label"><span>${esc(label)}</span><span class="muted">${esc(rest)}</span></div>
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

const MT_NAME = () => tr({ en: 'EU-Hosted Machine Translation (Simulated)', fi: 'EU:ssa ylläpidetty konekäännös (simuloitu)', sv: 'EU-baserad maskinöversättning (simulerad)' });
const MT_BADGE = () => tr({
  en: '[EU-Hosted Machine Translation — Original Always Shown]',
  fi: '[EU:ssa ylläpidetty konekäännös — alkuperäinen näkyy aina]',
  sv: '[EU-baserad maskinöversättning — originalet visas alltid]',
});

export function translationTargets(sub) {
  return Object.keys(sub.translations || {}).filter((k) => k !== sub.lang);
}

export function mtToggle(sub) {
  const target = translateOn.get(sub.id);
  const targets = translationTargets(sub);
  const on = !!target;
  const into = tr({ en: 'Into', fi: 'Kielelle', sv: 'Till' });
  const select =
    on && targets.length > 1
      ? `<label class="small row" style="gap:6px">${esc(into)} <select data-mt-target="${esc(sub.id)}" style="min-height:32px;padding:2px 8px;width:auto">${targets
          .map((t) => `<option value="${t}" ${t === target ? 'selected' : ''}>${esc(LANGS[t].label)}</option>`)
          .join('')}</select></label>`
      : '';
  return `<div class="row" style="gap:var(--s3)">
    <button type="button" class="toggle" id="mt-${esc(sub.id)}" data-mt="${esc(sub.id)}" data-default="${esc(defaultTarget(sub))}" aria-pressed="${on}">
      <span class="toggle__track" aria-hidden="true"></span>
      ${esc(MT_NAME())}
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
  const stored = sub.translations && sub.translations[target];
  const langLabel = LANGS[target]?.label || '';
  const translated = stored
    ? richText(stored[partKey], sub.format)
    : `<p class="muted small">${esc(
        tr(
          {
            en: 'No translation is stored for this answer in the offline demo. In a live deployment the EU-hosted translation service would return the text in {lang} here, still shown next to the original.',
            fi: 'Tälle vastaukselle ei ole tallennettu käännöstä demossa. Oikeassa käytössä EU:ssa ylläpidetty käännöspalvelu palauttaisi tähän tekstin kielellä {lang}, edelleen alkuperäisen vieressä.',
            sv: 'Ingen översättning finns sparad för det här svaret i demon. I verklig drift skulle den EU-baserade översättningstjänsten visa texten på {lang} här, fortfarande bredvid originalet.',
          },
          { lang: langLabel },
        ),
      )}</p>`;
  const originalLabel = tr({ en: 'Original, {lang}', fi: 'Alkuperäinen, {lang}', sv: 'Original, {lang}' }, { lang: langName(sub) });
  return `<div class="sbs">
    <div class="sbs__col" lang="${esc(sub.lang === 'other' ? '' : sub.lang)}"><div class="sbs__label">${esc(originalLabel)}</div>${original}</div>
    <div class="sbs__col sbs__col--mt" lang="${esc(target)}"><div class="sbs__label"><span class="mt-badge">${esc(MT_BADGE())}</span> ${esc(langLabel)}</div>${translated}</div>
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

export function verifiedBadge(text) {
  const t = text || tr({ en: 'Confirmed by a person', fi: 'Ihmisen vahvistama', sv: 'Bekräftad av en människa' });
  return `<span class="verified">${ICON.check}${esc(t)}</span>`;
}

/** Slot location ("Dipoli, Otaniemi, conversation table 3") in the interface language. */
export function placeLabel(location) {
  return String(location || '').replace(/conversation table (\d+)/, (m, n) => tr({ en: 'conversation table {n}', fi: 'keskustelupöytä {n}', sv: 'samtalsbord {n}' }, { n }));
}

/** The organizers line from the seed, translated when it is the standard one. */
export function organizersLabel(text) {
  if (text === 'City of Espoo and Business Espoo') return tr({ en: text, fi: 'Espoon kaupunki ja Business Espoo', sv: 'Esbo stad och Business Espoo' });
  return text || tr({ en: 'City of Espoo', fi: 'Espoon kaupunki', sv: 'Esbo stad' });
}
