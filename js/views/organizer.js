import { esc, fmtDateTime, toast, fmtDate } from '../ui.js';
import { skill } from '../esco.js';
import {
  company, challenge, participant, pseudoLabel, organizerDecision, isConfirmed, canRevealIdentity, aggregates,
  setFeedback, feedbackOutcome, OPT_IN_TARGET, clearAllFeedback, THEME_LABELS, slot,
} from '../store.js';
import { FORMATS, INTENTS, format as fmtOf } from '../formats.js';
import { statusPill, slotLabel, verifiedBadge, ICON, formatBadge, placeLabel, organizersLabel } from './shared.js';
import { buildIcs, buildBrellaCsv, buildTavataJson, downloadFile, confirmedMeetings } from '../exports.js';
import { tr, getLang } from '../i18n.js';

/** Interface text in English, Finnish and Swedish. */
const L = (en, fi, sv, vars) => tr({ en, fi, sv }, vars);

const ui = { preview: 'ics', reportCompany: null, track: '' };

const CONTINUE = () => L("Let's continue", 'Jatketaan', 'Vi fortsätter');
const NOT_NOW = () => L('Not now', 'Ei nyt', 'Inte nu');
const DECLINE = () => L('Decline', 'Hylkää', 'Avböj');

/** Decision log entries are stored in English; shown in the interface language. */
const ACTIONS = {
  'approved meeting': ['Approved meeting', 'Tapaaminen hyväksytty', 'Mötet godkänt'],
  'declined meeting': ['Declined meeting', 'Tapaaminen hylätty', 'Mötet avböjt'],
};
const actionLabel = (a) => (ACTIONS[a] ? L(...ACTIONS[a]) : a.charAt(0).toUpperCase() + a.slice(1));

export function tabs(state) {
  const ready = state.meetings.filter((m) => m.partyStatus === 'accepted' && m.organizerStatus === 'pending').length;
  return [
    { id: 'queue', label: L('Approval queue', 'Hyväksyntäjono', 'Godkännandekö'), count: ready },
    { id: 'schedule', label: L('Schedule and export', 'Aikataulu ja vienti', 'Schema och export') },
    { id: 'insights', label: L('Insights', 'Tilastot', 'Insikter') },
    { id: 'optin', label: L('After the event', 'Tapahtuman jälkeen', 'Efter evenemanget') },
    { id: 'reports', label: L('Company reports', 'Yritysraportit', 'Företagsrapporter') },
  ];
}

