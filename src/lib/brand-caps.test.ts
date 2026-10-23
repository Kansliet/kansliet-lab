import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// The brand name is always uppercase (KANSLIET). Lowercase `kansliet` in
// domains, emails and identifiers is fine; only the mixed-case form fails.

const ROOT = process.cwd();
const SELF = path.join("src", "lib", "brand-caps.test.ts");
const EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".css", ".json"]);
const BAD = "Kansliet";

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry))) out.push(full);
  }
  return out;
}

describe("brand name casing", () => {
  it("never writes Kansliet in mixed case", () => {
    const files = [...walk(path.join(ROOT, "src")), path.join(ROOT, "seed-store-products.mjs")];
    const hits: string[] = [];
    for (const file of files) {
      const rel = path.relative(ROOT, file);
      if (rel === SELF) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (line.includes(BAD)) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(hits, `Write the brand name as KANSLIET:\n${hits.join("\n")}`).toEqual([]);
  });
});
