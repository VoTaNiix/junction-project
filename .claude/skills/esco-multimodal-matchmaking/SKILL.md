---
name: esco-multimodal-matchmaking
description: Manages ESCO skill taxonomy tagging, Collaboration Format modes (Hiring, R&D, Pilot/B2B, Open), multilingual submissions (EN/FI/SV+), 5-request caps, and Brella/Tavata/.ics exports.
---

# ESCO tagging, collaboration formats, multilingual submissions, meetings and exports

## Collaboration formats (`js/formats.js`)

Every challenge combines ESCO tags with **one or more** collaboration formats. The four
format names are product terms and keep their capitalisation everywhere:

| id | Name | Means |
|---|---|---|
| `hiring` | Talent & Hiring | Full-time, part-time or internship roles |
| `rnd` | R&D & Co-Creation | Academic research, thesis work, joint R&D |
| `pilot` | Pilot & Project | B2B collaboration, startup pilot, specialist consulting |
| `open` | Open Format | "We have this problem: open to hiring, partnering or piloting" |

- `challenge.formats` is a non-empty array of these ids. Show them as colour-coded badges
  (with icon and text) on every challenge card, and offer them as a filter on the Problem Board.
- Solvers self-declare an **intent** on each submission (`submission.intent`):
  `talent` (Individual Talent / Career Opportunity), `research` (Researcher / Academic /
  Thesis Collaboration), `partner` (Project / Pilot / Solution Partner) or `open`
  (Open to Discussing Best Fit). An intent is offered only if it fits the challenge's formats;
  `open` always fits, and an Open Format challenge accepts every intent.
- Each meeting records the `format` it is about, chosen by the person who requests or invites.
  Organizer insights, exports and value reports break counts down by format. Never by person.

## ESCO taxonomy (`js/esco.js`)

- Skills come from a curated subset of ESCO (European Skills, Competences, Qualifications
  and Occupations, v1.2). Each entry: `{ id, label, domain }`. `id` is a stable slug; labels
  follow ESCO preferred terms where one exists.
- Domains to keep covered: Software engineering, Green tech & energy, AI & data,
  Hardware & IoT, Service design, Built environment & circularity, Research & innovation,
  B2B operations.
- Challenges are tagged by hosts (2–6 tags). Solvers may *self-declare* which of the
  challenge's tags they draw on. Tags are never inferred from text and never used to rank.
- The tag picker must be searchable by label and domain and fully keyboard operable.

## Multilingual submissions

- Supported submission languages: English (`en`), Finnish (`fi`), Swedish (`sv`), plus
  "Other" with a free-text language name.
- Every challenge states a real language requirement as text (`challenge.language`, e.g.
  "English is fine", "English or Finnish", "Finnish, Swedish, or English") and as the list of
  working languages it accepts (`challenge.languages`, e.g. `['en','fi']`). Show the text as a
  badge everywhere the challenge appears; filter on the list.
- Seed submissions carry pre-written translations in `translations.{en,fi,sv}` so the
  EU machine-translation toggle works offline. New submissions written in the demo have no
  translation; the UI states that a live EU-hosted service would provide it.
- Translations always render beside the original (see the eu-ai-act-and-fairness skill).

## Meeting flow and quota (`js/store.js`)

States for `meeting.partyStatus`:
- `requested`: solver asked the host (counts toward the solver's quota)
- `invited`: host invited the solver
- `accepted`: the counterparty said yes; identity can now be revealed
- `declined` / `cancelled`

`meeting.initiator` is `participant` or `host`. `meeting.organizerStatus`: `pending` |
`approved` | `declined`. A meeting is **confirmed** (exportable, on the schedule) only when
`partyStatus === 'accepted'` and `organizerStatus === 'approved'`.

**Solver request cap: 5.** `activeRequestCount(participantId)` counts solver-initiated
meetings that are not declined or cancelled. Block new requests at 5, show the counter
`X / 5 meeting requests used` as a visual bar, and let solvers cancel a request to free a slot.
A slot can hold only one non-declined meeting.

## Exports (`js/exports.js`)

- `.ics`: RFC 5545 VCALENDAR, one VEVENT per confirmed meeting, CRLF line endings, escaped
  text (`\\`, `;`, `,`, newlines), UTC `DTSTART`/`DTEND`, stable `UID`, `DTSTAMP`, and the
  collaboration format in `DESCRIPTION` and `CATEGORIES`.
- Brella CSV and Tavata JSON: generic schedule columns (meeting id, start, end, title,
  location, host company, solver, challenge, collaboration format). Revealed names appear only
  for mutual meetings; otherwise the pseudonym. The exact import schemas of Brella and Tavata
  are not public in this repo; keep column names documented in `exports.js` and adjust when
  real specs arrive.
- All exports use `downloadFile(name, mime, text)`; never send data to a network endpoint.
