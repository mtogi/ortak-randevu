-- New providers default to Turkish (Turkey-first UI). Existing rows keep
-- their stored locale. booking_slot_active_unique is untouched.

ALTER TABLE "Provider" ALTER COLUMN "locale" SET DEFAULT 'tr';
