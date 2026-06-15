// ============================================================================
// POC password hashing (scrypt, built into Node — no deps). Server-only.
// Stored format: "saltHex:hashHex". For a real product use Supabase Auth.
// ============================================================================
import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const calc = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(calc, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A readable login id derived from the name + a short random suffix. */
export function generateUsername(fullName: string): string {
  const base =
    fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 12) || "user";
  return `${base}${randomBytes(2).toString("hex")}`;
}

/** A short, no-ambiguous-characters password (admin shares it with the user). */
export function generatePassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
