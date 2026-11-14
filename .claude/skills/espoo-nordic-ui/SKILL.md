---
name: espoo-nordic-ui
description: Applies Nordic human-centric civic design inspired by the City of Espoo and Business Espoo—accessible, warm, and balanced across career and innovation events.
---

# Nordic civic UI for Skillink

Skillink should feel like a calm, trustworthy public-sector service from a Nordic city,
equally at home at a career fair and at a startup–corporate matchmaking day. It is not a
growth-hacked SaaS product. Design tokens live in `css/tokens.css`; use them, never raw hex
values in components.

## Palette

| Token | Hex | Use |
|---|---|---|
| `--trust-900` | `#003580` | Espoo deep blue: header, headings, primary buttons, Talent & Hiring badge |
| `--trust-600` | `#0050C8` | Links, focus rings, active states |
| `--birch-50`  | `#F7F6F2` | Page background (warm birch/sand) |
| `--birch-200` | `#E6E2D6` | Hairlines, quiet surfaces |
| `--pine-700`  | `#1B5E20` | Human verification and "confirmed" badges only |
| `--teal-800`  | `#0B5563` | R&D & Co-Creation badge |
| `--ochre-800` | `#7A3E00` | Pilot & Project badge |
| `--ink`       | `#111827` | Body text, Open Format badge (outlined) |

Never use purple gradients, glassmorphism, neon accents or decorative gradient washes.
Colour carries meaning: blue = action/trust, pine = a human confirmed it, amber = waiting,
red = declined/destructive. Preview cards on the problem board take a coloured top edge from
their first collaboration format; the format badges carry the meaning in text.

This is the original Skillink look, kept after user feedback: a later "Approach 2" redesign
(sage green, photo hero, big rounded cards) was tried and rejected. It still lives in the
sibling folder `Junction_Project_Blue`, in Espoo blue.

## Collaboration format badges

Hosts, solvers and organizers must tell a hiring role, an R&D challenge and a pilot
opportunity apart at a glance. Use `formatBadges()` from `js/views/shared.js`:

- Talent & Hiring: Espoo blue on light blue, person icon.
- R&D & Co-Creation: teal on light teal, flask icon.
- Pilot & Project: ochre on light ochre, linked-squares icon.
- Open Format: ink on white with a dashed outline, open-door icon.

Format badges are square-cornered with an icon, so they never read as round status pills.
They always carry the text label (colour is never the only signal), and every pairing meets
4.5:1 contrast. The four format names keep their capitalisation as product terms; all other
copy is sentence case.

## Type

- Headings: **Schibsted Grotesk** (a Nordic grotesk), weights 600–800, tight tracking on display sizes.
- Body and UI: **Atkinson Hyperlegible Next**, chosen for legibility for readers of many
  first languages.
- Sentence case everywhere except the four format names. No all-caps eyebrow labels, no
  single highlighted word in headlines, no arrows appended to button text.
- People are never shown with initials or photos.
- Body line length under ~72 characters.

## Layout and components

- Hierarchy through spacing and weight, not boxes inside boxes. Not every group is a card.
- Status pills always pair colour with a text label (never colour alone).
- The header shows the active account (picture and name) with a Google-style menu that
  switches to another demo account in one click. Each account sees only the buttons it can use;
  Guide is the only header link; the current one
  is marked with `aria-current`.
- Forms: visible labels, helper text under the label, errors stated in plain words with how to fix.

## Accessibility (WCAG 2.2 AA)

- Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI boundaries).
- Every interactive element reachable and operable by keyboard, with a visible 3px focus ring.
- Toggle buttons use `aria-pressed`; in-page tabs use `role="tablist"` with arrow-key support.
- Live updates (toasts, quota changes, filter counts) announce via an `aria-live="polite"` region.
- Respect `prefers-reduced-motion`. Motion only in response to an action.
- Targets at least 24×24 px; primary actions 44 px tall.

## Copy

Plain, warm, direct, and balanced between careers and innovation: say "host" and "solver",
"conversation" rather than "interview" or "sales meeting". Write from the user's side
("Request a conversation", not "Submit meeting entity"). Errors say what happened and how
to fix it. Empty states invite the next action.
