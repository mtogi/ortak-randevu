# Data Classification — No Health / Clinical Data

## Principle

This product is a **scheduling / booking** platform. It must not become a health record system.

If a data field could reasonably be used for **clinical care, diagnosis, treatment, or health monitoring**, do not store it.

## Allowed (examples — PII / operational)

| Category | Examples | Notes |
| --- | --- | --- |
| Account | Name, email, phone, password/hash, locale (EN/TR) | KVKK applies |
| Professional profile | Display name, bio, photo, city, languages, public booking URL | No license numbers unless product requires verification later |
| Availability | Working hours, exceptions, timezone | Default TZ: `Europe/Istanbul` |
| Services | Title, duration, price, location type (online/in-person) | Titles must not encode clinical protocols |
| Bookings | Slot start/end, status, service ref, participants |  |
| Meeting logistics | Optional meeting URL / address | Not clinical notes |
| Notifications prefs | Email/SMS opt-in |  |

## Forbidden (do not add to schema, forms, or uploads)

| Category | Examples |
| --- | --- |
| Clinical history | Diagnoses, ICD codes, symptoms diaries |
| Measurements | Weight, BMI, body fat, labs, glucose |
| Care plans | Meal plans as medical nutrition therapy records, prescriptions |
| Sensitive health | Allergies, medications, pregnancy, mental health notes |
| Documents | Lab PDFs, referral letters, clinical photos |
| Chat as care | In-app clinical messaging / progress notes |

## Gray zone — default to **exclude** until explicitly approved

- Free-text “reason for visit” / “goals” (often becomes health data)
- Pre-visit questionnaires with dietary/medical questions
- File uploads from clients

**Default decision:** booking needs **who**, **when**, **which service**, **how to reach them** — nothing more for MVP.

## Engineering checklist

- [ ] PR reviews reject forbidden columns/endpoints
- [x] Cursor `security` + `product` rules cite this file
- [x] Schema fence written in ADR-003 (2026-09-05) — no gray-zone columns
- [ ] Analytics events never include free-text health content
- [ ] Backups/logs redact phone/email where feasible

## Related

- `docs/legal/PRIVACY-NOTES.md` (KVKK)
- `docs/architecture/ADR/003-data-model.md`
- `.cursor/rules/product.mdc` / `security.mdc`
