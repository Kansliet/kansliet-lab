import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";

export const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = scryptSync(password, salt, 64);
  const stored_ = Buffer.from(hashHex, "hex");
  if (derived.length !== stored_.length) return false;
  return timingSafeEqual(derived, stored_);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// The raw token only ever lives in the cookie. What's stored in `sessions.id`
// is this hash, so reading the sessions table (a backup leak, a bug, a future
// admin tool) never hands out a directly-usable bearer credential the way
// storing the raw token would.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiresAt(): Date {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

type Session = {
  user_id: number;
  email: string;
};

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { rows } = await pool.query<Session>(
    `SELECT sessions.user_id, users.email FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = $1 AND sessions.expires_at > now()`,
    [hashToken(token)]
  );
  return rows[0] ?? null;
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
