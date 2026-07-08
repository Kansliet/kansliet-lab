import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitContact } from "./actions";

// vi.mock is hoisted above all imports, so the factory cannot close over a
// plain top-level const (it would not be initialized yet). vi.hoisted lifts
// the mock fn alongside it so both exist when the factory runs.
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  // Real redirect() throws NEXT_REDIRECT and never returns — mirror that so the
  // success path is exercised as it is in production.
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("resend", () => ({
  // `new Resend(...)` runs at module import — needs a real constructor, not an
  // arrow fn (arrows can't be construct-called).
  Resend: class {
    emails = { send: sendMock };
  },
}));

function makeForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  message: "I would like to discuss a project.",
};

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "test" }, error: null });
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  // Force token check to fail open (no secret) so tests don't depend on timing.
  vi.stubEnv("CONTACT_FORM_SECRET", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("submitContact", () => {
  it("short-circuits on honeypot without sending", async () => {
    const result = await submitContact(null, makeForm({ ...validFields, _trap: "bot" }));
    expect(result).toEqual({ message: "Message sent." });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("requires name, email, and message", async () => {
    const result = await submitContact(null, makeForm({ name: "", email: "", message: "" }));
    expect(result).toEqual({ error: "Please fill in name, email, and message." });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const result = await submitContact(null, makeForm({ ...validFields, email: "not-an-email" }));
    expect(result?.error).toMatch(/valid email/i);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an over-long name", async () => {
    const result = await submitContact(null, makeForm({ ...validFields, name: "a".repeat(201) }));
    expect(result).toEqual({ error: "Name is too long." });
  });

  it("rejects an over-long message", async () => {
    const result = await submitContact(null, makeForm({ ...validFields, message: "a".repeat(10_001) }));
    expect(result).toEqual({ error: "Message is too long." });
  });

  it("returns an unavailable error when RESEND_API_KEY is unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const result = await submitContact(null, makeForm(validFields));
    expect(result?.error).toMatch(/temporarily unavailable/i);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends and redirects on a valid submission", async () => {
    await expect(submitContact(null, makeForm(validFields))).rejects.toThrow(
      "REDIRECT:/contact?success=1",
    );
    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.replyTo).toBe(validFields.email);
    expect(payload.subject).toContain(validFields.name);
    expect(payload.text).toContain(validFields.message);
  });

  it("returns a send error when Resend rejects", async () => {
    sendMock.mockRejectedValueOnce(new Error("resend down"));
    const result = await submitContact(null, makeForm(validFields));
    expect(result).toEqual({ error: "Failed to send message. Please try again later." });
  });
});
