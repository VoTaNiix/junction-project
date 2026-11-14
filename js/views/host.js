// Challenge host: hiring managers, R&D leads and innovation partners.
import { esc, fmtDateTime, fmtDate, toast, openDialog, langName, addDays } from '../ui.js';
import { skill, searchSkills, domainLabel } from '../esco.js';
import {
  getState, company, challenge, participant, setCurrentCompany, revealedTo, pseudoLabel, inviteParticipant, respondToMeeting,
  freeSlots, existingMeeting, isConfirmed, canRevealIdentity, setFeedback, addChallenge, requestCoWriting, feedbackOutcome,
  findSubmission, meeting,
} from '../store.js';
import { FORMATS, intent as intentOf, defaultFormatFor, languagesFromText, LANG_PRESETS, sectorLabel } from '../formats.js';
import { talentAction, showTalentSide } from '../sides.js';
import {
  statusPill, slotLabel, submissionBody, mtToggle, bindTranslation, translationTargets, verifiedBadge, langBadge, escoTags,
  ICON, deadlineText, formatBadges, formatBadge, intentBadge, formatChoice,
} from './shared.js';
import { tr } from '../i18n.js';

/** Interface text in English, Finnish and Swedish. */
const L = (en, fi, sv, vars) => tr({ en, fi, sv }, vars);

const ui = { group: 'challenge' };

const CONVERSATIONS = () => L('Conversations', 'Keskustelut', 'Samtal');
const POST = () => L('Post a challenge', 'Julkaise haaste', 'Publicera en utmaning');
const YOURS = () => L('Your challenges', 'Omat haasteet', 'Dina utmaningar');
const CONTINUE = () => L("Let's continue", 'Jatketaan', 'Vi fortsätter');
const NOT_NOW = () => L('Not now', 'Ei nyt', 'Inte nu');

export function tabs(state) {
  const cid = state.currentCompanyId;
  const incoming = state.meetings.filter((m) => m.companyId === cid && m.initiator === 'participant' && m.partyStatus === 'requested').length;
  return [
    { id: 'feed', label: L('Review dashboard', 'Arviointinäkymä', 'Granskningsvy') },
    { id: 'meetings', label: CONVERSATIONS(), count: incoming },
    { id: 'new', label: POST() },
    { id: 'challenges', label: YOURS() },
  ];
}