export function context(state) {
  return `<span>${ICON.person}</span><span>${esc(L('{org}, event team', '{org}, tapahtumatiimi', '{org}, evenemangsteamet', { org: organizersLabel(state.event.organizers) }))}: <strong>${esc(state.event.name)}</strong>, ${esc(fmtDate(state.event.date, { weekday: true }))}</span>`;
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
      toast(approve ? L('Approved. The conversation is on the schedule.', 'Hyväksytty. Keskustelu on aikataulussa.', 'Godkänt. Samtalet finns i schemat.') : L('Declined. Both sides are told the time is not available.', 'Hylätty. Molemmille kerrotaan, ettei aika ole saatavilla.', 'Avböjt. Båda sidor får veta att tiden inte är tillgänglig.'));
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
    toast(L('All post-event choices cleared.', 'Kaikki tapahtuman jälkeiset valinnat tyhjennetty.', 'Alla val efter evenemanget har rensats.'));
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
    const title = L('Skillink value report, {host}', 'Skillink-arvoraportti, {host}', 'Skillink värderapport, {host}', { host: c.name });
    downloadFile(`skillink-value-report-${c.id}.html`, 'text/html;charset=utf-8', `<!doctype html><html lang="${getLang()}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css.join('\n')}</style></head><body><main>${el.outerHTML}</main></body></html>`);
    toast(L('Report downloaded as an HTML file.', 'Raportti ladattu HTML-tiedostona.', 'Rapporten har laddats ner som HTML-fil.'));
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
  const line = (m, actions) => {
    const by = m.initiator === 'participant'
      ? L('Requested by the solver {when}.', 'Ratkaisijan pyytämä {when}.', 'Begärt av lösaren {when}.', { when: fmtDateTime(m.createdAt) })
      : L('Invited by the host {when}.', 'Yrityksen kutsuma {when}.', 'Inbjudan från värden {when}.', { when: fmtDateTime(m.createdAt) });
    return `<li>
    <div class="list__main"><h4>${esc(L('{host} and {who}', '{host} ja {who}', '{host} och {who}', { host: company(m.companyId).name, who: pseudoLabel(m.participantId) }))}</h4>
      <p>${esc(challenge(m.challengeId).title)}</p>
      <p>${esc(slotLabel(m.slotId))}, ${esc(placeLabel(slot(m.slotId)?.location))}. ${esc(by)}</p>
      <div style="margin-top:var(--s2)">${formatBadge(m.format)}</div></div>
    ${statusPill(m)}<div class="list__actions">${actions}</div></li>`;
  };
  const recent = state.decisionLog.filter((d) => d.actor === 'organizer').slice(0, 6);
  const scope = ui.track
    ? L('Both sides said yes. Oldest first, {format} only.', 'Molemmat sanoivat kyllä. Vanhin ensin, vain {format}.', 'Båda sidor sa ja. Äldst först, bara {format}.', { format: fmtOf(ui.track).label })
    : L('Both sides said yes. Oldest first, across hiring and matchmaking tracks.', 'Molemmat sanoivat kyllä. Vanhin ensin, sekä rekrytointi- että matchmaking-polulla.', 'Båda sidor sa ja. Äldst först, över både rekryterings- och matchmakingspåret.');
  return `
    <div class="split">
      <div>
        <fieldset class="filters__formats" style="margin-bottom:var(--s5)">
          <legend>${esc(L('Track', 'Polku', 'Spår'))}</legend>
          <div class="fchips">${chip('', L('All tracks', 'Kaikki polut', 'Alla spår'))}${FORMATS.map((f) => chip(f.id, f.label)).join('')}</div>
          <p class="hint">${esc(L('Counts are open requests and invitations, by what each conversation is about.', 'Luvut ovat avoimia pyyntöjä ja kutsuja keskustelun aiheen mukaan.', 'Antalet är öppna förfrågningar och inbjudningar, efter vad varje samtal handlar om.'))}</p>
        </fieldset>
        <section aria-labelledby="ready-h">
          <div class="section__head"><h1 id="ready-h" style="margin:0">${esc(L('Ready for your approval', 'Odottaa hyväksyntääsi', 'Redo för ditt godkännande'))}</h1><p class="small muted">${esc(scope)}</p></div>
          ${ready.length ? `<ul class="list">${ready.map((m) => line(m, `<button type="button" class="btn btn--sm btn--pine" data-decide="${m.id}" data-answer="approve">${esc(L('Approve', 'Hyväksy', 'Godkänn'))}</button><button type="button" class="btn btn--sm btn--ghost" data-decide="${m.id}" data-answer="decline">${esc(DECLINE())}</button>`)).join('')}</ul>` : `<div class="empty"><h3>${esc(ui.track ? L('Nothing waiting for approval in this track', 'Tällä polulla ei ole mitään hyväksyttävää', 'Inget väntar på godkännande i det här spåret') : L('Nothing waiting for approval', 'Ei mitään hyväksyttävää', 'Inget väntar på godkännande'))}</h3><p>${esc(L('Conversations appear here once a solver and a host have both said yes.', 'Keskustelut näkyvät täällä, kun sekä ratkaisija että yritys ovat sanoneet kyllä.', 'Samtal visas här när både en lösare och en värd har sagt ja.'))}</p></div>`}
        </section>
        <section class="section" aria-labelledby="wait-h">
          <div class="section__head"><h2 id="wait-h">${esc(L('Waiting for the other side', 'Odottaa toista osapuolta', 'Väntar på den andra sidan'))}</h2><p class="small muted">${esc(L('You can decline these, for example to resolve a clash. Approval opens once both sides agree.', 'Voit hylätä nämä esimerkiksi päällekkäisyyden ratkaisemiseksi. Hyväksyntä avautuu, kun molemmat ovat samaa mieltä.', 'Du kan avböja dessa, till exempel för att lösa en krock. Godkännande blir möjligt när båda sidor är överens.'))}</p></div>
          ${waiting.length ? `<ul class="list">${waiting.map((m) => line(m, `<button type="button" class="btn btn--sm btn--ghost" data-decide="${m.id}" data-answer="decline">${esc(DECLINE())}</button>`)).join('')}</ul>` : `<p class="muted">${esc(L('No open requests or invitations.', 'Ei avoimia pyyntöjä tai kutsuja.', 'Inga öppna förfrågningar eller inbjudningar.'))}</p>`}
        </section>
      </div>
      <aside class="stack">
        <div class="panel panel--pine"><h3>${esc(L('People stay in control', 'Ihmiset päättävät', 'Människor har kontrollen'))}</h3><p class="small">${esc(L('Every conversation, whether about a role, research or a pilot, is confirmed by a person on the event team. Nothing is approved automatically, and the queue is ordered by time only.', 'Jokaisen keskustelun, oli kyse tehtävästä, tutkimuksesta tai pilotista, vahvistaa tapahtumatiimin jäsen. Mitään ei hyväksytä automaattisesti, ja jono on järjestetty vain ajan mukaan.', 'Varje samtal, oavsett om det gäller en tjänst, forskning eller en pilot, bekräftas av en person i evenemangsteamet. Inget godkänns automatiskt, och kön är bara ordnad efter tid.'))}</p></div>
        <div class="panel"><h3>${esc(L('Your recent decisions', 'Viimeisimmät päätöksesi', 'Dina senaste beslut'))}</h3>${recent.length ? `<ul class="checks">${recent.map((d) => `<li class="check" style="color:${d.action.includes('approved') ? 'var(--pine-700)' : 'var(--red-700)'}">${d.action.includes('approved') ? ICON.check : ICON.cross}<p style="color:var(--text)"><strong>${esc(actionLabel(d.action))}</strong>${esc(d.detail)}</p></li>`).join('')}</ul>` : `<p class="small muted">${esc(L('Decisions you make appear here.', 'Tekemäsi päätökset näkyvät tässä.', 'Besluten du fattar visas här.'))}</p>`}</div>
      </aside>
    </div>`;
}

