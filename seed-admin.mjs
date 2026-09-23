// One-off script to create (or reset) the single admin user.
// Usage: node seed-admin.mjs <email> <password>
import { scryptSync, randomBytes } from "node:crypto";
import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
const { Pool } = pg;

loadEnvConfig(process.cwd());

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: node seed-admin.mjs <email> <password>");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const passwordHash = hashPassword(password);

  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email, created_at`,
    [email.trim().toLowerCase(), passwordHash]
  );

  console.log("Admin user ready:", rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
