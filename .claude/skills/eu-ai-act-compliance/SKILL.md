---
name: eu-ai-act-compliance
description: Enforces EU AI Act Annex III high-risk recruitment guardrails, pseudonymity, zero profiling, and 30-day data expiry across all Skillink UI and state logic.
---

# EU AI Act compliance guardrails for Skillink

Skillink is used in recruitment. Under the EU AI Act, Annex III point 4(a), AI systems
used "for the recruitment or selection of natural persons, in particular to place targeted
job advertisements, to analyse and filter job applications, and to evaluate candidates"
are **high-risk**. Skillink stays outside that category by keeping algorithms out of every
decision about people. Apply these rules to every change in this repository: UI, state,
seed data, exports and copy.

## Rule 1: zero algorithmic assessment

Never add any of the following, anywhere, including "just for the demo":

- AI or heuristic scoring of candidates or submissions
- match percentages, fit scores, compatibility badges, "top candidate" markers
- auto-ranking, sorting by quality, length or any derived score
- auto-filtering or auto-rejecting submissions
- candidate profiling: inferred traits, seniority guesses, sentiment, personality

Permitted orderings for submissions: chronological (submitted time) or grouped by
challenge. Every list of people-content must say how it is ordered.

Permitted keyword grouping: only over aggregate *question text* for company value reports
(themes of what candidates asked), never attached to or ranking a person.

## Rule 2: pseudonymity by default

- Recruiters and organizers see participants only as a pseudonym, e.g. `Participant #ESP-4821`.
- Name and contact details are revealed **only** when a meeting has reached mutual status:
  the candidate accepted a recruiter's invite, or the recruiter accepted the candidate's
  request. Use the single helper `canRevealIdentity(meeting)` in `js/store.js`; never
  re-implement the check in a view.
- Post-event contact exchange happens only when both sides privately chose "Let's continue".
  Never reveal which side chose "Not now".

## Rule 3: zero demographic collection

Never add form fields, state keys, seed data or export columns for: nationality, ethnic
background, age or date of birth, gender, photo or avatar uploads, marital status, religion,
disability, or CV/résumé upload. The Privacy Inspector view runs a live audit
(`FORBIDDEN_KEYS` in `js/store.js`) over the whole state; keep that list complete and keep
the audit passing.

International talent support links (Work in Finland, Espoo International Services) are
offered to everyone and never depend on, or ask for, background.

## Rule 4: substance over style

- Bullet points and short paragraphs are equally valid; the editor offers both.
- Never display, score, or highlight word count, length, grammar or polish to recruiters.
- No "quality" indicators on submissions.

## Rule 5: EU-hosted machine translation only

- The only permitted AI feature is optional machine translation, badged
  `[EU-Hosted Machine Translation]` (in this prototype: `EU-Hosted Machine Translation (Simulated)`).
- It is off by default and toggled by the reader.
- Translated text **always renders side by side with the original**, never replacing it.
  Use `renderTranslation()` in `js/views/shared.js`.
- If no translation exists, say so plainly; never fabricate one silently.

## Rule 6: purpose-bound consent and 30-day deletion

- Consent is purpose-bound: data is used only to arrange conversations for this one event.
  Show the consent notice before a participant submits.
- 30 days after the event, all personal data is purged: participant identities, submissions,
  drafts, bookmarks, meetings, feedback, consents, recruiter contacts and the decision log.
  Anonymous aggregate statistics (counts per challenge, ESCO supply, opt-in rate, per-company
  report figures) are computed **before** deletion inside `purgePersonalData()` in `js/store.js`
  and kept in `state.purge.aggregates`. Consent withdrawal uses `deleteParticipantData()`,
  which follows the same rule for one person.
- The Privacy Inspector view must keep a working "Simulate 30-day post-event auto-deletion"
  control that proves this end to end.

## Review checklist before finishing any task

1. Did anything introduce ordering other than chronological / by challenge? Remove it.
2. Can any view show a name or email without `canRevealIdentity()`? Fix it.
3. Did any new field touch a forbidden category? Remove it and extend `FORBIDDEN_KEYS`.
4. Does any translation replace the original? Make it side by side.
5. Does the purge still delete every new personal-data key you added?
