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

This project uses the **Espoo blue** palette with the layout and components ported from the
"Approach 2" design (soft white cards, pill controls, 18–22px radii, tight display type). A
sibling copy, `Junction_Project`, uses Approach 2's green palette; the two differ only in the
"Brand" and "Neutrals" blocks of `css/tokens.css` plus the favicon colour. Components use the
semantic `--brand-*` tokens, never a palette name, so a palette swap never touches `app.css`.

| Token | Hex | Use |
|---|---|---|
| `--brand-900` | `#003580` | Espoo deep blue: headings, primary buttons, active tab and role, Talent & Hiring badge |
| `--brand-700` | `#0050C8` | Links, focus rings |
| `--brand-100` / `--brand-50` | `#E3ECFA` / `#F0F5FD` | Soft buttons, notes, page-intro bands |
| `--paper` / `--paper-2` | `#F7F6F2` / `#EFEDE6` | Page background (warm birch/sand) / quiet surfaces |
| `--hair` | `#E6E2D6` | Hairlines |
| `--ink`       | `#111827` | Body text, Open Format badge (outlined) |
| `--pine-700`  | `#1B5E20` | Human verification and "confirmed" badges only |
| `--teal-800`  | `#0B5563` | R&D & Co-Creation badge |
| `--ochre-800` | `#7A3E00` | Pilot & Project badge |

Never use purple gradients, glassmorphism, neon accents or decorative gradient washes.
Colour carries meaning: blue = action/trust, pine = a human confirmed it, amber = waiting,
red = declined/destructive. Challenge cards get a pale top band tinted by their first
collaboration format; it is decorative (`aria-hidden`), the format badges carry the meaning.

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
- Sentence case everywhere except the four format names. Small eyebrow labels (`.eyebrow`)
  are allowed in sentence case, never all caps. No single highlighted word in headlines (the
  hero's quieter last line is a whole line), no arrows appended to button text.
- People are never shown with initials or photos: the review card avatar is a generic icon.
- Body line length under ~72 characters.

## Layout and components

- Hierarchy through spacing and weight, not boxes inside boxes. Not every group is a card.
- Status pills always pair colour with a text label (never colour alone).
- The side switcher in the header is a two-option segmented control: one click to change side
  (Talent, Employer), with Event team as a separate header link; current side
  clearly marked with `aria-current`.
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