// ---------- schedule & export ----------
function doExport(kind) {
  const ms = confirmedMeetings();
  if (!ms.length) return toast(L('No confirmed conversations to export yet.', 'Ei vielä vahvistettuja keskusteluja vietäväksi.', 'Inga bekräftade samtal att exportera ännu.'), 'warn');
  if (kind === 'ics') downloadFile('skillink-espoo-schedule.ics', 'text/calendar;charset=utf-8', buildIcs(ms));
  if (kind === 'brella') downloadFile('skillink-brella-schedule.csv', 'text/csv;charset=utf-8', '﻿' + buildBrellaCsv(ms));
  if (kind === 'tavata') downloadFile('skillink-tavata-schedule.json', 'application/json', buildTavataJson(ms));
  toast(L('Exported {n} confirmed conversation(s).', 'Vietiin {n} vahvistettua keskustelua.', '{n} bekräftade samtal exporterades.', { n: ms.length }));
}

function renderSchedule(state) {
  const ms = confirmedMeetings().sort((a, b) => slot(a.slotId).start.localeCompare(slot(b.slotId).start));
  const preview = ui.preview === 'brella' ? buildBrellaCsv(ms) : ui.preview === 'tavata' ? buildTavataJson(ms) : buildIcs(ms);
  const confirmedTitle = L('Confirmed conversations', 'Vahvistetut keskustelut', 'Bekräftade samtal');
  return `
    <div class="section__head"><h1 style="margin:0">${esc(confirmedTitle)}</h1><p class="small muted">${esc(L('{n} on {date}, by time.', '{n} kpl, {date}, ajan mukaan.', '{n} den {date}, efter tid.', { n: ms.length, date: fmtDate(state.event.date, { weekday: true }) }))}</p></div>
    ${ms.length ? `<div class="table-wrap"><table>
      <caption class="sr-only">${esc(confirmedTitle)}</caption>
      <thead><tr><th scope="col">${esc(L('Time', 'Aika', 'Tid'))}</th><th scope="col">${esc(L('Where', 'Paikka', 'Plats'))}</th><th scope="col">${esc(L('Host', 'Yritys', 'Värd'))}</th><th scope="col">${esc(L('Solver', 'Ratkaisija', 'Lösare'))}</th><th scope="col">${esc(L('Format', 'Muoto', 'Format'))}</th><th scope="col">${esc(L('Challenge', 'Haaste', 'Utmaning'))}</th></tr></thead>
      <tbody>${ms.map((m) => `<tr><td class="nowrap">${esc(slotLabel(m.slotId).split(', ').pop())}</td><td>${esc(placeLabel(slot(m.slotId).location.replace('Dipoli, Otaniemi, ', '')))}</td><td>${esc(company(m.companyId).name)}</td><td>${canRevealIdentity(m) && participant(m.participantId) ? `${esc(participant(m.participantId).name)}<br><span class="muted">${esc(participant(m.participantId).email)}</span>` : esc(pseudoLabel(m.participantId))}</td><td>${formatBadge(m.format)}</td><td>${esc(challenge(m.challengeId).title)}</td></tr>`).join('')}</tbody>
    </table></div>` : `<div class="empty"><h3>${esc(L('No confirmed conversations yet', 'Ei vielä vahvistettuja keskusteluja', 'Inga bekräftade samtal ännu'))}</h3><p>${esc(L('Approve conversations in the', 'Hyväksy keskusteluja', 'Godkänn samtal i'))} <a href="#/organizer/queue">${esc(L('approval queue', 'hyväksyntäjonossa', 'godkännandekön'))}</a> ${esc(L('to build the schedule.', 'aikataulun rakentamiseksi.', 'för att bygga schemat.'))}</p></div>`}

    <section class="section" aria-labelledby="exp-h">
      <div class="section__head"><h2 id="exp-h">${esc(L('Export to calendars and event platforms', 'Vienti kalentereihin ja tapahtuma-alustoille', 'Export till kalendrar och evenemangsplattformar'))}</h2></div>
      <p>${esc(L('Skillink decides who talks and why. Brella and Tavata run the event day. Exports include the collaboration format of each conversation, and names only for conversations both sides agreed to.', 'Skillink ratkaisee, kuka keskustelee ja miksi. Brella ja Tavata pyörittävät tapahtumapäivää. Viennit sisältävät kunkin keskustelun yhteistyömuodon ja nimet vain keskusteluista, joihin molemmat ovat suostuneet.', 'Skillink avgör vem som pratar och varför. Brella och Tavata sköter evenemangsdagen. Exporten innehåller varje samtals samarbetsform, och namn bara för samtal som båda sidor har godkänt.'))}</p>
      <div class="row" style="margin:var(--s4) 0">
        <button type="button" class="btn btn--primary" data-export="ics">${esc(L('Download calendar invites (.ics)', 'Lataa kalenterikutsut (.ics)', 'Ladda ner kalenderinbjudningar (.ics)'))}</button>
        <button type="button" class="btn btn--secondary" data-export="brella">${esc(L('Download Brella schedule (CSV)', 'Lataa Brella-aikataulu (CSV)', 'Ladda ner Brella-schema (CSV)'))}</button>
        <button type="button" class="btn btn--secondary" data-export="tavata">${esc(L('Download Tavata schedule (JSON)', 'Lataa Tavata-aikataulu (JSON)', 'Ladda ner Tavata-schema (JSON)'))}</button>
      </div>
      <div class="panel" style="padding:0;overflow:hidden">
        <div class="row" role="group" aria-label="${esc(L('Preview format', 'Esikatselun muoto', 'Förhandsvisningsformat'))}" style="padding:var(--s3) var(--s4);border-bottom:1px solid var(--line)">
          <span class="small muted">${esc(L('Preview', 'Esikatselu', 'Förhandsvisning'))}</span>
          ${[['ics', '.ics'], ['brella', 'Brella CSV'], ['tavata', 'Tavata JSON']].map(([k, l]) => `<button type="button" class="btn btn--sm btn--ghost" data-preview="${k}" aria-pressed="${ui.preview === k}">${l}</button>`).join('')}
        </div>
        <pre id="export-preview" tabindex="0" aria-label="${esc(L('Export preview', 'Viennin esikatselu', 'Förhandsvisning av export'))}" style="margin:0;padding:var(--s4);max-height:320px;overflow:auto;font-size:12.5px;line-height:1.5;background:var(--surface-quiet);white-space:pre">${esc(preview)}</pre>
      </div>
      <p class="small muted" style="margin-top:var(--s3)">${esc(L("Brella and Tavata columns follow a generic schedule layout. Map them to each platform's current import format when connecting a live event. Export files stay in English so the platforms can read them.", 'Brellan ja Tavatan sarakkeet noudattavat yleistä aikataulumuotoa. Sovita ne kunkin alustan tuontimuotoon, kun yhdistät oikeaan tapahtumaan. Vientitiedostot pysyvät englanninkielisinä, jotta alustat voivat lukea ne.', 'Kolumnerna för Brella och Tavata följer en allmän schemalayout. Anpassa dem till varje plattforms aktuella importformat när du kopplar ett verkligt evenemang. Exportfilerna är på engelska så att plattformarna kan läsa dem.'))}</p>
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

const RESPONSES = () => L('responses', 'vastausta', 'svar');

function renderInsights(state) {
  const a = aggregates();
  const responses = state.challenges.map((ch) => ({ label: `${company(ch.companyId).name}: ${ch.title}`, value: a.responsesPerChallenge[ch.id] || 0, unit: RESPONSES() }));
  const totalResponses = Object.values(a.responsesPerChallenge).reduce((x, y) => x + y, 0);
  const demand = Object.entries(a.skillDemand)
    .map(([id, n]) => ({ id, label: skill(id).label, value: n, supply: a.skillSupply[id] || 0 }))
    .sort((x, y) => y.value - x.value || y.supply - x.supply || x.label.localeCompare(y.label));
  const unmet = demand.filter((d) => d.supply === 0).map((d) => ({ ...d, gap: true }));
  const langNames = { en: L('English', 'Englanti', 'Engelska'), fi: L('Finnish', 'Suomi', 'Finska'), sv: L('Swedish', 'Ruotsi', 'Svenska'), other: L('Other', 'Muu', 'Annat') };
  const langs = Object.entries(a.languages).map(([k, v]) => ({ label: langNames[k] || k, value: v, unit: RESPONSES() }));
  const rate = a.optIn.held ? a.optIn.mutual / a.optIn.held : 0;
  const interest = interestByFormat(a.intents);
  const formatGaps = FORMATS.filter((f) => (a.formatDemand[f.id] || 0) > 0 && !interest[f.id]);
  const quiet = state.challenges.filter((ch) => !a.responsesPerChallenge[ch.id]);
  const purged = state.purge.done
    ? ` ${L('Includes anonymous statistics kept after the personal-data deletion on {date}.', 'Sisältää anonyymit tilastot, jotka säilytettiin henkilötietojen poiston jälkeen {date}.', 'Inkluderar anonym statistik som sparades efter raderingen av personuppgifter den {date}.', { date: fmtDate(state.purge.at) })}`
    : '';
  return `
    <h1>${esc(L('Event insights', 'Tapahtuman tilastot', 'Insikter från evenemanget'))}</h1>
    <div class="notice" role="note"><span style="color:var(--trust-900)">${ICON.lock}</span><div><p class="notice__title">${esc(L('Aggregate counts only', 'Vain koostelukuja', 'Endast sammanställda antal'))}</p><p>${esc(L('Nothing on this page describes an individual or a team. Formats and skills come from host challenges and from what solvers chose to declare.', 'Mikään tällä sivulla ei kuvaa yksittäistä henkilöä tai tiimiä. Muodot ja taidot tulevat yritysten haasteista ja siitä, mitä ratkaisijat itse valitsivat kertoa.', 'Inget på den här sidan beskriver en enskild person eller ett team. Format och färdigheter kommer från värdarnas utmaningar och från vad lösarna själva valde att uppge.') + purged)}</p></div></div>
    <div class="metrics" style="margin:var(--s6) 0">
      <div class="metric"><div class="metric__v">${state.challenges.length}</div><div class="metric__l">${esc(L('Challenges posted', 'Julkaistut haasteet', 'Publicerade utmaningar'))}</div></div>
      <div class="metric"><div class="metric__v">${totalResponses}</div><div class="metric__l">${esc(L('Approaches shared', 'Jaetut vastaukset', 'Delade svar'))}</div></div>
      <div class="metric"><div class="metric__v">${a.meetings.confirmed}</div><div class="metric__l">${esc(L('Conversations confirmed', 'Vahvistetut keskustelut', 'Bekräftade samtal'))}</div></div>
      <div class="metric"><div class="metric__v">${Math.round(rate * 100)}%</div><div class="metric__l">${esc(L('Mutual "let\'s continue" (target {t}%)', 'Molemminpuolinen ”jatketaan” (tavoite {t} %)', 'Ömsesidigt ”vi fortsätter” (mål {t} %)', { t: Math.round(OPT_IN_TARGET * 100) }))}</div></div>
    </div>

    <section class="panel" aria-labelledby="i-fmt" style="margin-bottom:var(--s5)">
      <h2 id="i-fmt">${esc(L('Hiring, R&D and pilot interest', 'Kiinnostus rekrytointiin, T&K:hon ja pilotteihin', 'Intresse för rekrytering, FoU och piloter'))}</h2>
      <p class="small muted">${esc(L('Challenges that offer each format, approaches shared by solvers approaching it that way, and conversations confirmed about it. Open Format challenges and "open to discussing" solvers are counted under Open Format.', 'Kutakin muotoa tarjoavat haasteet, sitä kautta lähestyvien ratkaisijoiden jakamat vastaukset ja siitä vahvistetut keskustelut. Open Format -haasteet ja keskustelulle avoimet ratkaisijat lasketaan kohtaan Open Format.', 'Utmaningar som erbjuder varje format, svar från lösare som tar sig an det på det sättet och bekräftade samtal om det. Utmaningar med Open Format och lösare som är öppna för diskussion räknas under Open Format.'))}</p>
      <div class="table-wrap"><table>
        <caption class="sr-only">${esc(L('Interest by collaboration format', 'Kiinnostus yhteistyömuodoittain', 'Intresse per samarbetsform'))}</caption>
        <thead><tr><th scope="col">${esc(L('Collaboration format', 'Yhteistyömuoto', 'Samarbetsform'))}</th><th scope="col" class="num">${esc(L('Challenges offering it', 'Sitä tarjoavat haasteet', 'Utmaningar som erbjuder det'))}</th><th scope="col" class="num">${esc(L('Approaches shared', 'Jaetut vastaukset', 'Delade svar'))}</th><th scope="col" class="num">${esc(L('Conversations confirmed', 'Vahvistetut keskustelut', 'Bekräftade samtal'))}</th></tr></thead>
        <tbody>${FORMATS.map((f) => `<tr><th scope="row">${formatBadge(f.id)}</th><td class="num">${a.formatDemand[f.id] || 0}</td><td class="num">${interest[f.id]}</td><td class="num">${a.confirmedFormats[f.id] || 0}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>

    <div class="grid grid--2">
      <section class="panel" aria-labelledby="i-resp"><h2 id="i-resp">${esc(L('Responses per challenge', 'Vastaukset haasteittain', 'Svar per utmaning'))}</h2>${bars(responses, Math.max(1, ...responses.map((r) => r.value)))}</section>
      <section class="panel" aria-labelledby="i-dem"><h2 id="i-dem">${esc(L('Top ESCO skills in demand', 'Kysytyimmät ESCO-taidot', 'Mest efterfrågade ESCO-färdigheter'))}</h2><p class="small muted">${esc(L('Number of challenges asking for each skill, most requested first.', 'Kutakin taitoa kysyvien haasteiden määrä, kysytyin ensin.', 'Antal utmaningar som efterfrågar varje färdighet, mest efterfrågad först.'))}</p>${bars(demand.slice(0, 10), Math.max(1, ...demand.map((d) => d.value)))}</section>
      <section class="panel" aria-labelledby="i-unmet"><h2 id="i-unmet">${esc(L('Unmet ecosystem needs', 'Täyttymättömät ekosysteemin tarpeet', 'Ouppfyllda behov i ekosystemet'))}</h2><p class="small muted">${esc(L('Where hosts asked for something nobody offered. Useful for planning training, research calls and future events.', 'Kohdat, joissa yritykset kysyivät jotain, mitä kukaan ei tarjonnut. Hyödyllistä koulutusten, tutkimushakujen ja tulevien tapahtumien suunnittelussa.', 'Där värdarna efterfrågade något som ingen erbjöd. Användbart för att planera utbildningar, forskningsutlysningar och kommande evenemang.'))}</p>
        ${formatGaps.length ? `<p class="small"><strong>${esc(L('Formats with no takers yet:', 'Muodot, joille ei vielä ole tarttujia:', 'Format utan intressenter ännu:'))}</strong> ${formatGaps.map((f) => esc(f.label)).join(', ')}.</p>` : ''}
        ${quiet.length ? `<p class="small"><strong>${esc(L('Challenges with no responses yet:', 'Haasteet, joihin ei ole vielä vastauksia:', 'Utmaningar utan svar ännu:'))}</strong> ${quiet.map((ch) => esc(ch.title)).join(', ')}.</p>` : ''}
        <h3 class="small" style="margin-top:var(--s3)">${esc(L('Skills no solver declared drawing on', 'Taidot, joita yksikään ratkaisija ei ilmoittanut käyttävänsä', 'Färdigheter som ingen lösare uppgav att de använder'))}</h3>
        ${unmet.length ? bars(unmet.slice(0, 10), Math.max(1, ...unmet.map((d) => d.value)), { gap: true }) : `<p class="muted">${esc(L('Every requested skill was offered at least once.', 'Jokaista kysyttyä taitoa tarjottiin vähintään kerran.', 'Varje efterfrågad färdighet erbjöds minst en gång.'))}</p>`}</section>
      <section class="panel" aria-labelledby="i-lang"><h2 id="i-lang">${esc(L('Languages people wrote in', 'Kielet, joilla vastattiin', 'Språk som människor skrev på'))}</h2>${langs.length ? bars(langs, Math.max(1, ...langs.map((l) => l.value))) : `<p class="muted">${esc(L('No responses yet.', 'Ei vielä vastauksia.', 'Inga svar ännu.'))}</p>`}<p class="small muted" style="margin-top:var(--s3)">${esc(L('Writing in Finnish or Swedish never affects who is invited. Hosts can open a side-by-side translation.', 'Suomeksi tai ruotsiksi kirjoittaminen ei koskaan vaikuta siihen, kuka kutsutaan. Yritykset voivat avata käännöksen alkuperäisen viereen.', 'Att skriva på finska eller svenska påverkar aldrig vem som bjuds in. Värdarna kan öppna en översättning sida vid sida.'))}</p></section>
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
      <button type="button" class="btn btn--sm btn--ghost" data-sim="${m.id}" data-side="${who}" data-choice="continue" aria-pressed="${v === 'continue'}">${esc(CONTINUE())}</button>
      <button type="button" class="btn btn--sm btn--ghost" data-sim="${m.id}" data-side="${who}" data-choice="notnow" aria-pressed="${v === 'notnow'}">${esc(NOT_NOW())}</button>
    </div><p class="small muted" style="margin:var(--s2) 0 0">${esc(v ? L('Answered privately', 'Vastattu yksityisesti', 'Besvarat privat') : L('Not answered yet', 'Ei vielä vastattu', 'Inte besvarat ännu'))}</p></div>`;
  };
  const result = (m) => {
    const out = feedbackOutcome(m.id);
    const c = company(m.companyId);
    const p = participant(m.participantId);
    if (out === 'mutual') {
      return `<div class="optin__cell optin__result is-mutual" aria-live="polite">${verifiedBadge(L('Both chose to continue', 'Molemmat halusivat jatkaa', 'Båda valde att fortsätta'))}
        <div class="contact-card"><strong>${esc(L('Contact details exchanged', 'Yhteystiedot vaihdettu', 'Kontaktuppgifter utbytta'))}</strong><br>${esc(L('{solver} receives {host}', '{solver} saa: {host}', '{solver} får {host}', { solver: p ? p.name : '', host: `${c.hostName || ''}, ${c.hostEmail || ''}` }))}<br>${esc(L('{company} receives {email}', '{company} saa: {email}', '{company} får {email}', { company: c.name, email: p ? p.email : '' }))}</div></div>`;
    }
    if (out === 'closed') return `<div class="optin__cell optin__result" aria-live="polite"><strong>${esc(L('No contact shared', 'Yhteystietoja ei jaettu', 'Inga kontaktuppgifter delade'))}</strong><p class="small muted" style="margin:4px 0 0">${esc(L('Neither side is told who chose "not now".', 'Kummallekaan ei kerrota, kumpi valitsi ”ei nyt”.', 'Ingen av sidorna får veta vem som valde ”inte nu”.'))}</p></div>`;
    return `<div class="optin__cell optin__result" aria-live="polite"><strong>${esc(L('Waiting for both answers', 'Odotetaan molempien vastauksia', 'Väntar på båda svaren'))}</strong><p class="small muted" style="margin:4px 0 0">${esc(L('Nothing is shared until both have answered.', 'Mitään ei jaeta ennen kuin molemmat ovat vastanneet.', 'Inget delas förrän båda har svarat.'))}</p></div>`;
  };
  const need = Math.max(1, Math.ceil(OPT_IN_TARGET * a.optIn.held) - a.optIn.mutual);
  return `
    <div class="split">
      <div>
        <h1>${esc(L('After the event: mutual opt-in', 'Tapahtuman jälkeen: molemminpuolinen suostumus', 'Efter evenemanget: ömsesidigt samtycke'))}</h1>
        <p class="lede">${esc(L('Each side privately chooses "Let\'s continue" or "Not now" after their conversation. Contact details are exchanged only when both say continue, so they can carry on outside Skillink: a job interview, an R&D project or pilot scoping.', 'Kumpikin osapuoli valitsee keskustelun jälkeen yksityisesti ”Jatketaan” tai ”Ei nyt”. Yhteystiedot vaihdetaan vain, kun molemmat haluavat jatkaa, jotta yhteistyö voi jatkua Skillinkin ulkopuolella: työhaastattelu, T&K-projekti tai pilotin rajaus.', 'Varje sida väljer privat ”Vi fortsätter” eller ”Inte nu” efter samtalet. Kontaktuppgifter utbyts bara när båda vill fortsätta, så att de kan gå vidare utanför Skillink: en anställningsintervju, ett FoU-projekt eller en pilotavgränsning.'))}</p>
        <p class="small muted">${esc(L('This simulator lets you play both sides. In a live event, each person answers on their own device.', 'Tällä simulaattorilla voit toimia molempina osapuolina. Oikeassa tapahtumassa jokainen vastaa omalla laitteellaan.', 'Med den här simulatorn kan du spela båda sidor. På ett verkligt evenemang svarar var och en på sin egen enhet.'))}</p>
        ${ms.length ? ms.map((m) => `<div class="optin" role="group" aria-label="${esc(L('{host} and {who}', '{host} ja {who}', '{host} och {who}', { host: company(m.companyId).name, who: pseudoLabel(m.participantId) }))}">
          ${side(m, 'participant', `${pseudoLabel(m.participantId)}`, `<p style="margin:0 0 var(--s2)">${formatBadge(m.format)}</p>`)}
          ${side(m, 'host', `${company(m.companyId).name}`)}
          ${result(m)}
        </div>`).join('') : `<div class="empty"><h3>${esc(L('No confirmed conversations', 'Ei vahvistettuja keskusteluja', 'Inga bekräftade samtal'))}</h3><p>${esc(L('Approve conversations first, then come back after the event.', 'Hyväksy ensin keskusteluja ja palaa tänne tapahtuman jälkeen.', 'Godkänn samtal först och kom sedan tillbaka efter evenemanget.'))}</p></div>`}
        ${ms.length ? `<div class="row" style="margin-top:var(--s4)"><button type="button" class="btn btn--ghost btn--sm" id="clear-optin">${esc(L('Clear all choices', 'Tyhjennä kaikki valinnat', 'Rensa alla val'))}</button></div>` : ''}
      </div>
      <aside class="panel" style="position:sticky;top:var(--s4)">
        <h2>${esc(L('Pilot KPI', 'Pilotin mittari', 'Pilotens nyckeltal'))}</h2>
        <p class="small">${esc(L('Share of held conversations where both sides chose to continue, across every format.', 'Niiden käytyjen keskustelujen osuus, joissa molemmat halusivat jatkaa, kaikissa muodoissa.', 'Andel genomförda samtal där båda sidor valde att fortsätta, över alla format.'))}</p>
        <div class="kpi" style="margin-top:var(--s6)">
          <div class="kpi__track" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(L('Mutual opt-in rate', 'Molemminpuolisten suostumusten osuus', 'Andel ömsesidigt samtycke'))}">
            <div class="kpi__fill${below ? ' is-below' : ''}" style="width:${pct}%"></div>
            <div class="kpi__target" style="left:${OPT_IN_TARGET * 100}%"><span>${esc(L('Target {t}%', 'Tavoite {t} %', 'Mål {t} %', { t: Math.round(OPT_IN_TARGET * 100) }))}</span></div>
          </div>
          <div class="metric__v" style="margin-top:var(--s2)">${pct}%</div>
          <p class="small" style="margin:0">${esc(L('{m} of {h} conversations, {a} fully answered.', '{m}/{h} keskustelua, {a} vastattu kokonaan.', '{m} av {h} samtal, {a} helt besvarade.', { m: a.optIn.mutual, h: a.optIn.held, a: a.optIn.answered }))}</p>
          <p class="small" style="margin:0;font-weight:700;color:${below ? 'var(--amber-800)' : 'var(--pine-700)'}">${esc(below ? L('Below target: {n} more mutual opt-in(s) needed.', 'Alle tavoitteen: tarvitaan vielä {n} molemminpuolista suostumusta.', 'Under målet: {n} fler ömsesidiga samtycken behövs.', { n: need }) : L('On or above the 40% pilot target.', 'Pilotin 40 %:n tavoite on saavutettu.', 'På eller över pilotens mål på 40 %.'))}</p>
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
    { label: L('Saved the challenge', 'Tallensi haasteen', 'Sparade utmaningen'), value: r.bookmarks },
    { label: L('Shared their thinking', 'Jakoi ajatteluaan', 'Delade sitt tänkande'), value: r.responses },
    { label: L('Conversation requests and invitations', 'Keskustelupyynnöt ja kutsut', 'Samtalsförfrågningar och inbjudningar'), value: r.requests + r.invites },
    { label: L('Agreed by both sides', 'Molemmat suostuivat', 'Godkänt av båda sidor'), value: r.mutual },
    { label: L('Confirmed by the event team', 'Tapahtumatiimi vahvisti', 'Bekräftat av evenemangsteamet'), value: r.confirmed },
    { label: L('Both chose to continue afterwards', 'Molemmat halusivat jatkaa jälkikäteen', 'Båda valde att fortsätta efteråt'), value: r.continued },
  ];
  const approaches = L('approaches', 'vastausta', 'svar');
  const who = INTENTS.map((it) => ({ label: it.label, value: (r.intents || {})[it.id] || 0, unit: approaches, tone: it.format }));
  const conv = r.confirmed ? Math.round((r.continued / r.confirmed) * 100) : 0;
  const outcomes = FORMATS.map((f) => ({ label: f.label, value: (r.confirmedFormats || {})[f.id] || 0, unit: L('conversations', 'keskustelua', 'samtal'), tone: f.id })).filter((x) => x.value > 0);
  const posted = chs.length
    ? chs.map((x) => `<strong>${esc(x.title)}</strong> (${(x.formats || []).map((f) => esc(fmtOf(f).label)).join(', ')})`).join('; ')
    : esc(L('none', 'ei yhtään', 'inga'));
  return `
    <div class="row row--between no-print" style="margin-bottom:var(--s5)">
      <div class="field" style="min-width:260px"><label for="report-company">${esc(L('Host', 'Yritys', 'Värd'))}</label><select id="report-company">${state.companies.map((x) => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div class="row"><button type="button" class="btn btn--secondary" id="print-report">${esc(L('Print or save as PDF', 'Tulosta tai tallenna PDF:nä', 'Skriv ut eller spara som PDF'))}</button><button type="button" class="btn btn--ghost" id="download-report">${esc(L('Download report (HTML)', 'Lataa raportti (HTML)', 'Ladda ner rapporten (HTML)'))}</button></div>
    </div>
    <article class="report" aria-labelledby="rep-h">
      <header class="report__head">
        <div><p class="small muted" style="margin:0">${esc(L('Skillink value report', 'Skillink-arvoraportti', 'Skillink värderapport'))}</p><h1 id="rep-h" style="margin:0">${esc(c.name)}</h1></div>
        <div class="small" style="text-align:right">${esc(state.event.name)}<br>${esc(fmtDate(state.event.date, { year: true }))}, ${esc(state.event.venue)}<br><span class="muted">${esc(L('Generated {when}', 'Luotu {when}', 'Skapad {when}', { when: fmtDateTime(new Date().toISOString()) }))}</span></div>
      </header>
      <p>${esc(L('{host} posted {n} challenge(s):', '{host} julkaisi {n} haastetta:', '{host} publicerade {n} utmaning(ar):', { host: c.name, n: chs.length }))} ${posted}.</p>
      <div class="metrics" style="margin:var(--s5) 0">
        <div class="metric"><div class="metric__v">${r.responses}</div><div class="metric__l">${esc(L('People and teams showed their thinking', 'Ihmistä ja tiimiä näytti ajattelunsa', 'Personer och team visade sitt tänkande'))}</div></div>
        <div class="metric"><div class="metric__v">${r.questions}</div><div class="metric__l">${esc(L('Questions asked about your problem', 'Kysymystä ongelmastanne', 'Frågor om ert problem'))}</div></div>
        <div class="metric"><div class="metric__v">${r.confirmed}</div><div class="metric__l">${esc(L('Conversations held', 'Käytyä keskustelua', 'Genomförda samtal'))}</div></div>
        <div class="metric"><div class="metric__v">${conv}%</div><div class="metric__l">${esc(L('Ended in "let\'s continue" on both sides', 'Päättyi molemmin puolin valintaan ”jatketaan”', 'Slutade med ”vi fortsätter” från båda sidor'))}</div></div>
      </div>
      <div class="grid grid--2">
        <section aria-labelledby="rep-w"><h2 id="rep-w">${esc(L('Who engaged with your challenge', 'Ketkä tarttuivat haasteeseenne', 'Vilka engagerade sig i er utmaning'))}</h2>
          <p class="small muted">${esc(L('How solvers said they were approaching it: as talent, researchers, pilot partners or open to the best fit. Self-declared, counted, never scored.', 'Miten ratkaisijat kertoivat lähestyvänsä sitä: osaajina, tutkijoina, pilottikumppaneina tai avoimina parhaalle muodolle. Itse ilmoitettu, laskettu, ei koskaan pisteytetty.', 'Hur lösarna sa att de tog sig an den: som talanger, forskare, pilotpartner eller öppna för det som passar bäst. Självuppgivet, räknat, aldrig poängsatt.'))}</p>
          ${bars(who, Math.max(1, ...who.map((w) => w.value)))}</section>
        <section aria-labelledby="rep-f"><h2 id="rep-f">${esc(L('From interest to conversation', 'Kiinnostuksesta keskusteluun', 'Från intresse till samtal'))}</h2>${bars(funnel, Math.max(1, ...funnel.map((f) => f.value)))}</section>
        <section aria-labelledby="rep-t"><h2 id="rep-t">${esc(L('What solvers asked about', 'Mistä ratkaisijat kysyivät', 'Vad lösarna frågade om'))}</h2>
          <p class="small muted">${esc(L('Themes in the questions solvers wrote for you, grouped by a transparent keyword list. This describes questions, never people.', 'Teemat ratkaisijoiden teille kirjoittamissa kysymyksissä, ryhmitelty avoimen avainsanalistan mukaan. Tämä kuvaa kysymyksiä, ei koskaan ihmisiä.', 'Teman i frågorna som lösarna skrev till er, grupperade efter en öppen nyckelordslista. Det här beskriver frågor, aldrig människor.'))}</p>
          ${themes.length ? bars(themes.map(([k, v]) => ({ label: THEME_LABELS[k], value: v, unit: RESPONSES() })), Math.max(1, ...themes.map(([, v]) => v))) : `<p class="muted">${esc(L('No questions recorded.', 'Ei kirjattuja kysymyksiä.', 'Inga frågor registrerade.'))}</p>`}
        </section>
        <section aria-labelledby="rep-o"><h2 id="rep-o">${esc(L('Meeting outcomes by format', 'Tapaamisten tulokset muodoittain', 'Mötesutfall per format'))}</h2>
          ${outcomes.length ? bars(outcomes, Math.max(1, ...outcomes.map((o) => o.value))) : `<p class="muted">${esc(L('No conversations held yet.', 'Ei vielä käytyjä keskusteluja.', 'Inga samtal genomförda ännu.'))}</p>`}
          <p class="small muted" style="margin-top:var(--s3)">${esc(L('{c} of {n} held conversation(s) continued outside Skillink.', '{c}/{n} käydystä keskustelusta jatkui Skillinkin ulkopuolella.', '{c} av {n} genomförda samtal fortsatte utanför Skillink.', { c: r.continued, n: r.confirmed }))}</p>
        </section>
      </div>
      <p class="small muted" style="margin-top:var(--s6);border-top:1px solid var(--line);padding-top:var(--s3)">${esc(L('All figures are anonymous counts. No solver or team was scored, ranked or filtered by software. Prepared by the {org} event team.', 'Kaikki luvut ovat anonyymeja lukumääriä. Mikään ohjelmisto ei pisteyttänyt, järjestänyt tai suodattanut ratkaisijoita tai tiimejä. Laatinut: {org}, tapahtumatiimi.', 'Alla siffror är anonyma antal. Ingen lösare eller inget team poängsattes, rangordnades eller filtrerades av programvara. Sammanställd av evenemangsteamet, {org}.', { org: organizersLabel(state.event.organizers) }))}</p>
    </article>`;
}
