# Brand — Ortak Randevu

> **Status:** accepted 2026-09-14. **Reference: Calendly** (scheduling UX and
> visual system), not the 2026-09-13 pine/serif experiment. We copy the
> *code* of that product — whitespace, one sans, cool blue on white, pill
> CTAs, split booking board — not Calendly’s trademarked C, wordmark, or
> marketing illustrations.

**One line:** send a link, pick a time. Dietitian booking with Calendly-grade
friction, never a clinic chart.

## Face

| Element | Decision |
| --- | --- |
| Wordmark | **Ortak Randevu** in Geist, semibold. One line. Same family as the UI. |
| Logomark | Squircle + bullseye (one cyan ring + white disc). Navy/blue plate. Two masters: compact (16–32) and full (header / 32+). |
| Where it appears | Header on every public and `/me` surface. Home uses a benefit headline, not a second logo. |
| Not this | Serif lockups, pine/clay overlapping squares, leaf/caduceus, Calendly’s C monogram. |

The ripple means “one link, knock-on ease.” It is not a health symbol and
not Calendly’s letterform.

## Tone

Calendly voice: short, direct, no back-and-forth. Scheduling only.

| Do | Don’t |
| --- | --- |
| easy scheduling, share a link, pick a time | treatment, diagnosis, care plan |
| dietitian / diyetisyen | doctor-as-EHR |
| client / danışan | patient / hasta |
| Get started / Başlayın | Formal-bureaucratic TR, slang, medical asides |

**Tagline (EN):** Easy scheduling for dietitians.  
**Tagline (TR):** Diyetisyenler için kolay randevu.

## Color

Light-first, cool canvas, navy type, trust-blue CTAs nudged one step toward
cyan (3B). Cyan remains the mark ring. No per-page hex.
Dark values below are for a future toggle; they are not applied from
`prefers-color-scheme` (the conversion home is a light canvas).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#F4F7FB` | `#071422` | Page canvas |
| `--foreground` | `#061B31` | `#F4F7FB` | Text (Calendly navy) |
| `--surface` | `#FFFFFF` | `#0E1C2E` | Cards / header |
| `--muted` | `#4A5C6A` | `#9AA8B5` | Secondary text |
| `--accent` | `#0E7BF9` | `#6AB7F9` | Primary actions, selected slots (3B: one step toward `--mark`) |
| `--accent-hover` | `#0E69D2` | `#85C6F9` | Primary hover |
| `--accent-fg` | `#FFFFFF` | `#061B31` | Text on accent |
| `--mark` | `#5EDFD7` | `#5EDFD7` | Logomark ring only |
| `--mark-plate` | `#0069FF` | `#0069FF` | Logomark plate (unchanged; not the CTA) |
| `--danger` | `#D92D20` | `#F97066` | Destructive |
| `--ok` | `#079455` | `#3CCB7F` | Success |

## Type

| Role | Face | Notes |
| --- | --- | --- |
| UI, headings, wordmark | Geist | `latin` + `latin-ext`. next/font, self-hosted. Calendly product uses Geist; TT Neoris is their display face (licensed — we do not ship it). |

One family. No serif. Headings are heavier Geist, not a second font.

## UX (Calendly booking code)

- Header: white bar, wordmark left, sparse nav, primary pill for Sign in.
- Home: conversion landing — benefit headline, inline email CTA, in-code
  calendar/hours mockups, how-it-works, closing banner. Lots of air.
  Header is sticky with a light blur.
- Booking: white board on the canvas; **rail** (who / service) + **main**
  (times, then details). Time chips outline → fill blue when selected.
- Touch: 44px minimum on buttons and chips. Focus: 2px offset ring.
- Motion: 120ms color/border only; honor `prefers-reduced-motion`.

Implemented in `src/app/globals.css` and the public page shells.

## Working-session calls (2026-09-18)

Closed in the brand chat:

| Call | Decision |
| --- | --- |
| Mark | Same idea, **two masters**: full (header / 32+) and compact (16–32). Not a letterform. Live SVG is a bullseye (one ring + disc), not true concentric ripples. |
| Cyan | **Signature.** Compact master / favicon must still read cyan — not blue-only jewelry. **Owner confirmed 2026-09-18:** live www tab reads cyan; compact master stands. |
| Accent | **3B-harmonize:** keep trust-blue CTA role; nudge hex one step toward `--mark` (`#5EDFD7`) so buttons, cyan, and cloudy washes are one family. **Applied 2026-09-18:** `--accent` `#0E7BF9` (85% `#0069FF` + 15% `#5EDFD7`); plate stays `#0069FF` via `--mark-plate`. |
| Lockup files | **Mark + one-line lockup** (mark + Geist “Ortak Randevu”). No stacked lockup yet. Icons/favicon = mark only. |
| Icons | **Custom ~16 pack as files** under `docs/design/assets/` (`logo/` + `icons/svg` + `icons/png`). JSX is not the source of truth. Escape keyboard-emoji UI. |
| Production tools | **SVG masters in this repo** + **Figma Free** (16px check + Geist lockup). Quiver App abandoned (composer would not send). No Claude Pro this slice. |
| Atmosphere | **Q7 marketing-only.** Soft cyan/accent clouds on the home hero and closer. No header wash, no `/me` or booking chrome. |

Still missing in the repo:

- A reusable icon pack (landing steps use one-off SVGs)

Compact mark + tab/Apple icons shipped 2026-09-18. 16px www tab confirmed (cyan reads). Full header mark shipped 2026-09-18: `docs/design/assets/logo/mark-full.svg`; live header in `wordmark.tsx` matches. One-line Geist lockup shipped 2026-09-18: `docs/design/assets/logo/lockup.svg` (outlined Geist wght 650; live header stays mark + HTML type). Q7 clouds shipped 2026-09-18: home hero + closer only.

Do not treat this session as a layout or SEO sprint.