// Signed in as the employer demo account: one company, no company picker.
export function context(state) {
  return `<label for="company-pick">${esc(L('Hosting as', 'Toimit yrityksenä', 'Du är värd som'))}</label>
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
        accept
          ? L("Accepted. You can now see this solver's name and email. The event team will confirm the time.", 'Hyväksytty. Näet nyt ratkaisijan nimen ja sähköpostin. Tapahtumatiimi vahvistaa ajan.', 'Accepterat. Du kan nu se lösarens namn och e-post. Evenemangsteamet bekräftar tiden.')
          : L('Request declined. The solver gets their request back.', 'Pyyntö hylätty. Ratkaisija saa pyyntönsä takaisin.', 'Förfrågan avböjd. Lösaren får tillbaka sin förfrågan.'),
        'ok',
        talentAction(pid, 'meetings'),
      );
    }),
  );
  root.querySelectorAll('[data-fb]').forEach((b) =>
    b.addEventListener('click', () => {
      setFeedback(b.dataset.fb, 'host', b.dataset.choice);
      toast(L('Your private choice is saved.', 'Yksityinen valintasi on tallennettu.', 'Ditt privata val är sparat.'));
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
    return `${esc(p.name)}<small>${esc(p.email)}. ${verifiedBadge(L('Identity shared after you both agreed to meet', 'Henkilöllisyys jaettu, kun sovitte tapaamisesta', 'Identiteten delad efter att ni båda kom överens om att träffas'))}</small>`;
  }
  return `${esc(pseudoLabel(pid))}<small>${ICON.lock} ${esc(L('Name, team and contact stay hidden until you both agree to meet', 'Nimi, tiimi ja yhteystiedot pysyvät piilossa, kunnes sovitte tapaamisesta', 'Namn, team och kontaktuppgifter förblir dolda tills ni båda kommer överens om att träffas'))}</small>`;
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
    return `<article class="sub" aria-label="${esc(L('Shared thinking from {who}', 'Jaettu ajattelu: {who}', 'Delat tänkande från {who}', { who: pseudoLabel(s.participantId) }))}">
      <div class="sub__head">
        <div class="sub__who">${whoBlock(state, s.participantId)}</div>
        ${intentBadge(s.intent)}
        <span class="pill pill--muted pill--plain">${esc(L('Written in {lang}', 'Kieli: {lang}', 'Skrivet på {lang}', { lang: langName(s) }))}</span>
        <span class="small muted">${esc(L('Shared {when}', 'Jaettu {when}', 'Delat {when}', { when: fmtDateTime(s.submittedAt) }))}</span>
      </div>
      <div class="sub__body">
        ${ui.group === 'time' ? `<p class="small muted" style="margin-bottom:var(--s3)">${esc(L('On: {title}', 'Haaste: {title}', 'Om: {title}', { title: ch.title }))}</p>` : ''}
        ${s.skills && s.skills.length ? `<div class="sub__skills"><span class="small muted">${esc(L('ESCO skills they say they draw on', 'ESCO-taidot, joita he kertovat hyödyntävänsä', 'ESCO-färdigheter de säger att de använder'))}</span>${escoTags(s.skills)}</div>` : ''}
        ${submissionBody(s)}
      </div>
      <div class="sub__foot">
        ${canTranslate ? mtToggle(s) : ''}
        <span style="margin-left:auto" class="row">
          ${m ? `${formatBadge(m.format)}${statusPill(m)}${m.partyStatus === 'requested' ? `<button type="button" class="btn btn--sm btn--pine" data-respond="${m.id}" data-answer="yes">${esc(L('Accept their request', 'Hyväksy pyyntö', 'Godkänn förfrågan'))}</button>` : ''}` : `<button type="button" class="btn btn--sm btn--primary" data-invite="${s.participantId}" data-ch="${s.challengeId}">${esc(L('Invite to a conversation', 'Kutsu keskusteluun', 'Bjud in till ett samtal'))}</button>`}
        </span>
      </div>
    </article>`;
  };

  let body;
  if (!subs.length) {
    body = `<div class="empty"><h3>${esc(L('No shared thinking yet', 'Ei vielä jaettua ajattelua', 'Inget delat tänkande ännu'))}</h3><p>${esc(L("Solvers can share until each challenge's deadline. Check that your", 'Ratkaisijat voivat jakaa ajatteluaan kunkin haasteen määräaikaan asti. Tarkista, että', 'Lösare kan dela fram till varje utmanings deadline. Kontrollera att dina'))} <a href="#/host/challenges">${esc(L('challenges', 'haasteesi', 'utmaningar'))}</a> ${esc(L('are clear and specific.', 'ovat selkeitä ja täsmällisiä.', 'är tydliga och konkreta.'))}</p></div>`;
  } else if (ui.group === 'time') {
    body = `<div class="stack">${subs.map(card).join('')}</div>`;
  } else {
    body = chs
      .map((ch) => {
        const list = subs.filter((s) => s.challengeId === ch.id);
        return `<section class="section" aria-labelledby="g-${ch.id}"><div class="section__head"><div><h2 id="g-${ch.id}">${esc(ch.title)}</h2>${formatBadges(ch.formats)}</div><p class="small muted">${esc(L('{n} shared', '{n} jaettu', '{n} delade', { n: list.length }))}</p></div>
          ${list.length ? `<div class="stack">${list.map(card).join('')}</div>` : `<p class="muted">${esc(L('Nothing shared on this challenge yet.', 'Tähän haasteeseen ei ole vielä jaettu mitään.', 'Inget har delats om den här utmaningen ännu.'))}</p>`}</section>`;
      })
      .join('');
  }

  const waiting = state.meetings.filter((m) => m.companyId === c.id && m.initiator === 'participant' && m.partyStatus === 'requested').length;
  return `
    <section class="pagehead" aria-labelledby="feed-h">
      <div>
        <p class="eyebrow">${esc(L('Pseudonymous review', 'Pseudonyymi arviointi', 'Pseudonym granskning'))}</p>
        <h1 id="feed-h">${esc(L('Host review dashboard', 'Arviointinäkymä', 'Granskningsvy för värdar'))}</h1>
        <p>${esc(L('Shared thinking for {host}, from talent, researchers and project partners.', 'Jaettu ajattelu yritykselle {host} osaajilta, tutkijoilta ja projektikumppaneilta.', 'Delat tänkande för {host}, från talanger, forskare och projektpartner.', { host: c.name }))}</p>
      </div>
      <div class="row" role="group" aria-label="${esc(L('Group shared thinking', 'Ryhmittele jaettu ajattelu', 'Gruppera delat tänkande'))}">
        <span class="small muted">${esc(L('Show', 'Näytä', 'Visa'))}</span>
        <button type="button" class="btn btn--sm btn--ghost" data-group="challenge" aria-pressed="${ui.group === 'challenge'}">${esc(L('By challenge', 'Haasteittain', 'Per utmaning'))}</button>
        <button type="button" class="btn btn--sm btn--ghost" data-group="time" aria-pressed="${ui.group === 'time'}">${esc(L('All, by time shared', 'Kaikki jakamisajan mukaan', 'Alla, efter tidpunkt'))}</button>
      </div>
    </section>
    <div class="metrics" style="margin:var(--s4) 0 var(--s5)">
      <div class="metric"><div class="metric__v">${chs.length}</div><div class="metric__l">${esc(L('Your challenges', 'Haasteesi', 'Dina utmaningar'))}</div></div>
      <div class="metric"><div class="metric__v">${subs.length}</div><div class="metric__l">${esc(L('Shared thinking received', 'Vastaanotettu ajattelu', 'Mottaget tänkande'))}</div></div>
      <div class="metric"><div class="metric__v">${waiting}</div><div class="metric__l">${esc(L('Conversation requests waiting for you', 'Sinua odottavat keskustelupyynnöt', 'Samtalsförfrågningar som väntar på dig'))}</div></div>
    </div>
    <div class="notice" role="note" aria-labelledby="zr-h">
      <span style="color:var(--brand-900)">${ICON.check}</span>
      <div><p class="notice__title" id="zr-h">${esc(L('Never ranked, scored or filtered by AI', 'Tekoäly ei koskaan järjestä, pisteytä tai suodata', 'Aldrig rangordnat, poängsatt eller filtrerat av AI'))}</p>
      <p>${esc(ui.group === 'challenge'
        ? L('Shared thinking is listed by the time it was shared, oldest first, grouped by challenge. There are no match scores, no automatic shortlists, and no logos or company sizes to judge by. People decide who to talk to.', 'Jaettu ajattelu näytetään jakamisjärjestyksessä, vanhin ensin, haasteittain ryhmiteltynä. Ei osuvuuspisteitä, ei automaattisia lyhytlistoja eikä logoja tai yritysten kokoja arvioinnin pohjaksi. Ihmiset päättävät, kenen kanssa keskustelevat.', 'Delat tänkande listas i den ordning det delades, äldst först, grupperat per utmaning. Inga matchningspoäng, inga automatiska kortlistor och inga logotyper eller företagsstorlekar att bedöma efter. Människor bestämmer vem de pratar med.')
        : L('Shared thinking is listed by the time it was shared, oldest first. There are no match scores, no automatic shortlists, and no logos or company sizes to judge by. People decide who to talk to.', 'Jaettu ajattelu näytetään jakamisjärjestyksessä, vanhin ensin. Ei osuvuuspisteitä, ei automaattisia lyhytlistoja eikä logoja tai yritysten kokoja arvioinnin pohjaksi. Ihmiset päättävät, kenen kanssa keskustelevat.', 'Delat tänkande listas i den ordning det delades, äldst först. Inga matchningspoäng, inga automatiska kortlistor och inga logotyper eller företagsstorlekar att bedöma efter. Människor bestämmer vem de pratar med.'))}</p></div>
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
    title: L('Invite {who}', 'Kutsu: {who}', 'Bjud in {who}', { who: pseudoLabel(pid) }),
    body: `<p>${esc(L('About:', 'Aihe:', 'Om:'))} <strong>${esc(ch.title)}</strong></p>
      ${sub ? `<p class="small muted">${esc(L('They are approaching this as:', 'He lähestyvät tätä näin:', 'De tar sig an detta som:'))} <strong>${esc(intentOf(sub.intent).label)}</strong>.</p>` : ''}
      <form id="inv-form">
        ${formatChoice(ch, defaultFormatFor(ch, sub?.intent))}
        <fieldset><legend>${esc(L('Pick one of your times at {venue}', 'Valitse yksi ajoistasi: {venue}', 'Välj en av dina tider på {venue}', { venue: state.event.venue }))}</legend>
        ${slots.length ? `<div class="slots">${slots.map((s, i) => `<label class="slot"><input type="radio" name="slot" value="${s.id}" ${i === 0 ? 'checked' : ''}><span>${esc(slotLabel(s.id).split(', ').pop())}<small>${esc(fmtDate(s.start, { weekday: true }))}</small></span></label>`).join('')}</div>` : `<p class="notice notice--amber">${esc(L('All your times are booked.', 'Kaikki aikasi on varattu.', 'Alla dina tider är bokade.'))}</p>`}
        </fieldset>
        <p class="small muted">${esc(L("The solver decides whether to accept. You'll see their name and email only if they do. The City of Espoo event team then confirms the time.", 'Ratkaisija päättää, hyväksyykö kutsun. Näet nimen ja sähköpostin vain, jos hän hyväksyy. Espoon kaupungin tapahtumatiimi vahvistaa sitten ajan.', 'Lösaren bestämmer om hen tackar ja. Du ser namn och e-post bara om hen gör det. Esbo stads evenemangsteam bekräftar sedan tiden.'))}</p>
        <div class="row row--end"><button type="button" class="btn btn--ghost" data-close>${esc(L('Cancel', 'Peruuta', 'Avbryt'))}</button><button type="submit" class="btn btn--primary" ${slots.length ? '' : 'disabled'}>${esc(L('Send invitation', 'Lähetä kutsu', 'Skicka inbjudan'))}</button></div>
      </form>`,
    onBind: (dlg, close) =>
      dlg.querySelector('#inv-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const res = inviteParticipant(c.id, pid, chId, fd.get('slot'), fd.get('mformat'));
        if (!res.ok) return toast(res.error, 'error');
        close();
        toast(L('Invitation sent to {who}.', 'Kutsu lähetetty: {who}.', 'Inbjudan skickad till {who}.', { who: pseudoLabel(pid) }), 'ok', talentAction(pid, 'meetings'));
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
      <p>${esc(challenge(m.challengeId).title)}</p><p>${esc(slotLabel(m.slotId))}. ${esc(m.initiator === 'participant' ? L('They asked you.', 'He pyysivät sinua.', 'De frågade dig.') : L('You invited them.', 'Sinä kutsuit heidät.', 'Du bjöd in dem.'))}</p>
      ${canRevealIdentity(m) && participant(m.participantId) ? `<p>${esc(participant(m.participantId).email)}</p>` : ''}
      <div style="margin-top:var(--s2)">${formatBadge(m.format)}</div>
    </div>${statusPill(m)}<div class="list__actions">${actions}</div></li>`;
  return `
    <section aria-labelledby="in-h">
      <div class="section__head"><h1 id="in-h" style="margin:0">${esc(L('Requests from solvers', 'Ratkaisijoiden pyynnöt', 'Förfrågningar från lösare'))}</h1><p class="small muted">${esc(L('Oldest first. Read their thinking on the', 'Vanhin ensin. Lue heidän ajattelunsa', 'Äldst först. Läs deras tänkande i'))} <a href="#/host/feed">${esc(L('Review dashboard', 'arviointinäkymässä', 'granskningsvyn'))}</a>.</p></div>
      ${incoming.length ? `<ul class="list">${incoming.map((m) => line(m, `<button type="button" class="btn btn--sm btn--pine" data-respond="${m.id}" data-answer="yes">${esc(L('Accept', 'Hyväksy', 'Godkänn'))}</button><button type="button" class="btn btn--sm btn--ghost" data-respond="${m.id}" data-answer="no">${esc(L('Decline', 'Hylkää', 'Avböj'))}</button>`)).join('')}</ul>` : `<div class="empty"><h3>${esc(L('No requests waiting', 'Ei odottavia pyyntöjä', 'Inga väntande förfrågningar'))}</h3><p>${esc(L('New requests appear here as solvers send them.', 'Uudet pyynnöt näkyvät tässä, kun ratkaisijat lähettävät niitä.', 'Nya förfrågningar visas här när lösare skickar dem.'))}</p></div>`}
    </section>
    <section class="section" aria-labelledby="all-h">
      <div class="section__head"><h2 id="all-h">${esc(L('All conversations', 'Kaikki keskustelut', 'Alla samtal'))}</h2></div>
      ${rest.length ? `<ul class="list">${rest.map((m) => line(m)).join('')}</ul>` : `<p class="muted">${esc(L('No other conversations yet.', 'Ei vielä muita keskusteluja.', 'Inga andra samtal ännu.'))}</p>`}
    </section>
    ${confirmed.length ? `<section class="section" aria-labelledby="pe-h">
      <div class="section__head"><h2 id="pe-h">${esc(L('After the event', 'Tapahtuman jälkeen', 'Efter evenemanget'))}</h2><p class="small muted">${esc(L(
        'Private. The solver never sees your choice; contact details are exchanged only if you both choose to continue, whether for a job interview, an R&D project or pilot scoping.',
        'Yksityinen. Ratkaisija ei koskaan näe valintaasi; yhteystiedot vaihdetaan vain, jos molemmat haluatte jatkaa, oli kyse työhaastattelusta, T&K-projektista tai pilotin rajauksesta.',
        'Privat. Lösaren ser aldrig ditt val; kontaktuppgifter utbyts bara om ni båda vill fortsätta, oavsett om det gäller en anställningsintervju, ett FoU-projekt eller en pilotavgränsning.',
      ))}</p></div>
      <ul class="list">${confirmed.map((m) => {
        const f = state.feedback[m.id] || {};
        const out = feedbackOutcome(m.id);
        const p = participant(m.participantId);
        return `<li><div class="list__main"><h4>${p ? esc(p.name) : esc(pseudoLabel(m.participantId))}</h4><p>${esc(challenge(m.challengeId).title)}</p><div style="margin-top:var(--s2)">${formatBadge(m.format)}</div>${out === 'mutual' ? `<p style="color:var(--pine-700);font-weight:700;margin-top:var(--s2)">${esc(L('You both chose to continue. Reach out to them directly.', 'Molemmat halusitte jatkaa. Ota häneen yhteyttä suoraan.', 'Ni båda valde att fortsätta. Kontakta dem direkt.'))}</p>` : ''}</div>
        <div class="list__actions" role="group" aria-label="${esc(L('Your private choice', 'Yksityinen valintasi', 'Ditt privata val'))}"><button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="continue" aria-pressed="${f.host === 'continue'}">${esc(CONTINUE())}</button><button type="button" class="btn btn--sm btn--ghost" data-fb="${m.id}" data-choice="notnow" aria-pressed="${f.host === 'notnow'}">${esc(NOT_NOW())}</button></div></li>`;
      }).join('')}</ul></section>` : ''}`;
}

// ---------- 10-minute challenge template ----------
const INDUSTRIES = ['Energy', 'Public sector', 'Manufacturing', 'Deep tech', 'Construction', 'SaaS', 'Mobility', 'Health', 'Retail', 'Other'];

// Starting text for the host's own draft, in the interface language. [brackets] must be replaced.
const T3 = (en, fi, sv) => ({ en, fi, sv });
const TEMPLATES = {
  Energy: {
    title: T3('Our [system] struggles when [specific condition]', '[Järjestelmämme] takkuaa, kun [tietty tilanne]', 'Vårt [system] klarar sig dåligt när [specifikt villkor]'),
    summary: T3('Keep [system] working when [hard case] happens.', 'Pidä [järjestelmä] toiminnassa, kun [vaikea tilanne] sattuu.', 'Håll [systemet] igång när [svårt fall] inträffar.'),
    context: T3('We operate [what] for [who] in Espoo. Today it works when [normal case], but when [hard case] we see [concrete problem, with a number if possible].', 'Ylläpidämme [mitä] [kenelle] Espoossa. Nyt se toimii, kun [tavallinen tilanne], mutta kun [vaikea tilanne], näemme [konkreettinen ongelma, mieluiten luvun kanssa].', 'Vi driver [vad] för [vem] i Esbo. I dag fungerar det när [normalfall], men när [svårt fall] ser vi [konkret problem, gärna med en siffra].'),
    tricky: T3('The obvious fix of [X] fails because [constraint]. We also cannot [limitation].', 'Ilmeinen ratkaisu [X] ei toimi, koska [rajoite]. Emme myöskään voi [rajoitus].', 'Den uppenbara lösningen [X] fungerar inte eftersom [begränsning]. Vi kan inte heller [begränsning].'),
    tags: ['gt-energy-eff', 'gt-demand', 'ai-timeseries'],
  },
  Construction: {
    title: T3('[Material or process] traceability on [type of site]', '[Materiaalin tai prosessin] jäljitettävyys [työmaatyyppi]', 'Spårbarhet för [material eller process] på [typ av byggplats]'),
    summary: T3('[What gets lost] between [step] and [step].', '[Mikä katoaa] [vaiheen] ja [vaiheen] välillä.', '[Vad som går förlorat] mellan [steg] och [steg].'),
    context: T3('We work on [type of project] in Espoo. Today [what happens], which means [impact on cost, carbon or safety, with a number].', 'Teemme [hanketyyppi] Espoossa. Nyt [mitä tapahtuu], mikä tarkoittaa [vaikutus kustannuksiin, päästöihin tai turvallisuuteen, luvun kanssa].', 'Vi arbetar med [typ av projekt] i Esbo. I dag [vad som händer], vilket innebär [påverkan på kostnad, koldioxid eller säkerhet, med en siffra].'),
    tricky: T3('Crews have [time limit], records are [format], and [certification or rule] requires [evidence].', 'Työryhmillä on [aikaraja], tiedot ovat [muodossa] ja [sertifikaatti tai sääntö] vaatii [näyttöä].', 'Arbetslagen har [tidsgräns], dokumentationen är [format], och [certifiering eller regel] kräver [bevis].'),
    tags: ['ce-circular', 'ce-trace', 'gt-lca'],
  },
  default: {
    title: T3('We need to [goal] without [constraint]', 'Meidän täytyy [tavoite] ilman [rajoite]', 'Vi behöver [mål] utan [begränsning]'),
    summary: T3('[The bottleneck in one plain sentence].', '[Pullonkaula yhdellä selkeällä lauseella].', '[Flaskhalsen i en enkel mening].'),
    context: T3('Our team at [company] in Espoo is working on [area]. Right now, [what happens], which means [impact on people or business].', 'Tiimimme [yritys] Espoossa työskentelee [alue] parissa. Tällä hetkellä [mitä tapahtuu], mikä tarkoittaa [vaikutus ihmisiin tai liiketoimintaan].', 'Vårt team på [företag] i Esbo arbetar med [område]. Just nu [vad som händer], vilket innebär [påverkan på människor eller verksamhet].'),
    tricky: T3('We already tried [attempt] and it did not work because [reason]. The hard part is [tension].', 'Kokeilimme jo [yritys], eikä se toiminut, koska [syy]. Vaikein osa on [jännite].', 'Vi har redan provat [försök] och det fungerade inte eftersom [anledning]. Det svåra är [spänning].'),
    tags: [],
  },
};
const FORMAT_LINE = {
  hiring: T3('We are hiring for this and want to meet people who would tackle it.', 'Rekrytoimme tähän ja haluamme tavata ihmisiä, jotka tarttuisivat siihen.', 'Vi rekryterar för detta och vill träffa människor som skulle ta sig an det.'),
  rnd: T3('We would welcome a thesis, a research group or a joint R&D project on this.', 'Toivotamme tervetulleeksi opinnäytetyön, tutkimusryhmän tai yhteisen T&K-projektin tämän parissa.', 'Vi välkomnar ett examensarbete, en forskargrupp eller ett gemensamt FoU-projekt kring detta.'),
  pilot: T3('We are looking for a pilot or project partner, from a solo specialist to a small startup.', 'Etsimme pilotti- tai projektikumppania yksittäisestä asiantuntijasta pieneen startupiin.', 'Vi söker en pilot- eller projektpartner, från en enskild specialist till en liten startup.'),
  open: T3('We are open to hiring, partnering or piloting, whichever fits best.', 'Olemme avoimia rekrytoinnille, kumppanuudelle tai pilotille, mikä sopii parhaiten.', 'Vi är öppna för rekrytering, partnerskap eller pilot, det som passar bäst.'),
};

const EMPTY_DRAFT = { formats: [], title: '', summary: '', context: '', tricky: '', tags: [], language: 'English is fine', languageCustom: '', industry: '', deadline: '', cowrite: false, cwBottleneck: '', cwToday: '', cwTried: '' };
const draft = { ...EMPTY_DRAFT, formats: [], tags: [] };

function readiness(d) {
  return [
    { ok: d.formats.length >= 1, t: L('At least one collaboration format', 'Vähintään yksi yhteistyömuoto', 'Minst en samarbetsform') },
    { ok: d.title.trim().length >= 12, t: L('A title that names the problem', 'Otsikko, joka nimeää ongelman', 'En rubrik som namnger problemet') },
    { ok: d.summary.trim().length >= 20, t: L('A one-line problem summary', 'Yhden rivin tiivistelmä ongelmasta', 'En sammanfattning av problemet på en rad') },
    { ok: d.context.trim().length >= 80, t: L('Real-world context, a few sentences', 'Todellinen tausta muutamalla lauseella', 'Verkligt sammanhang, några meningar') },
    { ok: d.tricky.trim().length >= 40, t: L('What makes it tricky', 'Mikä tekee siitä hankalaa', 'Vad som gör det knepigt') },
    { ok: d.tags.length >= 2 && d.tags.length <= 6, t: L('2 to 6 ESCO skills', '2–6 ESCO-taitoa', '2 till 6 ESCO-färdigheter') },
    { ok: !!(d.language === 'custom' ? d.languageCustom.trim() : d.language), t: L('A real language requirement', 'Todellinen kielivaatimus', 'Ett verkligt språkkrav') },
    { ok: !!d.industry, t: L('Sector or topic', 'Toimiala tai aihe', 'Bransch eller ämne') },
    { ok: !!d.deadline, t: L('Deadline for solvers', 'Määräaika ratkaisijoille', 'Deadline för lösare') },
  ];
}

function renderNew(state) {
  const c = company(state.currentCompanyId);
  const minDate = new Date().toISOString().slice(0, 10);
  const maxDate = addDays(state.event.date, -2);
  return `
  <div class="split">
    <form id="ch-form" novalidate aria-labelledby="new-h" class="stack">
      <h1 id="new-h">${esc(L('Post a challenge for {host}', 'Julkaise haaste: {host}', 'Publicera en utmaning för {host}', { host: c.name }))}</h1>
      <p class="lede" style="margin-top:0">${esc(L(
        'Ten minutes. Describe the actual bottleneck your team is wrestling with, not a boilerplate job ad or procurement RFP. Clear and specific beats polished. Challenges must be published before solver registration closes.',
        'Kymmenen minuuttia. Kuvaa todellinen pullonkaula, jonka parissa tiimisi painii, älä vakiomuotoista työpaikkailmoitusta tai tarjouspyyntöä. Selkeä ja täsmällinen voittaa hiotun. Haasteet on julkaistava ennen kuin ratkaisijoiden ilmoittautuminen päättyy.',
        'Tio minuter. Beskriv den verkliga flaskhals ditt team brottas med, inte en standardannons eller en anbudsförfrågan. Tydligt och konkret slår välputsat. Utmaningar måste publiceras innan lösarnas anmälan stänger.',
      ))}</p>

      <div class="panel panel--trust">
        <div class="row row--between">
          <div><h3 style="margin:0">${esc(L('Business Espoo co-writing assistant', 'Business Espoon kirjoitusapu', 'Business Espoos skrivstöd'))}</h3><p class="small" style="margin:4px 0 0">${esc(L(
            'Short on time? Answer three quick questions and the assistant shapes them into a 10-minute challenge. A Business Espoo or City of Espoo advisor then reviews it. Free for Espoo hosts.',
            'Onko aikaa vähän? Vastaa kolmeen nopeaan kysymykseen, niin avustaja muokkaa vastauksista 10 minuutin haasteen. Business Espoon tai Espoon kaupungin neuvoja tarkistaa sen. Maksuton espoolaisille yrityksille.',
            'Ont om tid? Svara på tre snabba frågor så formar assistenten dem till en tiominutersutmaning. En rådgivare från Business Espoo eller Esbo stad granskar den sedan. Kostnadsfritt för värdar i Esbo.',
          ))}</p></div>
          <button type="button" class="toggle" role="switch" id="cowrite" aria-checked="${draft.cowrite}"><span class="toggle__track" aria-hidden="true"></span>${esc(L('Request co-writing support', 'Pyydä kirjoitusapua', 'Be om skrivstöd'))}</button>
        </div>
        <div id="cowrite-panel" ${draft.cowrite ? '' : 'hidden'} style="margin-top:var(--s4)">
          <div class="stack" style="gap:var(--s3)">
            <div class="field"><label for="cw-bottleneck">${esc(L('What is the bottleneck, in one sentence?', 'Mikä on pullonkaula yhdellä lauseella?', 'Vad är flaskhalsen, i en mening?'))}</label><input type="text" id="cw-bottleneck" name="cwBottleneck" value="${esc(draft.cwBottleneck)}" placeholder="${esc(L('e.g. Our gateways go silent when it is very cold', 'esim. Yhdyskäytävämme hiljenevät kovalla pakkasella', 't.ex. Våra gateways tystnar när det är mycket kallt'))}" /></div>
            <div class="field"><label for="cw-today">${esc(L('What happens today because of it?', 'Mitä siitä seuraa tällä hetkellä?', 'Vad händer i dag på grund av det?'))}</label><p class="hint" id="cw-today-h">${esc(L('A number helps: hours lost, sites affected, euros, users.', 'Luku auttaa: menetetyt tunnit, kohteet, eurot, käyttäjät.', 'En siffra hjälper: förlorade timmar, berörda platser, euro, användare.'))}</p><textarea id="cw-today" name="cwToday" rows="2" aria-describedby="cw-today-h">${esc(draft.cwToday)}</textarea></div>
            <div class="field"><label for="cw-tried">${esc(L('What have you tried, or what rules out the obvious fix?', 'Mitä olette kokeilleet, tai mikä estää ilmeisen ratkaisun?', 'Vad har ni provat, eller vad utesluter den uppenbara lösningen?'))}</label><textarea id="cw-tried" name="cwTried" rows="2">${esc(draft.cwTried)}</textarea></div>
          </div>
          <div class="row" style="margin-top:var(--s4)">
            <button type="button" class="btn btn--sm btn--primary" id="cw-draft">${esc(L('Draft my challenge from these notes', 'Luonnostele haaste näistä muistiinpanoista', 'Skapa ett utkast från anteckningarna'))}</button>
            <button type="button" class="btn btn--sm btn--secondary" id="prefill">${esc(L('Fill empty fields with a starting template', 'Täytä tyhjät kentät aloituspohjalla', 'Fyll tomma fält med en startmall'))}</button>
            <button type="button" class="btn btn--sm btn--ghost" id="refine">${esc(L('Check my draft', 'Tarkista luonnokseni', 'Granska mitt utkast'))}</button>
          </div>
          <p class="small muted" style="margin-top:var(--s3)">${esc(L("The assistant follows a fixed, published template. It does not use AI and never sees anyone's answers.", 'Avustaja noudattaa kiinteää, julkaistua pohjaa. Se ei käytä tekoälyä eikä koskaan näe kenenkään vastauksia.', 'Assistenten följer en fast, publicerad mall. Den använder inte AI och ser aldrig någons svar.'))}</p>
          <div id="refine-out" aria-live="polite"></div>
        </div>
      </div>

      <fieldset class="qblock" aria-describedby="n-formats-h">
        <legend class="sr-only">${esc(L('Collaboration format', 'Yhteistyömuoto', 'Samarbetsform'))}</legend>
        <h3><span class="qblock__n">1</span>${esc(L('What kind of collaboration are you open to?', 'Millaiselle yhteistyölle olette avoimia?', 'Vilken typ av samarbete är ni öppna för?'))}</h3>
        <p class="hint" id="n-formats-h">${esc(L('Choose one or more. Solvers see these as badges and can filter by them.', 'Valitse yksi tai useampi. Ratkaisijat näkevät nämä merkkeinä ja voivat suodattaa niiden mukaan.', 'Välj en eller flera. Lösarna ser dem som märken och kan filtrera på dem.'))}</p>
        <div class="fpick">${FORMATS.map((f) => `<label class="fpick__opt fpick__opt--${f.id}"><input type="checkbox" name="formats" value="${f.id}" ${draft.formats.includes(f.id) ? 'checked' : ''}><span><strong>${esc(f.hostLabel)}</strong><span class="small">${esc(f.label)}: ${esc(f.desc)}</span></span></label>`).join('')}</div>
      </fieldset>

      <fieldset class="qblock"><legend class="sr-only">${esc(L('The problem', 'Ongelma', 'Problemet'))}</legend>
        <h3><span class="qblock__n">2</span><label for="n-title">${esc(L('Problem title', 'Ongelman otsikko', 'Problemets rubrik'))}</label></h3>
        <p class="hint" id="n-title-h">${esc(L('Name the problem, not the role or the product. For example: "Industrial edge IoT anomaly detection".', 'Nimeä ongelma, älä tehtävää tai tuotetta. Esimerkiksi: ”Teollisen reuna-IoT:n poikkeamien tunnistus”.', 'Namnge problemet, inte rollen eller produkten. Till exempel: ”Avvikelsedetektering i industriell edge-IoT”.'))}</p>
        <input type="text" id="n-title" name="title" aria-describedby="n-title-h" value="${esc(draft.title)}" maxlength="120" />
        <h3 style="margin-top:var(--s4)"><label for="n-summary">${esc(L('Problem summary', 'Ongelman tiivistelmä', 'Sammanfattning av problemet'))}</label></h3>
        <p class="hint" id="n-summary-h">${esc(L('One plain sentence that a newcomer would understand.', 'Yksi selkeä lause, jonka uusikin ymmärtäisi.', 'En enkel mening som en nykomling skulle förstå.'))}</p>
        <input type="text" id="n-summary" name="summary" aria-describedby="n-summary-h" value="${esc(draft.summary)}" maxlength="160" />
        <h3 style="margin-top:var(--s4)"><label for="n-context">${esc(L('Real-world context', 'Todellinen tausta', 'Verkligt sammanhang'))}</label></h3>
        <p class="hint" id="n-context-h">${esc(L('What is your team actually wrestling with? Who is affected, and what happens today?', 'Minkä kanssa tiiminne oikeasti painii? Keihin se vaikuttaa, ja mitä tapahtuu nyt?', 'Vad brottas ert team egentligen med? Vem påverkas, och vad händer i dag?'))}</p>
        <textarea id="n-context" name="context" aria-describedby="n-context-h" rows="4">${esc(draft.context)}</textarea>
      </fieldset>

      <fieldset class="qblock"><legend class="sr-only">${esc(L('What makes this tricky', 'Mikä tekee tästä hankalaa', 'Vad gör det här knepigt'))}</legend>
        <h3><span class="qblock__n">3</span><label for="n-tricky">${esc(L('What makes this tricky?', 'Mikä tästä tekee hankalaa?', 'Vad gör det här knepigt?'))}</label></h3>
        <p class="hint" id="n-tricky-h">${esc(L('The constraint only your team knows about. This is what makes generic, AI-written answers and pitches easy to spot.', 'Rajoite, josta vain tiiminne tietää. Sen ansiosta geneeriset, tekoälyn kirjoittamat vastaukset ja pitchit on helppo tunnistaa.', 'Begränsningen som bara ert team känner till. Det är den som gör generiska, AI-skrivna svar och pitchar lätta att känna igen.'))}</p>
        <textarea id="n-tricky" name="tricky" aria-describedby="n-tricky-h" rows="3">${esc(draft.tricky)}</textarea>
      </fieldset>

      <div class="qblock">
        <h3><span class="qblock__n">4</span><label for="esco-input">${esc(L('ESCO skills this touches', 'ESCO-taidot, joita tämä koskee', 'ESCO-färdigheter som berörs'))}</label></h3>
        <p class="hint" id="esco-h">${esc(L("Search the European skills taxonomy. Pick 2 to 6. Skills describe the problem; they're never used to rank people.", 'Hae eurooppalaisesta taitoluokituksesta. Valitse 2–6. Taidot kuvaavat ongelmaa; niitä ei koskaan käytetä ihmisten järjestämiseen.', 'Sök i den europeiska färdighetstaxonomin. Välj 2 till 6. Färdigheterna beskriver problemet; de används aldrig för att rangordna människor.'))}</p>
        <div class="picker">
          <div class="picker__chosen" id="esco-chosen" aria-label="${esc(L('Chosen skills', 'Valitut taidot', 'Valda färdigheter'))}"></div>
          <input type="text" id="esco-input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="esco-list" aria-describedby="esco-h" placeholder="${esc(L('Type a skill or domain, e.g. energy, research, circular', 'Kirjoita taito tai alue, esim. energia, tutkimus, kierto', 'Skriv en färdighet eller ett område, t.ex. energi, forskning, cirkulär'))}" autocomplete="off" />
          <ul class="picker__list" id="esco-list" role="listbox" aria-label="${esc(L('Matching ESCO skills', 'Sopivat ESCO-taidot', 'Matchande ESCO-färdigheter'))}" hidden></ul>
        </div>
      </div>

      <fieldset class="qblock"><legend class="sr-only">${esc(L('Language and timing', 'Kieli ja aikataulu', 'Språk och tidsplan'))}</legend>
        <h3><span class="qblock__n">5</span><label for="n-lang">${esc(L('Real language requirement', 'Todellinen kielivaatimus', 'Verkligt språkkrav'))}</label></h3>
        <p class="hint" id="n-lang-h">${esc(L('What does the work really need day to day? Over-asking for Finnish shuts out people and teams who would do well.', 'Mitä työ oikeasti vaatii arjessa? Tarpeeton suomen kielen vaatimus sulkee pois ihmisiä ja tiimejä, jotka pärjäisivät hyvin.', 'Vad kräver arbetet egentligen i vardagen? Att kräva finska i onödan stänger ute människor och team som skulle klara sig bra.'))}</p>
        <select id="n-lang" name="language" aria-describedby="n-lang-h">${LANG_PRESETS.map((l) => `<option value="${esc(l.t)}" ${draft.language === l.t ? 'selected' : ''}>${esc(tr({ en: l.t, fi: l.fi, sv: l.sv }))}</option>`).join('')}<option value="custom" ${draft.language === 'custom' ? 'selected' : ''}>${esc(L('Something else…', 'Jokin muu…', 'Något annat…'))}</option></select>
        <input type="text" id="n-lang-custom" name="languageCustom" placeholder="${esc(L('Describe the requirement', 'Kuvaa vaatimus', 'Beskriv kravet'))}" value="${esc(draft.languageCustom)}" ${draft.language === 'custom' ? '' : 'hidden'} style="margin-top:var(--s2)" aria-label="${esc(L('Custom language requirement', 'Oma kielivaatimus', 'Eget språkkrav'))}" />
        <div class="grid grid--2" style="margin-top:var(--s4)">
          <div class="field"><label for="n-ind">${esc(L('Sector or topic', 'Toimiala tai aihe', 'Bransch eller ämne'))}</label><select id="n-ind" name="industry"><option value="">${esc(L('Choose…', 'Valitse…', 'Välj…'))}</option>${INDUSTRIES.map((i) => `<option value="${esc(i)}" ${draft.industry === i ? 'selected' : ''}>${esc(sectorLabel(i))}</option>`).join('')}</select></div>
          <div class="field"><label for="n-deadline">${esc(L('Solvers share by', 'Ratkaisijat jakavat viimeistään', 'Lösarna delar senast'))}</label><input type="date" id="n-deadline" name="deadline" min="${minDate}" max="${maxDate}" value="${esc(draft.deadline)}" /><p class="hint">${esc(L("At least two days before the event, so there's time to arrange conversations.", 'Vähintään kaksi päivää ennen tapahtumaa, jotta keskustelut ehditään järjestää.', 'Minst två dagar före evenemanget, så att det finns tid att ordna samtal.'))}</p></div>
        </div>
      </fieldset>

      <p class="field-error" id="n-error" hidden></p>
      <div class="row row--end">
        <button type="submit" class="btn btn--primary">${esc(L('Publish challenge', 'Julkaise haaste', 'Publicera utmaningen'))}</button>
      </div>
    </form>
    <aside class="stack" style="position:sticky;top:var(--s4)">
      <div class="panel"><h3>${esc(L('Ready to publish when you have', 'Valmis julkaistavaksi, kun sinulla on', 'Redo att publicera när du har'))}</h3><ul class="checks" id="ready-list"></ul></div>
      <div class="panel panel--quiet small"><p><strong>${esc(L('Why problems, not job ads or RFPs?', 'Miksi ongelmia eikä työpaikkailmoituksia tai tarjouspyyntöjä?', 'Varför problem, inte jobbannonser eller anbudsförfrågningar?'))}</strong></p><p>${esc(L(
        "People show how they think about something real. You get better conversations, and talent, researchers and small teams who don't fit a CV template or a vendor list still get seen.",
        'Ihmiset näyttävät, miten he ajattelevat jotain todellista. Saat parempia keskusteluja, ja myös ne osaajat, tutkijat ja pienet tiimit, jotka eivät sovi CV-pohjaan tai toimittajalistaan, tulevat nähdyiksi.',
        'Människor visar hur de tänker kring något verkligt. Du får bättre samtal, och talanger, forskare och små team som inte passar en CV-mall eller en leverantörslista blir ändå sedda.',
      ))}</p></div>
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
    const done = L(', done', ', valmis', ', klart');
    const notYet = L(', not done yet', ', ei vielä valmis', ', inte klart ännu');
    readyList.innerHTML = readiness(draft)
      .map((r) => `<li class="check" style="color:${r.ok ? 'var(--pine-700)' : 'var(--text-3)'}">${r.ok ? ICON.check : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>'}<p style="color:var(--text)">${esc(r.t)}<span class="sr-only">${esc(r.ok ? done : notYet)}</span></p></li>`)
      .join('');
  };
  const paintChosen = () => {
    chosen.innerHTML = draft.tags.map((id) => `<button type="button" class="chip" data-remove="${id}" aria-label="${esc(L('Remove {skill}', 'Poista {skill}', 'Ta bort {skill}', { skill: skill(id).label }))}">${esc(skill(id).label)} <span aria-hidden="true">✕</span></button>`).join('');
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
    list.innerHTML = results.map((s, i) => `<li role="option" id="opt-${s.id}" data-id="${s.id}" aria-selected="${i === active}">${esc(s.label)}<span>${esc(domainLabel(s.domain))}</span></li>`).join('');
    input.setAttribute('aria-activedescendant', active >= 0 && results[active] ? `opt-${results[active].id}` : '');
    list.querySelectorAll('li').forEach((li) => li.addEventListener('mousedown', (e) => (e.preventDefault(), choose(li.dataset.id))));
  };
  const choose = (id) => {
    if (draft.tags.length >= 6) return toast(L('Pick at most 6 skills. Remove one to add another.', 'Valitse enintään 6 taitoa. Poista yksi lisätäksesi uuden.', 'Välj högst 6 färdigheter. Ta bort en för att lägga till en annan.'), 'warn');
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
      toast(L('Co-writing support requested. A Business Espoo advisor will review your draft within one working day.', 'Kirjoitusapua pyydetty. Business Espoon neuvoja tarkistaa luonnoksesi yhden työpäivän kuluessa.', 'Skrivstöd begärt. En rådgivare från Business Espoo granskar ditt utkast inom en arbetsdag.'));
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
      toast(L('Answer the first two questions, then try again.', 'Vastaa kahteen ensimmäiseen kysymykseen ja yritä uudelleen.', 'Svara på de två första frågorna och försök igen.'), 'warn');
      (b ? form.querySelector('#cw-today') : form.querySelector('#cw-bottleneck')).focus();
      return;
    }
    const sentence = (t) => {
      const s = t.charAt(0).toUpperCase() + t.slice(1);
      return /[.!?]$/.test(s) ? s : `${s}.`;
    };
    const formats = draft.formats.length ? draft.formats : ['open'];
    const context = [sentence(today), ...formats.map((f) => tr(FORMAT_LINE[f]))].join(' ');
    const filled = fillEmpty([
      ['n-title', L('[Name the problem in a few words]', '[Nimeä ongelma muutamalla sanalla]', '[Namnge problemet med några ord]')],
      ['n-summary', sentence(b)],
      ['n-context', context],
      ['n-tricky', tried ? sentence(tried) : L('The obvious fix of [X] does not work because [constraint].', 'Ilmeinen ratkaisu [X] ei toimi, koska [rajoite].', 'Den uppenbara lösningen [X] fungerar inte eftersom [begränsning].')],
    ]);
    syncDraft();
    paintReady();
    toast(
      filled
        ? L('Drafted {n} field(s) from your notes. Replace any [brackets], and fields you had written were kept.', 'Muistiinpanoistasi luonnosteltiin {n} kenttä(ä). Korvaa [hakasulkeet]; jo kirjoittamasi kentät säilyivät.', '{n} fält skapades från dina anteckningar. Ersätt eventuella [hakparenteser]; fält du redan hade skrivit behölls.', { n: filled })
        : L('Every field already has your text, so nothing was replaced. Use "Check my draft" for suggestions.', 'Jokaisessa kentässä on jo tekstiäsi, joten mitään ei korvattu. Käytä ”Tarkista luonnokseni” saadaksesi ehdotuksia.', 'Alla fält har redan din text, så inget ersattes. Använd ”Granska mitt utkast” för förslag.'),
    );
  });

  root.querySelector('#prefill').addEventListener('click', () => {
    syncDraft();
    const t = TEMPLATES[draft.industry] || TEMPLATES.default;
    const filled = fillEmpty([
      ['n-title', tr(t.title)],
      ['n-summary', tr(t.summary)],
      ['n-context', tr(t.context)],
      ['n-tricky', tr(t.tricky)],
    ]);
    t.tags.forEach((tag) => !draft.tags.includes(tag) && draft.tags.length < 6 && draft.tags.push(tag));
    syncDraft();
    paintChosen();
    paintReady();
    toast(
      filled
        ? L('Filled {n} empty field(s). Replace the [brackets] with your details.', 'Täytettiin {n} tyhjää kenttää. Korvaa [hakasulkeet] omilla tiedoillasi.', '{n} tomma fält fylldes i. Ersätt [hakparenteserna] med dina uppgifter.', { n: filled })
        : L('All text fields already have content. Use "Check my draft" for suggestions.', 'Kaikissa tekstikentissä on jo sisältöä. Käytä ”Tarkista luonnokseni” saadaksesi ehdotuksia.', 'Alla textfält har redan innehåll. Använd ”Granska mitt utkast” för förslag.'),
    );
  });

  root.querySelector('#refine').addEventListener('click', () => {
    syncDraft();
    const all = `${draft.title} ${draft.summary} ${draft.context} ${draft.tricky}`;
    const tips = [];
    if (!draft.formats.length) tips.push(L('Choose at least one collaboration format, so solvers know whether you are hiring, researching or piloting.', 'Valitse vähintään yksi yhteistyömuoto, jotta ratkaisijat tietävät, rekrytoitteko, tutkitteko vai pilotoitteko.', 'Välj minst en samarbetsform så att lösarna vet om ni rekryterar, forskar eller pilotar.'));
    if (/\[[^\]]+\]/.test(all)) tips.push(L('Replace the remaining [bracketed] parts with your real details.', 'Korvaa jäljellä olevat [hakasulkeissa olevat] kohdat todellisilla tiedoilla.', 'Ersätt de återstående delarna inom [hakparentes] med dina verkliga uppgifter.'));
    if (!/\d/.test(draft.context)) tips.push(L('Add one concrete number to the context: how many users, sites, hours or euros.', 'Lisää taustaan yksi konkreettinen luku: kuinka monta käyttäjää, kohdetta, tuntia tai euroa.', 'Lägg till en konkret siffra i sammanhanget: hur många användare, platser, timmar eller euro.'));
    if (/\b(rockstar|ninja|passionate|dynamic|fast-paced|intohimoinen|dynaaminen|passionerad|dynamisk)\b/i.test(all)) tips.push(L('Drop job-ad words like "passionate" or "fast-paced". Describe the problem instead.', 'Jätä pois työpaikkailmoitusten sanat kuten ”intohimoinen” tai ”dynaaminen”. Kuvaa ongelma sen sijaan.', 'Stryk annonsord som ”passionerad” eller ”dynamisk”. Beskriv problemet i stället.'));
    if (/\b(rfp|tender|procurement|vendor|requirements specification|tarjouspyyntö|hankinta|upphandling|anbud)\b/i.test(all)) tips.push(L('Describe the bottleneck, not procurement requirements. Pilot partners answer a real problem better than an RFP.', 'Kuvaa pullonkaula, älä hankintavaatimuksia. Pilottikumppanit vastaavat todelliseen ongelmaan paremmin kuin tarjouspyyntöön.', 'Beskriv flaskhalsen, inte upphandlingskrav. Pilotpartner svarar bättre på ett verkligt problem än på en anbudsförfrågan.'));
    if (draft.formats.includes('rnd') && !/\b(data|lab|publish|thesis|research|tutkimus|opinnäyte|julkai|forskning|examensarbete|publicera)/i.test(all)) tips.push(L('For R&D: say what data or lab access a researcher would get, and whether results can be published.', 'T&K:ta varten: kerro, millaista dataa tai laboratoriopääsyä tutkija saisi ja voiko tulokset julkaista.', 'För FoU: säg vilka data eller vilken labbtillgång en forskare skulle få, och om resultaten får publiceras.'));
    if (draft.formats.includes('pilot') && !/\b(week|month|site|scope|pilot|viikko|kuukau|kohde|laajuus|pilotti|vecka|månad|plats|omfattning)/i.test(all)) tips.push(L('For a pilot: say how big a first pilot could be, such as one site or six weeks.', 'Pilottia varten: kerro, kuinka laaja ensimmäinen pilotti voisi olla, esimerkiksi yksi kohde tai kuusi viikkoa.', 'För en pilot: säg hur stor en första pilot kan vara, till exempel en plats eller sex veckor.'));
    if (draft.tricky.trim().length < 40) tips.push(L('Say what you have already tried, or which constraint makes the obvious answer fail.', 'Kerro, mitä olette jo kokeilleet, tai mikä rajoite kaataa ilmeisen ratkaisun.', 'Säg vad ni redan har provat, eller vilken begränsning som gör att det uppenbara svaret inte fungerar.'));
    if (draft.language === 'Finnish required' || draft.language === 'Swedish required') tips.push(L('Check whether one language is needed from day one. "English or Finnish" widens the pool a lot.', 'Tarkista, tarvitaanko yhtä kieltä heti ensimmäisestä päivästä. ”Englanti tai suomi” laajentaa joukkoa paljon.', 'Kontrollera om ett visst språk behövs från första dagen. ”Engelska eller finska” breddar urvalet mycket.'));
    if (draft.tags.length < 2) tips.push(L('Add at least two ESCO skills so solvers can find the challenge.', 'Lisää vähintään kaksi ESCO-taitoa, jotta ratkaisijat löytävät haasteen.', 'Lägg till minst två ESCO-färdigheter så att lösarna hittar utmaningen.'));
    const head = tips.length ? L('Suggestions from the advisor checklist', 'Ehdotuksia neuvojan tarkistuslistalta', 'Förslag från rådgivarens checklista') : L('Looks clear and specific.', 'Näyttää selkeältä ja täsmälliseltä.', 'Ser tydligt och konkret ut.');
    root.querySelector('#refine-out').innerHTML = `<div class="callout" style="margin-top:var(--s3)"><strong>${esc(head)}</strong>${tips.length ? `<ul class="bullets">${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    syncDraft();
    const missing = readiness(draft).filter((r) => !r.ok);
    const err = root.querySelector('#n-error');
    err.setAttribute('tabindex', '-1');
    if (missing.length) {
      err.hidden = false;
      err.textContent = L('Before publishing, add: {items}.', 'Lisää ennen julkaisua: {items}.', 'Lägg till innan du publicerar: {items}.', { items: missing.map((m) => m.t.toLowerCase()).join('; ') });
      err.focus();
      return;
    }
    if (/\[[^\]]+\]/.test(draft.title + draft.summary + draft.context + draft.tricky)) {
      err.hidden = false;
      err.textContent = L('Some template [brackets] are still in the text. Replace them with your real details.', 'Tekstissä on vielä pohjan [hakasulkeita]. Korvaa ne todellisilla tiedoilla.', 'Det finns fortfarande [hakparenteser] från mallen i texten. Ersätt dem med dina verkliga uppgifter.');
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
    toast(
      L('Challenge published. Solvers can see it on the problem board now.', 'Haaste julkaistu. Ratkaisijat näkevät sen nyt haastetaululla.', 'Utmaningen är publicerad. Lösarna kan se den på utmaningstavlan nu.'),
      'ok',
      { label: L('See it as talent', 'Katso osaajana', 'Se det som talang'), run: () => showTalentSide(null, `challenge/${newId}`) },
    );
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
    <div class="section__head"><h1 style="margin:0">${esc(YOURS())}</h1><a class="btn btn--primary btn--sm" href="#/host/new">${esc(POST())}</a></div>
    ${chs.length ? `<ul class="list">${chs
      .map(
        (ch) => `<li><div class="list__main">${formatBadges(ch.formats)}<h4 style="margin-top:var(--s2)">${esc(ch.title)}</h4><p>${deadlineText(ch.deadline)}</p><div style="margin-top:var(--s2)">${escoTags(ch.escoTags)}</div></div>
        ${langBadge(ch.language)}<div class="list__actions"><a class="btn btn--sm btn--ghost" href="#/host/feed">${esc(L('{n} shared', '{n} jaettu', '{n} delade', { n: count(ch.id) }))}<span class="sr-only"> ${esc(L('on {title}', 'haasteeseen {title}', 'om {title}', { title: ch.title }))}</span></a></div></li>`,
      )
      .join('')}</ul>` : `<div class="empty"><h3>${esc(L('No challenges yet', 'Ei vielä haasteita', 'Inga utmaningar ännu'))}</h3><p>${esc(L('Post your first challenge. It takes about ten minutes.', 'Julkaise ensimmäinen haasteesi. Siihen menee noin kymmenen minuuttia.', 'Publicera din första utmaning. Det tar ungefär tio minuter.'))}</p></div>`}`;
}
