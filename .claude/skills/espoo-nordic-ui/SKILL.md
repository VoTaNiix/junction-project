---
name: espoo-nordic-ui
description: Applies Nordic human-centric civic design inspired by the City of Espoo—accessible, warm, anti-AI-slop typography and layout.
---

# Nordic civic UI for Skillink

Skillink should feel like a calm, trustworthy public-sector service from a Nordic city,
not a growth-hacked SaaS product. Design tokens live in `css/tokens.css`; use them, never
raw hex values in components.

## Palette

| Token | Hex | Use |
|---|---|---|
| `--trust-900` | `#003580` | Espoo deep trust blue: header, headings, primary buttons |
| `--trust-600` | `#0050C8` | Links, focus rings, active states |
| `--birch-50`  | `#F7F6F2` | Page background (warm birch/sand) |
| `--birch-200` | `#E6E2D6` | Hairlines, quiet surfaces |
| `--pine-700`  | `#1B5E20` | Human verification and "confirmed" badges only |
| `--ink`       | `#111827` | Body text |

Never use purple gradients, glassmorphism, neon accents or decorative gradient washes.
Colour carries meaning: blue = action/trust, pine = a human confirmed it, amber = waiting,
red = declined/destructive.

## Type

- Headings: **Schibsted Grotesk** (a Nordic grotesk), weights 600–800, tight tracking on display sizes.
- Body and UI: **Atkinson Hyperlegible Next**, chosen for legibility for readers of many
  first languages.
- Sentence case everywhere. No all-caps eyebrow labels, no single highlighted word in headlines,
  no arrows appended to button text.
- Body line length under ~72 characters.

## Layout and components

- Hierarchy through spacing and weight, not boxes inside boxes. Not every group is a card.
- Status pills always pair colour with a text label (never colour alone).
- The role switcher in the header is a segmented control: one click to change perspective,
  current role clearly marked with `aria-current`.
- Forms: visible labels, helper text under the label, errors stated in plain words with how to fix.

## Accessibility (WCAG 2.2 AA)

- Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI boundaries).
- Every interactive element reachable and operable by keyboard, with a visible 3px focus ring.
- Toggle buttons use `aria-pressed`; tabs use `role="tablist"` with arrow-key support.
- Live updates (toasts, quota changes) announce via an `aria-live="polite"` region.
- Respect `prefers-reduced-motion`. Motion only in response to an action.
- Targets at least 24×24 px; primary actions 44 px tall.

## Copy

Plain, warm, direct. Write from the user's side ("Request a conversation", not "Submit
meeting entity"). Errors say what happened and how to fix it. Empty states invite the next action.
