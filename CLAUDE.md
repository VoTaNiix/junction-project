# Skillink — Less Résumé. More Real You.

## Mission

Match people to a company's problem, not to a static profile or CV.

Skillink is a pre-event recruitment matchmaking prototype for City of Espoo events. Companies
post a real problem they are working on; participants show how they would think about it; both
sides meet for a real conversation. It is designed to sit alongside **Brella** (event networking)
and **Tavata** (meeting scheduling): Skillink arranges *who* should talk and *why*, then exports
the agreed meetings to those tools.

## Always-on project skills

Read and follow these on every task in this repo:

- `.claude/skills/eu-ai-act-compliance/` — no scoring/ranking/profiling, pseudonymity,
  no demographic fields, side-by-side translation only, 30-day purge.
- `.claude/skills/esco-multilingual-matchmaking/` — ESCO tags, EN/FI/SV submissions,
  5-request cap, meeting states, `.ics` / Brella / Tavata exports.
- `.claude/skills/espoo-nordic-ui/` — palette, type, accessibility, copy.
- `.claude/skills/frontend-design/` and `.claude/skills/web-design-guidelines/` (installed
  from anthropics/skills and vercel-labs/agent-skills) for design reviews.

## Technical stack

- Zero-build: static HTML5, CSS3 and vanilla JavaScript ES modules. No framework, no bundler,
  no npm dependencies at runtime.
- State lives in `localStorage` under the key `skillink.v1`. First load seeds rich synthetic data
  from `js/seed.js`. **Reset demo data** in the header restores the seed instantly.
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
css/tokens.css        design tokens (colour, type, spacing)
css/app.css           layout and components, print styles
js/app.js             hash router, role switcher, header actions
js/store.js           state, persistence, reset, meeting rules, identity reveal, purge, audit
js/seed.js            synthetic Espoo ecosystem: companies, challenges, participants,
                      submissions with translations, slots, meetings, feedback
js/esco.js            curated ESCO skill subset
js/exports.js         .ics, Brella CSV, Tavata JSON, value report, downloadFile()
js/ui.js              html escaping, toasts, dialogs, tabs, formatting
js/views/shared.js    shared renderers: challenge card, status pills, translation, quota bar
js/views/participant.js  Problem Board, workspace, meetings, international support
js/views/recruiter.js    review feed, meetings, 10-minute challenge template
js/views/organizer.js    approval queue, exports, insights, opt-in, value reports
js/views/privacy.js      Annex III centre, consent, data inventory, audit, purge
js/views/guide.js        step-by-step guide per persona (#/guide/...), "Try it" deep links
```

The guide's steps reference real seed data and exact UI labels. When you rename a button,
change seed data or move a screen, update the matching step in `js/views/guide.js`.

## Role-switcher architecture

The header holds a segmented control with four live perspectives. Each is a top-level route
(`#/<role>/<tab>`), and switching never loses state because everything reads from the store.

1. **Participant** (job seeker / international talent) — `#/participant/...`
   Problem Board, "Show your thinking" workspace, meeting requests (5 cap), support hub.
2. **Company recruiter** — `#/recruiter/...`
   Pseudonymous review feed, translation toggle, invites and incoming requests,
   10-minute challenge template. A company picker selects which employer you act as.
3. **City of Espoo event organizer** — `#/organizer/...`
   Manual approval queue, calendar/platform export, aggregate insights, post-event opt-in
   simulator with the 40% KPI, company value reports.
4. **Privacy & EU AI Act inspector** — `#/privacy/...`
   Annex III explanation, purpose-bound consent, live data inventory and forbidden-field
   audit, 30-day auto-deletion simulation.

## Conventions

- Views are pure functions `render(state, ctx) -> html string` plus a `bind(root)` step for events.
  Mutate state only through functions exported from `store.js`, which persist and re-render.
- Always escape user/seed text with `esc()` from `ui.js`.
- Identity reveal only through `canRevealIdentity()`; ordering of people-content is
  chronological or by challenge, and the UI says so.
- Keep copy in sentence case and plain language.
