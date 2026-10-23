import { describe, it, expect } from "vitest";
import { includedVat } from "./order-email";
import {
  kronor,
  momsCsv,
  momsRows,
  parsePeriod,
  rowsIn,
  summarize,
  swedishDate,
  thresholds,
  vatTreatment,
  type MomsOrder,
} from "./moms";

const order = (o: Partial<MomsOrder>): MomsOrder => ({
  ref: "KDC-00001",
  createdAt: new Date("2026-09-26T16:23:12Z"),
  country: "SE",
  amountTotal: 10900,
  itemsTotal: 5000,
  refunds: [],
  ...o,
});

describe("moms", () => {
  it("treats Sweden and the EU as 25% VAT, Norway as export, unknown as 25%", () => {
    expect(vatTreatment("SE")).toBe("vat25");
    expect(vatTreatment("de")).toBe("vat25");
    expect(vatTreatment("FI")).toBe("vat25");
    expect(vatTreatment("NO")).toBe("export");
    expect(vatTreatment("GB")).toBe("export");
    expect(vatTreatment(null)).toBe("vat25");
  });

  it("matches the first real order: 109 kr incl. 21,80 kr VAT, 59 kr shipping", () => {
    const [row] = momsRows([order({})]);
    expect(row).toMatchObject({ date: "2026-09-26", kind: "sale", gross: 10900, shipping: 5900, vat: 2180, net: 8720 });
  });

  it("books a refund in the month it happens, reversing its own VAT", () => {
    const rows = momsRows([
      order({ createdAt: new Date("2026-09-30T10:00:00Z"), refunds: [{ amount: 10900, at: new Date("2026-10-02T09:00:00Z") }] }),
    ]);
    expect(rows.map((r) => [r.date, r.kind, r.gross, r.vat])).toEqual([
      ["2026-09-30", "sale", 10900, 2180],
      ["2026-10-02", "refund", -10900, -2180],
    ]);
    const sep = summarize(rowsIn(rows, parsePeriod("2026-09")!));
    const oct = summarize(rowsIn(rows, parsePeriod("2026-10")!));
    expect(sep.deklaration).toEqual({ ruta05: 8720, ruta10: 2180, ruta36: 0 });
    expect(oct.deklaration).toEqual({ ruta05: -8720, ruta10: -2180, ruta36: 0 });
    // Across both months it nets to nothing.
    expect(summarize(rows).vat25).toEqual({ gross: 0, vat: 0, net: 0 });
  });

  it("reverses only the refunded share on a partial refund", () => {
    const rows = momsRows([order({ refunds: [{ amount: 5000, at: new Date("2026-09-27T10:00:00Z") }] })]);
    expect(summarize(rows).vat25).toEqual({ gross: 5900, vat: 2180 - 1000, net: 5900 - 1180 });
  });

  it("books two partial refunds in different months each in its own month", () => {
    const rows = momsRows([
      order({
        createdAt: new Date("2026-09-20T10:00:00Z"),
        refunds: [
          { amount: 2500, at: new Date("2026-09-29T10:00:00Z") },
          { amount: 5000, at: new Date("2026-10-05T10:00:00Z") },
        ],
      }),
    ]);
    expect(rows.map((r) => [r.date, r.kind, r.gross, r.vat])).toEqual([
      ["2026-09-20", "sale", 10900, 2180],
      ["2026-09-29", "refund", -2500, -500],
      ["2026-10-05", "refund", -5000, -1000],
    ]);
    expect(summarize(rowsIn(rows, parsePeriod("2026-09")!)).vat25).toEqual({ gross: 8400, vat: 1680, net: 6720 });
    expect(summarize(rowsIn(rows, parsePeriod("2026-10")!)).vat25).toEqual({ gross: -5000, vat: -1000, net: -4000 });
  });

  it("gives the same rows as the old cumulative model for an order with a single refund", () => {
    // The pre-ledger behaviour: one refund row from amount_refunded / refunded_at (else created_at).
    const oldRows = (o: MomsOrder, amountRefunded: number, refundedAt: Date | null) => {
      const treatment = vatTreatment(o.country);
      const vat = treatment === "vat25" ? includedVat(amountRefunded) : 0;
      return {
        date: swedishDate(refundedAt ?? o.createdAt),
        ref: o.ref,
        kind: "refund",
        country: o.country?.toUpperCase() ?? "",
        treatment,
        gross: -amountRefunded,
        shipping: 0,
        vat: -vat,
        net: -(amountRefunded - vat),
      };
    };
    const cases: [Partial<MomsOrder>, number, Date | null][] = [
      [{}, 10900, new Date("2026-10-02T09:00:00Z")],
      [{}, 5000, new Date("2026-09-30T22:30:00Z")],
      [{ country: "DE" }, 3333, new Date("2026-11-01T00:30:00Z")],
      [{ country: "NO" }, 10900, new Date("2026-10-15T12:00:00Z")],
      [{ country: null }, 1, null],
    ];
    for (const [overrides, amount, at] of cases) {
      const base = order(overrides);
      const [, newRefund] = momsRows([order({ ...overrides, refunds: [{ amount, at: at ?? base.createdAt }] })]);
      expect(newRefund).toEqual(oldRows(base, amount, at));
    }
  });

  it("puts Norway in ruta 36 with no VAT", () => {
    const s = summarize(momsRows([order({ country: "NO", amountTotal: 19900, itemsTotal: 5000 })]));
    expect(s.deklaration).toEqual({ ruta05: 0, ruta10: 0, ruta36: 19900 });
    expect(s.vat25.vat).toBe(0);
  });

  it("dates by Swedish time: 23:30 UTC on 30 Sep is already 1 October in Sweden", () => {
    expect(swedishDate(new Date("2026-09-30T22:30:00Z"))).toBe("2026-10-01");
    const rows = momsRows([order({ createdAt: new Date("2026-09-30T22:30:00Z") })]);
    expect(rowsIn(rows, parsePeriod("2026-09")!)).toHaveLength(0);
    expect(rowsIn(rows, parsePeriod("2026-10")!)).toHaveLength(1);
  });

  it("parses months, quarters and years, rejecting nonsense", () => {
    expect(parsePeriod("2026-02")).toMatchObject({ from: "2026-02-01", to: "2026-02-28" });
    expect(parsePeriod("2028-02")).toMatchObject({ to: "2028-02-29" });
    expect(parsePeriod("2026-Q3")).toMatchObject({ from: "2026-07-01", to: "2026-09-30", label: "2026 Q3" });
    expect(parsePeriod("2026")).toMatchObject({ from: "2026-01-01", to: "2026-12-31" });
    expect(parsePeriod("2026-13")).toBeNull();
    expect(parsePeriod("x")).toBeNull();
  });

  it("builds a balanced verifikation", () => {
    const s = summarize(momsRows([order({}), order({ ref: "KDC-00002", country: "NO", amountTotal: 19900 })]));
    const debit = s.verifikation.reduce((a, l) => a + l.debit, 0);
    const credit = s.verifikation.reduce((a, l) => a + l.credit, 0);
    expect(debit).toBe(credit);
    expect(s.verifikation.map((l) => l.account)).toEqual(["1580", "3001", "2611", "3105"]);
  });

  it("tracks the OSS (EU outside Sweden, excl. VAT) and VOEC (Norway) totals for the year", () => {
    const rows = momsRows([
      order({ country: "SE" }),
      order({ ref: "KDC-00002", country: "DE", amountTotal: 12500 }),
      order({ ref: "KDC-00003", country: "NO", amountTotal: 19900 }),
      order({ ref: "KDC-00004", country: "DK", amountTotal: 12500, createdAt: new Date("2025-06-01T10:00:00Z") }),
    ]);
    expect(thresholds(rows, "2026")).toEqual({ year: "2026", euCrossBorderNet: 10000, norwayGross: 19900 });
  });

  it("writes a Swedish CSV: BOM, semicolons, decimal commas", () => {
    const csv = momsCsv(momsRows([order({})]));
    expect(csv.startsWith("﻿Datum;Order;Typ;")).toBe(true);
    expect(csv).toContain("2026-09-26;KDC-00001;Försäljning;SE;25 % svensk moms;109,00;59,00;21,80;87,20");
    expect(kronor(-5)).toBe("-0,05");
  });
});
