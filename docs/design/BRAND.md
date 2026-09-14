# Brand — Ortak Randevu

> **Status:** accepted 2026-09-13. Comfort chrome (2026-09-08) is the
> component kit this face sits on — not the brand itself.

**One line:** two people agreeing on a time. A dietitian’s booking page, not
a clinic chart and not a generic SaaS calendar.

## Face

| Element | Decision |
| --- | --- |
| Wordmark | The two words **Ortak Randevu**, Source Serif 4, semibold, tight tracking. Never abbreviated to “OR”, never a stacked lockup with a slogan in the header. |
| Logomark | Two overlapping rounded squares (a shared calendar cell). Inline SVG. Pine + clay fills. |
| Where it appears | Header on every public and `/me` surface. Home repeats the name as the page title. |
| Not this | Stock emoji, leaf/apple/caduceus, a one-off header tweak, a separate marketing site. |

The mark means *ortak* (shared). It is not a health symbol.

## Tone

Calm, adult, short sentences. Scheduling language only.

| Do | Don’t |
| --- | --- |
| appointment, booking, time, link | treatment, diagnosis, care plan, “session” as therapy |
| dietitian / diyetisyen | doctor-as-EHR, clinic chart |
| client / danışan | patient / hasta |
| EN default quality; TR as the same voice (`siz`) | Formal-bureaucratic TR, slang, medical-advice asides |

Public copy on home, login, booking, and `/me` shares this voice. Do not
rewrite lawyer/privacy outlines except to keep them non-clinical.

**Tagline (EN):** Calm booking for dietitians in Turkey.  
**Tagline (TR):** Türkiye'deki diyetisyenler için sakin bir randevu sayfası.

## Color

Warm paper and olive ink. Pine for actions (practice hospitality, not a
hospital cross). Clay only in the logomark so the UI does not read as a
wellness-leaf app. Not Calendly blue.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#F3EFE6` | `#131611` | Page |
| `--foreground` | `#1C1F1A` | `#EDE8DE` | Text |
| `--surface` | `#FFFCF6` | `#1C211C` | Cards |
| `--muted` | `#4F5649` | `#A8B09E` | Secondary text |
| `--accent` | `#2A5A43` | `#8FCBAA` | Primary actions |
| `--accent-hover` | `#1F4634` | `#A8D9BC` | Primary hover |
| `--accent-fg` | `#FFFCF6` | `#131611` | Text on accent |
| `--mark` | `#C4622D` | `#E08A5A` | Logomark only |
| `--danger` | `#B42318` | `#F08078` | Destructive |
| `--ok` | `#1F6B45` | `#6ECF97` | Success |

Implemented in `src/app/globals.css`. Do not introduce per-page hex.

## Type

| Role | Face | Notes |
| --- | --- | --- |
| Body / UI | Source Sans 3 | `latin` + `latin-ext` (Turkish glyphs). next/font, self-hosted. |
| Wordmark / headings | Source Serif 4 | Same subsets. Optical size on. |

No third display font. Comfort-chrome radii and buttons stay; they now sit
on these tokens.
