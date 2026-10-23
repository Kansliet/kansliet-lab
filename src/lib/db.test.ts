import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("pg", () => ({ Pool: class {} }));

let withStrictSsl: (url: string) => string;

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", "postgres://localhost/test");
  ({ withStrictSsl } = await import("./db"));
  vi.unstubAllEnvs();
});

describe("withStrictSsl", () => {
  it("pins Neon's sslmode=require to verify-full", () => {
    expect(
      withStrictSsl("postgresql://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"),
    ).toBe("postgresql://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require");
  });

  it("upgrades prefer and verify-ca too", () => {
    expect(withStrictSsl("postgres://h/db?a=1&sslmode=prefer")).toBe("postgres://h/db?a=1&sslmode=verify-full");
    expect(withStrictSsl("postgres://h/db?sslmode=verify-ca")).toBe("postgres://h/db?sslmode=verify-full");
  });

  it("leaves URLs without sslmode, or with disable/verify-full, alone", () => {
    for (const url of [
      "postgres://USER:PASSWORD@localhost:5432/kansliet",
      "postgres://h/db?sslmode=disable",
      "postgres://h/db?sslmode=verify-full",
    ]) {
      expect(withStrictSsl(url)).toBe(url);
    }
  });
});
