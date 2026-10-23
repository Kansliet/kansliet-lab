import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Every admin entry point (page, route handler, server action) must check the
// session itself: a new file that forgets would be open to the world.
const ADMIN_DIR = path.dirname(fileURLToPath(import.meta.url));

// /admin has no page of its own: it is a redirect to /admin/orders.
const REDIRECT_ONLY = ["page.tsx"];

const entryPoints = (readdirSync(ADMIN_DIR, { recursive: true, encoding: "utf8" }) as string[])
  .map((file) => file.split(path.sep).join("/"))
  .filter((file) => /(^|\/)(page\.tsx|route\.ts|actions\.ts)$/.test(file))
  .sort();

const read = (file: string) => readFileSync(path.join(ADMIN_DIR, file), "utf8");

describe("admin entry points check the session", () => {
  it("finds the admin pages, routes and actions", () => {
    expect(entryPoints).toContain("orders/page.tsx");
    expect(entryPoints).toContain("orders/actions.ts");
    expect(entryPoints).toContain("moms/csv/route.ts");
  });

  it("allows only the /admin redirect to skip requireSession", () => {
    expect(REDIRECT_ONLY.map((file) => read(file).includes("redirect("))).toEqual([true]);
  });

  for (const file of entryPoints.filter((f) => !REDIRECT_ONLY.includes(f))) {
    it(`${file} calls requireSession()`, () => {
      expect(read(file)).toContain("requireSession(");
    });
  }

  for (const file of entryPoints.filter((f) => f.endsWith("actions.ts"))) {
    it(`${file} checks the session in every exported action`, () => {
      const source = read(file);
      const actions = source.match(/^export async function /gm)?.length ?? 0;
      const checks = source.match(/await requireSession\(\)/g)?.length ?? 0;
      expect(actions).toBeGreaterThan(0);
      expect(checks).toBe(actions);
    });
  }
});
