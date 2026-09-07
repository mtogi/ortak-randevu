/**
 * Q-P6: a guest may cancel or reschedule until 24 hours before the start.
 * Providers are not bound by this window (M3 dashboard).
 * Platform-wide on purpose — there is no per-provider policy engine.
 */
export const GUEST_MODIFY_CUTOFF_HOURS = 24;

export const GUEST_MODIFY_CUTOFF_MS = GUEST_MODIFY_CUTOFF_HOURS * 60 * 60 * 1000;

/** Default page size for the public slot list. */
export const PUBLIC_SLOTS_LIMIT = 60;

/** Default page size for the provider booking list (Q-D9). */
export const PROVIDER_BOOKINGS_LIMIT = 20;
