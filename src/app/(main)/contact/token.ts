import { createHmac, timingSafeEqual } from "crypto";

// A signed, time-stamped token proves the form was rendered by our server and
// that a human took at least a few seconds to fill it in. It is stateless:
// nothing is stored server-side, so it survives Vercel's ephemeral serverless
// instances. NOT exported from actions.ts because "use server" files may only
// export async functions.

const MIN_FILL_MS = 3_000; // bots submit instantly; humans take longer
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // stale tab / replay ceiling

function sign(ts: string, secret: string): string {
  return createHmac("sha256", secret).update(ts).digest("hex");
}

/** Mint `"<unix-ms>.<hmac>"`. Returns "" when unconfigured so dev/preview work. */
export function mintFormToken(): string {
  const secret = process.env.CONTACT_FORM_SECRET;
  if (!secret) return ""; // fail-open when unconfigured (local dev)
  const ts = Date.now().toString();
  return `${ts}.${sign(ts, secret)}`;
}

/** Verify signature + fill-time window. Fails open when no secret is set. */
export function verifyFormToken(token: string): boolean {
  const secret = process.env.CONTACT_FORM_SECRET;
  if (!secret) return true; // fail-open when unconfigured
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;
  const expected = sign(ts, secret);
  // timingSafeEqual throws on length mismatch — guard first.
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const age = Date.now() - Number(ts);
  return age >= MIN_FILL_MS && age <= MAX_AGE_MS;
}
