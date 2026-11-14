---
name: eu-ai-act-and-fairness
description: Enforces EU AI Act Annex III compliance for talent recruitment AND anti-prestige/anti-bias fairness for B2B and R&D matchmaking, including pseudonymity, zero profiling, and 30-day data expiry.
---

# EU AI Act and fairness guardrails for Skillink

Skillink runs two kinds of City of Espoo / Business Espoo events on the same rules:

- **Recruitment events** (talent, hiring, career fairs). Under the EU AI Act, Annex III
  point 4(a), AI systems used "for the recruitment or selection of natural persons, in
  particular to place targeted job advertisements, to analyse and filter job applications,
  and to evaluate candidates" are **high-risk**.
- **Matchmaking events** (startup–corporate pilots, R&D and thesis co-creation, specialist
  projects). These are not Annex III by default, but the same automated judgements would
  reward pedigree: famous logos, big teams and slick decks over a solo specialist, an
  international newcomer or a five-person spinout with the better idea.

Skillink stays out of the high-risk category, and stays fair in matchmaking, by keeping
algorithms out of every decision about people and teams. Apply these rules to every change
in this repository: UI, state, seed data, exports and copy.

## Rule 1: zero algorithmic assessment

Never add any of the following, anywhere, including "just for the demo":

- AI or heuristic scoring of solvers, teams or submissions
- match percentages, fit scores, compatibility badges, "top candidate" or "best partner" markers
- auto-ranking, sorting by quality, length, company size or any derived score
- auto-filtering or auto-rejecting submissions
- profiling of individuals or teams: inferred traits, seniority guesses, sentiment,
  personality, inferred company size or funding stage

Permitted orderings for submissions: chronological (shared time) or grouped by challenge.
Every list of people-content must say how it is ordered. A solver's self-declared intent
(talent, researcher, partner, open) is shown as a badge; it is never used to sort or hide
submissions in the host view.

Permitted keyword grouping: only over aggregate *question text* for company value reports
(themes of what solvers asked), never attached to or ranking a person.

## Rule 2: pseudonymity by default (anti-bias and anti-prestige)

- Hosts and organizers see solvers only as a pseudonym, e.g. `Solver #ESP-4821`. This hides
  demographic signals in hiring and pedigree signals in matchmaking: no startup name, logo,
  university, employer or funding stage before a meeting is agreed.
- Name and contact details are revealed **only** when a meeting has reached mutual status:
  the solver accepted a host's invite, or the host accepted the solver's request. Use the
  single helper `canRevealIdentity(meeting)` in `js/store.js`; never re-implement the check
  in a view.
- Post-event contact exchange happens only when both sides privately chose "Let's continue".
  Never reveal which side chose "Not now".

## Rule 3: zero demographic and pedigree collection

Never add form fields, state keys, seed data or export columns for: nationality, ethnic
background, age or date of birth, gender, photo or avatar uploads, marital status, religion,
disability, CV/résumé or pitch-deck upload, or a solver's logo, company size, employee count,
funding stage or revenue. The Privacy view runs a live audit (`FORBIDDEN_KEYS` in
`js/store.js`) over the whole state; keep that list complete and keep the audit passing.

Ecosystem support links (Work in Finland, Espoo Talent Hub, Business Espoo, Enter Espoo,
Aalto and VTT) are offered to everyone and never depend on, or ask for, background.

## Rule 4: substance over style

- Bullet points and short paragraphs are equally valid; the editor offers both.
- Neither polished CVs nor sales pitch decks are rewarded over structured problem-solving.
- Never display, score or highlight word count, length, grammar or polish to hosts.
- No "quality" indicators on submissions.

## Rule 5: EU-hosted machine translation only

- The only permitted AI feature is optional machine translation, badged
  `[EU-Hosted Machine Translation — Original Always Shown]`; the toggle reads
  `EU-Hosted Machine Translation (Simulated)` in this prototype.
- It is off by default and toggled by the reader.
- Translated text **always renders side by side with the original**, never replacing it.
  Use `renderTranslation()` in `js/views/shared.js`.
- If no translation exists, say so plainly; never fabricate one silently.

## Rule 6: purpose-bound consent and 30-day deletion

- Consent is purpose-bound: data is used only to arrange conversations (hiring, R&D or
  pilot) for this one event. Show the consent notice before a solver shares.
- 30 days after the event, all personal data is purged: solver identities, submissions,
  drafts, bookmarks, meetings, feedback, consents, host contacts and the decision log.
  Anonymous aggregate statistics (counts per challenge, ESCO supply, interest by
  collaboration format, opt-in rate, per-company report figures) are computed **before**
  deletion inside `purgePersonalData()` in `js/store.js` and kept in `state.purge.aggregates`.
  Consent withdrawal uses `deleteParticipantData()`, which follows the same rule for one person.
- The Privacy view must keep a working "Simulate 30-day post-event auto-deletion" control
  that proves this end to end.

## Review checklist before finishing any task

1. Did anything introduce ordering other than chronological / by challenge? Remove it.
2. Can any view show a name, email, team or company of a solver without `canRevealIdentity()`? Fix it.
3. Did any new field touch a forbidden category (demographic or pedigree)? Remove it and extend `FORBIDDEN_KEYS`.
4. Does any translation replace the original? Make it side by side.
5. Does the purge still delete every new personal-data key you added, and keep its aggregate first?
