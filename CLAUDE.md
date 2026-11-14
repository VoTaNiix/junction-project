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
| Participant / solver, `Solver #ESP-4821` | job seeker, candidate | Talent, researcher, specialist, startup or project partner |
| Challenge host, Host review dashboard | recruiter, recruiter dashboard | Hiring managers, R&D leads, innovation partners |
| Event organizer | | City of Espoo / Business Espoo event team |
| Privacy & EU AI Act inspector | | Compliance and data lifecycle view |

Collaboration formats (product terms, keep the capitalisation): **Talent & Hiring**,
**R&D & Co-Creation**, **Pilot & Project**, **Open Format**. Defined in `js/formats.js`.

## Technical stack

- Zero-build: static HTML5, CSS3 and vanilla JavaScript ES modules. No framework, no bundler,
  no npm dependencies at runtime.
- State lives in `localStorage` under the key `skillink.v2` (schema `version: 2`; older saved
  state is replaced by the seed). First load seeds rich synthetic data from `js/seed.js`.
  **Reset demo data** in the header restores the seed instantly.
- Google Fonts (Schibsted Grotesk, Atkinson Hyperlegible Next) with system fallbacks; the app
  works offline without them.
- ES modules require HTTP, not `file://`. Serve the folder root:

  ```bash
  py -m http.server 5173
  ```

  then open http://localhost:5173.

## File map

```
index.html            app shell: header, role switcher, live region, <main>
css/tokens.css        design tokens (colour incl. format colours, type, spacing)
css/app.css           layout and components, print styles
js/app.js             hash router (#/recruiter/... redirects to #/host/...), role switcher
js/store.js           state, persistence, reset, meeting rules, identity reveal, purge, audit
js/seed.js            synthetic Espoo ecosystem: hosts, six multi-format challenges, solvers,
                      submissions with intents and translations, slots, meetings, feedback
js/formats.js         collaboration formats, solver intents, language helpers
js/esco.js            curated ESCO skill subset
js/exports.js         .ics, Brella CSV, Tavata JSON, downloadFile()
js/ui.js              html escaping, toasts, dialogs, tabs, formatting
js/views/shared.js    shared renderers: challenge card, format badges, status pills,
                      translation, quota bar
js/views/participant.js  Problem Board, solver workspace, meetings, ecosystem support hub
js/views/host.js         host review dashboard, meetings, 10-minute challenge template
js/views/organizer.js    approval queue, exports, insights, opt-in, value reports
js/views/privacy.js      Annex III and fairness centre, consent, data inventory, audit, purge
js/views/guide.js        step-by-step guide per persona (#/guide/...), "Try it" deep links
```

The guide's steps reference real seed data and exact UI labels. When you rename a button,
change seed data or move a screen, update the matching step in `js/views/guide.js`.

## Role-switcher architecture

The header holds a segmented control with four live perspectives. Each is a top-level route
(`#/<role>/<tab>`), and switching never loses state because everything reads from the store.

1. **Participant / solver** (talent, researcher, specialist, startup or project partner) — `#/participant/...`
   Problem Board with format, ESCO and language filters, "Show your thinking" workspace with
   solver intent, meeting requests (5 cap), dual-track ecosystem support hub.
2. **Challenge host** — `#/host/...`
   Host review dashboard (pseudonymous, intent badges, translation toggle), invites and
   incoming requests, 10-minute challenge template with format selector and the
   Business Espoo co-writing assistant. A company picker selects which host you act as.
3. **Event organizer** (City of Espoo / Business Espoo) — `#/organizer/...`
   Manual approval queue across hiring and matchmaking tracks, calendar/platform export,
   aggregate insights by format, post-event opt-in simulator with the 40% KPI, company value reports.
4. **Privacy & EU AI Act inspector** — `#/privacy/...`
   Annex III and matchmaking fairness explanation, purpose-bound consent, live data inventory
   and forbidden-field audit, 30-day auto-deletion simulation.

## Conventions

- Views are pure functions `render(state, tab, arg) -> html string` plus a `bind(root, ctx)`
  step for events. Mutate state only through functions exported from `store.js`, which persist
  and re-render.
- Always escape user/seed text with `esc()` from `ui.js`.
- Identity reveal only through `canRevealIdentity()`; ordering of people-content is
  chronological or by challenge, and the UI says so. Intents are shown, never sorted or filtered on.
- Keep copy in sentence case and plain language (format names excepted).
