"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import {
  SESSION_COOKIE,
  createSessionToken,
  hashToken,
  sessionExpiresAt,
  verifyPassword,
} from "@/lib/auth";

function backToLoginWithError(
  error: string,
  email: FormDataEntryValue | null
): never {
  const params = new URLSearchParams({ error });
  if (email) params.set("email", String(email));
  redirect(`/login?${params.toString()}`);
}

export async function login(formData: FormData) {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const email = String(rawEmail ?? "")
    .trim()
    .toLowerCase();
  const password = String(rawPassword ?? "");

  if (!email || !password) {
    backToLoginWithError("Email and password are required", rawEmail);
  }

  const { rows } = await pool.query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email]
  );
  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    backToLoginWithError("Invalid email or password", rawEmail);
  }

  const token = createSessionToken();
  const expiresAt = sessionExpiresAt();

  await pool.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [hashToken(token), user.id, expiresAt]
  );

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  redirect("/store/orders");
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await pool.query("DELETE FROM sessions WHERE id = $1", [hashToken(token)]);
  }

  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
