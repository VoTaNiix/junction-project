# Skillink — Less Résumé. Less Pitch Deck. More Real You.

> Beyond CVs and cold pitches made with a single prompt, Skillink connects talent,
> researchers and innovators with companies through real-world challenges.

## Mission

Match people to a company's problem, not to a static profile, a CV or a pitch deck.

Skillink is a pre-event matchmaking prototype for City of Espoo and Business Espoo events. It
serves two kinds of event equally, on the same rules:

- **Recruitment events** (talent, hiring, career fairs).
- **Matchmaking events** (startup–corporate pilots, R&D and thesis co-creation, specialist
  project collaborations).

Challenge hosts post a real problem they are working on and say which collaboration formats
they are open to. Solvers show how they would think about it. Both sides meet for a real
conversation. Skillink sits alongside **Brella** (event networking) and **Tavata** (meeting
scheduling): it arranges *who* should talk and *why*, then exports the agreed meetings to
those tools.

### The problem we frame in the product

- **Recruiting events:** employers drown in AI-polished CVs, and unclear job descriptions
  fail to capture practical capability.
- **Matchmaking events:** companies drown in generic AI-written sales pitches and vague
  networking bios that hide real technical or problem-solving fit.
- **The AI echo chamber:** job seekers and vendors use AI to generate polished outreach, and
  companies use AI to screen it out. Skillink replaces both with a real conversation that
  starts from a concrete problem.

## Always-on project skills

Read and follow these on every task in this repo:

- `.claude/skills/eu-ai-act-and-fairness/`: no scoring/ranking/profiling of people or teams,
  pseudonymity against demographic and pedigree bias, no demographic or pedigree fields,
  side-by-side translation only, 30-day purge.
- `.claude/skills/esco-multimodal-matchmaking/`: ESCO tags, the four collaboration formats,
  solver intents, EN/FI/SV submissions, 5-request cap, meeting states, `.ics` / Brella / Tavata exports.
- `.claude/skills/espoo-nordic-ui/`: palette, format badges, type, accessibility, copy.
- `.claude/skills/frontend-design/` and `.claude/skills/web-design-guidelines/` (installed
  from anthropics/skills and vercel-labs/agent-skills) for design reviews.

## Terminology

| Use | Not | Who |
|---|---|---|
| **Talent** side; participant / solver, `Solver #ESP-4821` | job seeker, candidate | Talent, researcher, specialist, startup or project partner |
| **Employer** side; challenge host, Host review dashboard | recruiter, recruiter dashboard | Hiring managers, R&D leads, innovation partners |
| **Event team** (event organizer) | | City of Espoo / Business Espoo event team |

"Talent" and "Employer" are the labels on the header switch (user feedback: the two sides must
be obvious). Inside the views, keep "solver" and "host": they also cover researchers, startups
and pilot partners.

Collaboration formats (product terms, keep the capitalisation): **Talent & Hiring**,
**R&D & Co-Creation**, **Pilot & Project**, **Open Format**. Defined in `js/formats.js`.

## Technical stack

- **Backend: Scala 2.13 + sbt** (IntelliJ IDEA project), `ujson` the only dependency. A JDK
  `HttpServer` on 127.0.0.1:8080 serves the frontend from this folder and owns the state:
  `GET /api/state`, `POST /api/action` (one named action per change). Rules live in
  `src/main/scala/skillink/Rules.scala`; state is saved atomically to `data/state.json`
  (not committed). Run `skillink.SkillinkServer` from IntelliJ, or `sbt run`.
- **Frontend: zero-build** static HTML5, CSS3 and vanilla JavaScript ES modules. No framework,
  no bundler, no npm dependencies at runtime.
- `js/store.js` applies each change locally at once, then sends it to the server and adopts the
  server's state (the server wins on any disagreement). Without the server (any static host,
  e.g. `py -m http.server 5173`) it falls back to `localStorage` key `skillink.v2`.
- The seed comes from `js/seed.js`; the server reads `src/main/resources/seed.json`, generated
  by `node scripts/export-seed.mjs`. Regenerate it whenever `js/seed.js` changes.
  **Reset demo data** in the header restores the seed in both modes.
- Google Fonts (Schibsted Grotesk, Atkinson Hyperlegible Next) with system fallbacks; the app
  works offline without them.

## File map

```
index.html            app shell: header, role switcher, live region, <main>
css/tokens.css        design tokens (Espoo palette incl. format colours, type, spacing)
css/app.css           layout and components, print styles (original Skillink look; the
                      rejected Approach 2 redesign lives on in ../Junction_Project_Blue)
js/app.js             hash router (#/recruiter/... → #/host/..., #/privacy/... → board),
                      switches to the page's account, header account menu
js/i18n.js            interface language (English, Suomi, Svenska): tr({ en, fi, sv }), header
                      menu, per-viewer choice in localStorage key skillink.lang
js/accounts.js        the three demo accounts (Sam Virtanen, Lumivirta Energy, Event team), active account,
                      one-click switching, profile pictures
js/sides.js           switchAndGo(), data-switch-to links, "Switch to …" message actions
js/store.js           state, server sync (or localStorage offline), meeting rules, identity
                      reveal, purge, audit; every mutation sends a named action to the server
build.sbt, project/   sbt build (Scala 2.13.18, sbt 1.13.1, ujson)
src/main/scala/skillink/
  SkillinkServer.scala      startup, port (-Dskillink.port), seed loading
  SkillinkHttpHandler.scala /api/state, /api/action (JSON only, same-origin), static files
  Rules.scala               every action and its validation, forbidden-field guardrail
  Aggregates.scala          anonymous counts kept by purge and consent withdrawal
  StateStore.scala          the one shared state, atomic saves to data/state.json
  StaticFiles.scala         serves index.html, css/, js/, assets/ only
src/main/resources/seed.json  server seed, generated by scripts/export-seed.mjs
data/                 saved demo state (state.json, git-ignored)
js/seed.js            synthetic Espoo ecosystem: hosts, six multi-format challenges, solvers,
                      submissions with intents and translations, slots, meetings, feedback
js/formats.js         collaboration formats, solver intents, language helpers
js/esco.js            curated ESCO skill subset
js/exports.js         .ics, Brella CSV, Tavata JSON, downloadFile()
js/ui.js              html escaping, toasts, dialogs, tabs, formatting
js/views/shared.js    shared renderers: challenge preview card, full challenge card, format
                      badges, status pills, consent notice, translation, quota bar
js/views/participant.js  Problem board (preview cards), challenge page, solver workspace
                         (incl. consent withdrawal), meetings, ecosystem support hub
js/views/host.js         host review dashboard, meetings, 10-minute challenge template
js/views/organizer.js    approval queue, exports, insights, opt-in, value reports
js/views/guide.js        step-by-step guide per side (#/guide/...), "Try it" deep links
```

