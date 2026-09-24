import { describe, it, expect, afterEach, vi } from "vitest";
import { getAppBaseUrl, SITE_URL } from "./site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAppBaseUrl", () => {
  it("uses the canonical site URL on the production deployment", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "kansliet-lab-abc123.vercel.app");
    expect(getAppBaseUrl()).toBe(SITE_URL);
  });

  it("uses the deployment's own URL on Vercel previews", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "kansliet-lab-git-feat-store.vercel.app");
    expect(getAppBaseUrl()).toBe("https://kansliet-lab-git-feat-store.vercel.app");
  });

  it("uses localhost in development, honouring PORT", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("PORT", "3001");
    expect(getAppBaseUrl()).toBe("http://localhost:3001");
  });

  it("falls back to the canonical https site URL outside Vercel", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    expect(getAppBaseUrl()).toBe(SITE_URL);
    expect(SITE_URL.startsWith("https://")).toBe(true);
  });
});
