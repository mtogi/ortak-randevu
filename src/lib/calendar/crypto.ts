// Encrypt calendar OAuth tokens at rest (ADR-009). AES-256-GCM.
// Key: CALENDAR_TOKEN_ENCRYPTION_KEY (64 hex chars = 32 bytes), or SHA-256(AUTH_SECRET).
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function encryptionKey(): Buffer {
  const raw = (process.env.CALENDAR_TOKEN_ENCRYPTION_KEY ?? "").trim();
  if (raw) {
    if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
      throw new Error(
        "CALENDAR_TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes).",
      );
    }
    return Buffer.from(raw, "hex");
  }
  const secret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? "" : "dev-insecure-auth-secret");
  if (!secret) {
    throw new Error(
      "Set CALENDAR_TOKEN_ENCRYPTION_KEY or AUTH_SECRET to encrypt calendar tokens.",
    );
  }
  return createHash("sha256").update(`calendar-token-v1:${secret}`).digest();
}

/** Returns `iv.ciphertext.tag` as base64url segments joined by `.`. */
export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, encrypted, tag].map((b) => b.toString("base64url")).join(".");
}

export function decryptToken(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token payload.");
  }
  const [ivB64, dataB64, tagB64] = parts;
  const iv = Buffer.from(ivB64!, "base64url");
  const data = Buffer.from(dataB64!, "base64url");
  const tag = Buffer.from(tagB64!, "base64url");
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new Error("Invalid encrypted token payload.");
  }
  const decipher = createDecipheriv(ALGO, encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
