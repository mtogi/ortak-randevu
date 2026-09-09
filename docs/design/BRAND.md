# Brand — face, tone, color

> **Status:** placeholder. The 2026-09-08 copy/CSS polish is **comfort chrome**
> (cards, buttons, warmer EN/TR), not a brand system. Product owner: that is
> not enough for a public face.
>
> **Do not fill tokens or redesign UI in the Google OAuth chat.** The dedicated
> brand slice is the session **after** Q-T15. That chat writes this file for
> real, then applies tokens in `src/app/globals.css` + next-intl copy.

## What the brand slice must decide

| Layer | Meaning | Not this |
| --- | --- | --- |
| Face | Wordmark / logomark, how “Ortak Randevu” appears on home, login, book | Stock emoji or a one-off header tweak |
| Tone | Voice for EN default + TR: calm professional scheduling, never medical advice | Rewriting legal/privacy lawyer copy |
| Color | A small token set (background, text, accent, danger, muted) used everywhere | Random per-page hex |
| Type | Heading / body treatment consistent with tokens | A new font-of-the-week without a decision |

## Constraints (already decided)

- Dietitians in Turkey; Calendly-like booking comfort; **not** an EHR.
- EN default, TR first-class (`messages/en.json` + `tr.json`).
- No clinical language, no gray-zone “reason for visit” fields.
- One agent, one slice: brand work is its own chat after Google sign-in.

## Until the brand slice

Existing surfaces keep the private-beta comfort chrome. Do not start a visual
redesign inside auth, booking, or KVKK work.
