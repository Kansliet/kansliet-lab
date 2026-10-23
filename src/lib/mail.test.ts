import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendCustomerEmail, sendInternalAlert } from "./mail";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const message = { to: "anna@example.com", subject: "Order confirmation KDC-00042", text: "Body" };
const internal = { tag: "NEW ORDER" as const, orderRef: "KDC-00042" };

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "test" }, error: null });
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sendCustomerEmail", () => {
  it("sends the customer's email from store@, replies to store@, with no BCC", async () => {
    await sendCustomerEmail(message, internal);
    const customer = sendMock.mock.calls[0][0];
    expect(customer).toMatchObject({
      from: '"KANSLIET (STORE)" <store@kansliet.co>',
      to: "anna@example.com",
      replyTo: "store@kansliet.co",
      subject: "Order confirmation KDC-00042",
    });
    expect(customer.bcc).toBeUndefined();
  });

  it("sends the html part too when given, but keeps desk@'s copy plain text", async () => {
    await sendCustomerEmail({ ...message, html: "<p>Body</p>" }, internal);
    const customer = sendMock.mock.calls[0][0];
    expect(customer.html).toBe("<p>Body</p>");
    expect(customer.text).toBe("Body");
    const copy = sendMock.mock.calls[1][0];
    expect(copy.html).toBeUndefined();
    expect(copy.text).toContain("Body");
  });

  it("sends no html key for a text-only message", async () => {
    await sendCustomerEmail(message, internal);
    expect("html" in sendMock.mock.calls[0][0]).toBe(false);
  });

  it("sends desk@ a separate copy from store@, tagged, replying to the customer", async () => {
    await sendCustomerEmail(message, internal);
    expect(sendMock).toHaveBeenCalledTimes(2);
    const copy = sendMock.mock.calls[1][0];
    expect(copy).toMatchObject({
      from: "Kansliet Store <store@kansliet.co>",
      to: "desk@kansliet.co",
      replyTo: "anna@example.com",
      subject: "[NEW ORDER] KDC-00042",
    });
    expect(copy.text).toMatch(/^Sent to anna@example\.com\./);
    expect(copy.text).toContain("Body");
  });

  it("still sends the copy, flagged, when the customer's email fails, then throws", async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "bounced" } });
    await expect(sendCustomerEmail(message, internal)).rejects.toThrow("bounced");
    expect(sendMock.mock.calls[1][0].text).toMatch(/^NOT SENT to anna@example\.com \(bounced\)/);
  });

  it("doesn't throw when only the copy fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMock
      .mockResolvedValueOnce({ data: { id: "ok" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "copy failed" } });
    await expect(sendCustomerEmail(message, internal)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("throws before sending anything without an API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(sendCustomerEmail(message, internal)).rejects.toThrow("RESEND_API_KEY");
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("sendInternalAlert", () => {
  it("sends one email from store@ to desk@ with the given subject", async () => {
    await sendInternalAlert("[OVERSOLD] KDC-00042", "Details");
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toMatchObject({
      from: "Kansliet Store <store@kansliet.co>",
      to: "desk@kansliet.co",
      subject: "[OVERSOLD] KDC-00042",
      text: "Details",
    });
  });

  it("doesn't throw when Resend returns an error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    await expect(sendInternalAlert("[OVERSOLD] KDC-00042", "Details")).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("doesn't throw when sending rejects", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMock.mockRejectedValueOnce(new Error("network"));
    await expect(sendInternalAlert("[OVERSOLD] KDC-00042", "Details")).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
