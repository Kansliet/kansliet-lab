import { describe, it, expect, afterEach, vi } from "vitest";
import { mintFormToken, verifyFormToken } from "./form-token";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("verifyFormToken without CONTACT_FORM_SECRET", () => {
  it("fails open locally and on previews", () => {
    vi.stubEnv("CONTACT_FORM_SECRET", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(verifyFormToken("")).toBe(true);
  });

  it("fails closed on the production deployment", () => {
    vi.stubEnv("CONTACT_FORM_SECRET", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(verifyFormToken("")).toBe(false);
  });
});

describe("verifyFormToken with a secret", () => {
  it("accepts a token after the minimum fill time and rejects a tampered one", () => {
    vi.stubEnv("CONTACT_FORM_SECRET", "test-secret");
    vi.useFakeTimers();
    const token = mintFormToken();
    vi.advanceTimersByTime(4_000);
    expect(verifyFormToken(token)).toBe(true);
    expect(verifyFormToken(token.replace(/.$/, (c) => (c === "0" ? "1" : "0")))).toBe(false);
  });

  it("rejects an instant (bot-speed) submission", () => {
    vi.stubEnv("CONTACT_FORM_SECRET", "test-secret");
    expect(verifyFormToken(mintFormToken())).toBe(false);
  });
});
