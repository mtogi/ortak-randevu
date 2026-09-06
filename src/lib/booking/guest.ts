// Q-P7: a guest books with name + email + phone and no account. Those three
// fields are the entire input surface — "how to reach them", nothing more.
// Do not add a notes / reason-for-visit / goals field here: it is on the
// default-deny gray list in docs/legal/DATA-CLASSIFICATION.md.
import { isValidEmail, normalizeEmail } from "@/lib/identity";
import { BookingValidationError } from "./errors";

const NAME_MAX = 80;
const PHONE_MAX = 32;
const PHONE_MIN = 7;
const PHONE_ALLOWED = /^[+0-9 ()./-]+$/;

export type GuestInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type Guest = {
  name: string;
  email: string;
  phone: string;
};

export function normalizeGuest(input: GuestInput): Guest {
  const name = String(input.name ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!name || name.length > NAME_MAX) {
    throw new BookingValidationError(
      "NAME_INVALID",
      "Enter your name (max 80 characters).",
    );
  }

  const email = String(input.email ?? "").trim();
  if (!isValidEmail(email)) {
    throw new BookingValidationError("EMAIL_INVALID", "Enter a valid email address.");
  }

  const phone = String(input.phone ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const digits = phone.replace(/\D/g, "");
  if (
    phone.length > PHONE_MAX ||
    digits.length < PHONE_MIN ||
    !PHONE_ALLOWED.test(phone)
  ) {
    throw new BookingValidationError("PHONE_INVALID", "Enter a valid phone number.");
  }

  return { name, email: normalizeEmail(email), phone };
}
