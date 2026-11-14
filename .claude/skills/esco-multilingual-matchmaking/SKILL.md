---
name: esco-multilingual-matchmaking
description: Manages ESCO skill taxonomy tagging, multilingual challenge submissions (EN/FI/SV+), quota-capped meeting flows, and Brella/Tavata/.ics exports.
---

# ESCO tagging, multilingual submissions, meetings and exports

## ESCO taxonomy (`js/esco.js`)

- Skills come from a curated subset of ESCO (European Skills, Competences, Qualifications
  and Occupations, v1.2). Each entry: `{ id, label, domain }`. `id` is a stable slug; labels
  follow ESCO preferred terms where one exists.
- Domains to keep covered: Software engineering, Green tech & energy, AI & data,
  Hardware & IoT, Service design, B2B operations.
- Challenges are tagged by companies (3–6 tags). Participants may *self-declare* which of the
  challenge's tags they draw on. Tags are never inferred from text and never used to rank.
- The tag picker must be searchable by label and domain and fully keyboard operable.

## Multilingual submissions

- Supported submission languages: English (`en`), Finnish (`fi`), Swedish (`sv`), plus
  "Other" with a free-text language name.
- Every challenge states a real language requirement (e.g. "English is fine",
  "Finnish or English", "Swedish & English"). Show it as a badge everywhere the challenge appears.
- Seed submissions carry pre-written translations in `translations.{en,fi}` so the
  EU machine-translation toggle works offline. New submissions written in the demo have no
  translation; the UI states that a live EU-hosted service would provide it.
- Translations always render beside the original (see the eu-ai-act-compliance skill).

## Meeting flow and quota (`js/store.js`)

States for `meeting.partyStatus`:
- `requested`: participant asked the company (counts toward participant quota)
- `invited`: recruiter invited the participant
- `accepted`: the counterparty said yes; identity can now be revealed
- `declined` / `cancelled`

`meeting.organizerStatus`: `pending` | `approved` | `declined`. A meeting is **confirmed**
(exportable, on the schedule) only when `partyStatus === 'accepted'` and
`organizerStatus === 'approved'`.

**Participant request cap: 5.** `activeRequestCount(participantId)` counts participant-initiated
meetings that are not declined or cancelled. Block new requests at 5, show the counter
`X / 5 meeting requests used` as a visual bar, and let participants cancel a request to free a slot.
A slot can hold only one non-declined meeting.

## Exports (`js/exports.js`)

- `.ics`: RFC 5545 VCALENDAR, one VEVENT per confirmed meeting, CRLF line endings, escaped
  text (`\\`, `;`, `,`, newlines), UTC `DTSTART`/`DTEND`, stable `UID`, `DTSTAMP`.
- Brella CSV and Tavata JSON: generic schedule columns (meeting id, start, end, title,
  location, company, participant). Revealed names appear only for confirmed (mutual) meetings;
  otherwise the pseudonym. The exact import schemas of Brella and Tavata are not public in
  this repo; keep column names documented in `exports.js` and adjust when real specs arrive.
- All exports use `downloadFile(name, mime, text)`; never send data to a network endpoint.
