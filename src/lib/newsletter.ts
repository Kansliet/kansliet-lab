import { createHmac, timingSafeEqual } from "node:crypto";
import { COMPANY } from "@/lib/shop-info";

// The newsletter list is the "General" segment in Resend. Two ways in:
// - the signup form: double opt-in, so the address gets a confirmation link
//   and is only added when it's clicked (proof the owner asked for it);
// - the unticked box in the cart: added by the webhook after payment, since
//   the buyer ticked it themselves with the address they paid with.
// Unsubscribing is Resend's own link in every broadcast.

/** Resend segment "General". */
export const NEWSLETTER_SEGMENT_ID = "fe683444-6afc-4a36-9933-5818c589fbd2";

/** How long a confirmation link works. */
const LINK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reuses the contact form's secret, under its own prefix so a form token can
// never pass as a confirmation link or the other way round.
function secret(): string | null {
  const value = process.env.CONTACT_FORM_SECRET;
  if (value) return value;
  // Local dev and previews only; production must never sign with a known value.
  return process.env.VERCEL_ENV === "production" ? null : "dev-only-newsletter-secret";
}

function sign(email: string, issuedAt: number, key: string): string {
  return createHmac("sha256", key).update(`newsletter:${email}:${issuedAt}`).digest("base64url");
}

/** The query string for a confirmation link: ?e=<email>&t=<issued at>&s=<signature>. */
export function confirmationQuery(email: string, now = Date.now()): string {
  const key = secret();
  if (!key) throw new Error("CONTACT_FORM_SECRET not set");
  const params = new URLSearchParams({ e: email, t: String(now), s: sign(email, now, key) });
  return params.toString();
}

/** The email a confirmation link was issued for, or null if it's forged, altered or expired. */
export function verifyConfirmation(
  params: { e?: string; t?: string; s?: string },
  now = Date.now(),
): string | null {
  const key = secret();
  const { e: email, t, s } = params;
  if (!key || !email || !t || !s || !EMAIL_PATTERN.test(email)) return null;
  const issuedAt = Number(t);
  if (!Number.isInteger(issuedAt) || now - issuedAt > LINK_MAX_AGE_MS || issuedAt > now + 60_000) {
    return null;
  }
  const expected = Buffer.from(sign(email, issuedAt, key));
  const given = Buffer.from(s);
  return expected.length === given.length && timingSafeEqual(expected, given) ? email : null;
}

export function buildConfirmationEmail(link: string): { subject: string; text: string } {
  return {
    subject: `Confirm your newsletter signup — ${COMPANY.tradingName}`,
    text: [
      "Confirm that you want the Kansliet newsletter: new objects in the store, and the occasional note from the studio.",
      "",
      link,
      "",
      "The link works for 7 days. If you didn't sign up, ignore this email and nothing happens.",
      "",
      `${COMPANY.legalName}, ${COMPANY.address.join(", ")}`,
    ].join("\n"),
  };
}
