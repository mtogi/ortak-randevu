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
| Logomark | Squircle + ripple (concentric rings). Navy/blue fill, cyan ring. Inline SVG. |
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

Light-first, cool canvas, navy type, saturated link-blue for actions
(Calendly *product* booking UI). Cyan is mark-only. No per-page hex.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#F4F7FB` | `#071422` | Page canvas |
| `--foreground` | `#061B31` | `#F4F7FB` | Text (Calendly navy) |
| `--surface` | `#FFFFFF` | `#0E1C2E` | Cards / header |
| `--muted` | `#4A5C6A` | `#9AA8B5` | Secondary text |
| `--accent` | `#0069FF` | `#6CB0FF` | Primary actions, selected slots |
| `--accent-hover` | `#0054D1` | `#8CC2FF` | Primary hover |
| `--accent-fg` | `#FFFFFF` | `#061B31` | Text on accent |
| `--mark` | `#5EDFD7` | `#5EDFD7` | Logomark ring only |
| `--danger` | `#D92D20` | `#F97066` | Destructive |
| `--ok` | `#079455` | `#3CCB7F` | Success |

## Type

| Role | Face | Notes |
| --- | --- | --- |
| UI, headings, wordmark | Geist | `latin` + `latin-ext`. next/font, self-hosted. Calendly product uses Geist; TT Neoris is their display face (licensed — we do not ship it). |

One family. No serif. Headings are heavier Geist, not a second font.

## UX (Calendly booking code)

- Header: white bar, wordmark left, sparse nav, primary pill for Sign in.
- Home: large benefit headline, one primary CTA, lots of air.
- Booking: white board on the canvas; **rail** (who / service) + **main**
  (times, then details). Time chips outline → fill blue when selected.
- Touch: 44px minimum on buttons and chips. Focus: 2px offset ring.
- Motion: 120ms color/border only; honor `prefers-reduced-motion`.

Implemented in `src/app/globals.css` and the public page shells.
