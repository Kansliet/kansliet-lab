import { describe, it, expect, vi, beforeEach } from "vitest";

const { query, sendCustomerEmail, redirect } = vi.hoisted(() => ({
  query: vi.fn(),
  sendCustomerEmail: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));

vi.mock("@/lib/db", () => ({ pool: { query } }));
vi.mock("@/lib/auth", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ stripe: {} }));
vi.mock("@/lib/mail", () => ({ sendCustomerEmail }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

import { markShipped } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const shippedRow = { customer_email: "anna@example.com", shipped_at: new Date("2026-10-23T09:00:00Z") };

beforeEach(() => {
  query.mockReset();
  sendCustomerEmail.mockReset();
  redirect.mockClear();
  sendCustomerEmail.mockResolvedValue(undefined);
});

describe("markShipped", () => {
  it("marks shipped with carrier and tracking, then sends the shipped email", async () => {
    query
      .mockResolvedValueOnce({ rows: [shippedRow] })
      .mockResolvedValueOnce({ rows: [{ name: "Canvas Tote", quantity: 2 }] });
    await markShipped(form({ orderId: "42", carrier: "PostNord", trackingNumber: " 00123 " }));

    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("fulfillment_status = 'paid'");
    expect(params).toEqual([42, "PostNord", "00123"]);
    expect(sendCustomerEmail).toHaveBeenCalledTimes(1);
    const [message, internal] = sendCustomerEmail.mock.calls[0];
    expect(message.to).toBe("anna@example.com");
    expect(message.subject).toContain("KDC-00042");
    expect(message.html).toContain("00123");
    expect(message.text).toContain("2 × Canvas Tote");
    expect(internal).toEqual({ tag: "SHIPPED", orderRef: "KDC-00042" });
  });

  it("works without carrier or tracking", async () => {
    query.mockResolvedValueOnce({ rows: [shippedRow] }).mockResolvedValueOnce({ rows: [] });
    await markShipped(form({ orderId: "42", carrier: "", trackingNumber: "" }));
    expect(query.mock.calls[0][1]).toEqual([42, null, null]);
    expect(sendCustomerEmail).toHaveBeenCalledTimes(1);
  });

  it("sends nothing when the update changed no row (double click, already refunded)", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    await markShipped(form({ orderId: "42" }));
    expect(sendCustomerEmail).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("sends nothing for an order without a customer email", async () => {
    query.mockResolvedValueOnce({ rows: [{ ...shippedRow, customer_email: null }] });
    await markShipped(form({ orderId: "42" }));
    expect(sendCustomerEmail).not.toHaveBeenCalled();
  });

  it("ignores a bad order id without touching the database", async () => {
    await markShipped(form({ orderId: "abc" }));
    expect(query).not.toHaveBeenCalled();
  });

  it("a failed email is logged and shown, and the shipped mark stays", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    query.mockResolvedValueOnce({ rows: [shippedRow] }).mockResolvedValueOnce({ rows: [] });
    sendCustomerEmail.mockRejectedValueOnce(new Error("bounced"));
    await expect(markShipped(form({ orderId: "42" }))).rejects.toThrow(
      "NEXT_REDIRECT /admin/orders?shipEmail=failed&order=KDC-00042",
    );
    expect(log).toHaveBeenCalled();
    // The only write is the UPDATE; nothing reverts it.
    expect(query.mock.calls.filter(([sql]) => /^\s*(UPDATE|DELETE)/i.test(sql))).toHaveLength(1);
    log.mockRestore();
  });
});
