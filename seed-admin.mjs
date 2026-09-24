// One-off script to create (or reset) the single admin user.
// Usage: node seed-admin.mjs <email>
// The password is prompted for (hidden, typed twice), never taken as an
// argument, so it doesn't end up in shell history or `ps` output. Resetting a
// password also signs out every existing session for that user.
import { scryptSync, randomBytes } from "node:crypto";
import readline from "node:readline";
import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
const { Pool } = pg;

loadEnvConfig(process.cwd());

const MIN_PASSWORD_LENGTH = 16;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function promptHidden(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  // Echo the prompt itself, swallow the typed characters.
  rl._writeToOutput = (text) => {
    if (text.includes(question)) process.stdout.write(text);
  };
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const [email, passwordArg] = process.argv.slice(2);
  if (passwordArg) {
    console.error("Don't pass the password as an argument (it lands in shell history). Run: node seed-admin.mjs <email>");
    process.exit(1);
  }
  if (!email) {
    console.error("Usage: node seed-admin.mjs <email>");
    process.exit(1);
  }

  const password = await promptHidden("Password: ");
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }
  if ((await promptHidden("Repeat password: ")) !== password) {
    console.error("Passwords don't match.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email, created_at`,
    [email.trim().toLowerCase(), hashPassword(password)]
  );
  const { rowCount } = await pool.query("DELETE FROM sessions WHERE user_id = $1", [rows[0].id]);

  console.log("Admin user ready:", rows[0], `(signed out ${rowCount} existing session(s))`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
