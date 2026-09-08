-- Q-D6: KVKK deletion scrubs Provider.email and Client.email to null.
-- Postgres unique indexes allow multiple NULLs, so several deleted rows can
-- coexist. Booking FKs and booking_slot_active_unique are untouched.

ALTER TABLE "Provider" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "email" DROP NOT NULL;