The guide's steps reference real seed data and exact UI labels, in all three languages (English in
`GUIDES`, Finnish and Swedish in `TEXT`, same step order). When you rename a button, change seed
data or move a screen, update the matching step in `js/views/guide.js` in every language.

## Accounts and sides

The header shows the active account with a Google-style account menu: all three demo accounts
count as logged in, and clicking another one switches in one click. There is no sign-in page and no
password (`js/accounts.js`).

| Account | Who | Opens |
|---|---|---|
| Sam Virtanen | job seeker (Solver #ESP-4821 to hosts) | Talent side, `#/participant/...` |
| Lumivirta Energy | company with a challenge, contact Katja Salmi | Employer side, `#/host/...` |
| Event team | City of Espoo / Business Espoo organizers | Event team pages, `#/organizer/...` |

- The active account is per viewer (`localStorage` key `skillink.account`), never in shared state.
- Profile pictures live in `accounts.js` only: shared state must never hold photos or avatars,
  and hosts still see "Solver #ESP-4821" until both sides agree to meet.
- **Each page belongs to one account** (`accountForRole`). Another account opening it gets a
  "This page is for …" screen with a switch button, never the page. The guide is open to all.
- **Each account only sees the buttons it can use**: no header or in-page links to another
  account's pages. Switching is explicit: the account menu, a "Switch to …" message action, or
  a link with `data-switch-to="<account id>"` (`switchAndGo` in `js/sides.js`).
- **The server checks the account**: every action carries `account` (talent, employer,
  eventteam), and `Rules.authorize` refuses (403) actions that account's pages don't offer,
  employer actions for another company, answering your own request, and the other side's
  post-event choice. A new action needs an entry in `Rules.AccountActions`.
- Seeing the other side is a core demo function: after a cross-side action (share, request,
  answer, invite, publish) the message offers **Switch to …** when the other party is a demo
  account (`js/sides.js`). Only Lumivirta Energy has an account; the other five hosts are there
  for solvers to browse, and the Employer view has no company picker.

1. **Talent** (Sam Virtanen) — `#/participant/...`
   Problem board of short preview cards (format chips, search, More filters for ESCO skill and
   language), challenge page `#/participant/challenge/:id` with full details and actions,
   "Show your thinking" editor with solver intent, meeting requests (5 cap), workspace with
   consent notice and consent withdrawal, dual-track ecosystem support hub.
2. **Employer** (Lumivirta Energy) — `#/host/...`
   Host review dashboard (pseudonymous, intent badges, translation toggle), invites and
   incoming requests, 10-minute challenge template with format selector and the
   Business Espoo co-writing assistant.
3. **Event team** (City of Espoo / Business Espoo) — `#/organizer/...`, its own account.
   Manual approval queue across hiring and matchmaking tracks, calendar/platform export,
   aggregate insights by format, post-event opt-in simulator with the 40% KPI, company value reports.

The Privacy & EU AI Act inspector view was removed after user feedback (too much detail for
the demo). The guardrails still run: forbidden-field checks in `Rules.scala`, pseudonymity,
no ranking, side-by-side translation, consent withdrawal, and the 30-day purge
(`purgePersonalData` action, kept in the store and the API).

## Conventions

- Views are pure functions `render(state, tab, arg) -> html string` plus a `bind(root, ctx)`
  step for events. Mutate state only through the named functions exported from `store.js`
  (there is no public `update()`), which re-render and send the change to the server.
- A new or changed mutation needs three edits: the function in `js/store.js` (with its
  `send({ type, ... })`), the matching case in `Rules.scala`, and the same validation in both.
  The server is authoritative; never trust the browser's copy for a rule.
- Always escape user/seed text with `esc()` from `ui.js`.
- Identity reveal only through `canRevealIdentity()`; ordering of people-content is
  chronological or by challenge, and the UI says so. Intents are shown, never sorted or filtered on.
- Keep copy in sentence case and plain language (format names excepted).
- **Every interface text is trilingual**: write it as `tr({ en, fi, sv })` (or the views' `L(en, fi, sv)`)
  from `js/i18n.js`, and escape the result with `esc()`. Never hard-code English in a view.
  Not translated: what people wrote (challenges, answers, names), the four format names, the
  slogan, and export files (.ics, Brella CSV, Tavata JSON) and Scala server error messages.
