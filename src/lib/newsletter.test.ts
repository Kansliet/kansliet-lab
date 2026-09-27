import { describe, it, expect, afterEach, vi } from "vitest";
import { confirmationQuery, verifyConfirmation } from "./newsletter";

const params = (query: string) => Object.fromEntries(new URLSearchParams(query));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("newsletter confirmation links", () => {
  const now = Date.UTC(2026, 8, 27, 12);

  it("round-trips a valid link", () => {
    const query = confirmationQuery("anna@example.com", now);
    expect(verifyConfirmation(params(query), now + 60_000)).toBe("anna@example.com");
  });

  it("rejects an altered address or signature", () => {
    const p = params(confirmationQuery("anna@example.com", now));
    expect(verifyConfirmation({ ...p, e: "mallory@example.com" }, now)).toBeNull();
    expect(verifyConfirmation({ ...p, s: p.s.slice(0, -2) + "xx" }, now)).toBeNull();
    expect(verifyConfirmation({ ...p, t: String(now + 1) }, now + 2)).toBeNull();
  });

  it("expires after 7 days", () => {
    const p = params(confirmationQuery("anna@example.com", now));
    expect(verifyConfirmation(p, now + 7 * 24 * 3600 * 1000 - 1)).toBe("anna@example.com");
    expect(verifyConfirmation(p, now + 7 * 24 * 3600 * 1000 + 1)).toBeNull();
  });

  it("refuses to sign or verify on production without the secret", () => {
    const p = params(confirmationQuery("anna@example.com", now));
    vi.stubEnv("CONTACT_FORM_SECRET", "");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => confirmationQuery("anna@example.com", now)).toThrow();
    expect(verifyConfirmation(p, now)).toBeNull();
  });
});
