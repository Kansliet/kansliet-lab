// The store's VAT (moms) bookkeeping: turns orders and refunds into what the
// momsdeklaration and Fortnox need. Pure (no DB, no Stripe) so it's tested.
//
// Treatment, per the store's setup (see shop-info.ts and the terms):
// - Sweden and other EU countries: prices include 25% Swedish VAT. Correct
//   while EU cross-border sales stay under the €10,000/yr OSS threshold;
//   the report tracks that total for the year.
// - Outside the EU (Norway): exported without Swedish VAT; the customer pays
//   import VAT on delivery. Tracked against Norway's NOK 50,000/yr VOEC limit.
// Shipping follows the goods. Refunds are booked in the month they happen.

import { includedVat } from "@/lib/order-email";

/** EU member states (ISO 3166-1 alpha-2). */
export const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

export type VatTreatment = "vat25" | "export";

/** Sweden and the EU: 25% Swedish VAT included. Elsewhere: export, no VAT. Unknown: 25% (the safe side). */
export function vatTreatment(country: string | null | undefined): VatTreatment {
  if (!country) return "vat25";
  return EU_COUNTRIES.has(country.toUpperCase()) ? "vat25" : "export";
}

export type MomsOrder = {
  ref: string;
  createdAt: Date;
  country: string | null;
  /** Öre, VAT included: what the customer paid (goods + shipping). */
  amountTotal: number;
  /** Öre: the goods lines (sum of unit × quantity); the rest of amountTotal is shipping. */
  itemsTotal: number;
  /** Öre, cumulative. */
  amountRefunded: number;
  refundedAt: Date | null;
};

export type MomsRow = {
  /** YYYY-MM-DD, Swedish time. */
  date: string;
  ref: string;
  kind: "sale" | "refund";
  country: string;
  treatment: VatTreatment;
  /** Öre, VAT included. Negative for refunds. */
  gross: number;
  /** Öre, part of gross. Sales only (0 for refunds). */
  shipping: number;
  vat: number;
  net: number;
};

/** A calendar date in Swedish time (the company's books follow Swedish dates, not UTC). */
export function swedishDate(when: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when);
}

export type Period = { id: string; label: string; from: string; to: string };

/** "2026-09" (a month), "2026-Q3" (a quarter) or "2026" (a year); dates inclusive, YYYY-MM-DD. */
export function parsePeriod(id: string): Period | null {
  let m = id.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const [year, month] = [Number(m[1]), Number(m[2])];
    if (month < 1 || month > 12) return null;
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const mm = String(month).padStart(2, "0");
    return { id, label: `${year}-${mm}`, from: `${year}-${mm}-01`, to: `${year}-${mm}-${last}` };
  }
  m = id.match(/^(\d{4})-Q([1-4])$/);
  if (m) {
    const [year, q] = [Number(m[1]), Number(m[2])];
    const first = (q - 1) * 3 + 1;
    const lastMonth = first + 2;
    const last = new Date(Date.UTC(year, lastMonth, 0)).getUTCDate();
    const pad = (n: number) => String(n).padStart(2, "0");
    return { id, label: `${year} Q${q}`, from: `${year}-${pad(first)}-01`, to: `${year}-${pad(lastMonth)}-${last}` };
  }
  m = id.match(/^(\d{4})$/);
  if (m) return { id, label: m[1], from: `${m[1]}-01-01`, to: `${m[1]}-12-31` };
  return null;
}

function split(gross: number, treatment: VatTreatment) {
  const vat = treatment === "vat25" ? includedVat(gross) : 0;
  return { vat, net: gross - vat };
}

/** One row per sale, and one per refund, dated when each happened. */
export function momsRows(orders: MomsOrder[]): MomsRow[] {
  const rows: MomsRow[] = [];
  for (const o of orders) {
    const treatment = vatTreatment(o.country);
    const country = o.country?.toUpperCase() ?? "";
    rows.push({
      date: swedishDate(o.createdAt),
      ref: o.ref,
      kind: "sale",
      country,
      treatment,
      gross: o.amountTotal,
      shipping: Math.max(0, o.amountTotal - o.itemsTotal),
      ...split(o.amountTotal, treatment),
    });
    if (o.amountRefunded > 0) {
      // VAT on a refund is the refund's own included VAT, so a partial refund
      // reverses exactly its share (the email's VAT figure works the same way).
      const refund = split(o.amountRefunded, treatment);
      rows.push({
        date: swedishDate(o.refundedAt ?? o.createdAt),
        ref: o.ref,
        kind: "refund",
        country,
        treatment,
        gross: -o.amountRefunded,
        shipping: 0,
        vat: -refund.vat,
        net: -refund.net,
      });
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref) || (a.kind === "sale" ? -1 : 1));
}

export function rowsIn(rows: MomsRow[], period: Period): MomsRow[] {
  return rows.filter((r) => r.date >= period.from && r.date <= period.to);
}

export type MomsSummary = {
  /** Sweden + EU, 25% VAT included. */
  vat25: { gross: number; vat: number; net: number };
  /** Outside the EU: no Swedish VAT. */
  exportGross: number;
  sales: number;
  refunds: number;
  /** Momsdeklaration boxes (öre; Skatteverket wants whole kronor). */
  deklaration: {
    /** Ruta 05: momspliktig försäljning (excl. VAT). */
    ruta05: number;
    /** Ruta 10: utgående moms 25%. */
    ruta10: number;
    /** Ruta 36: försäljning av varor till land utanför EU. */
    ruta36: number;
  };
  /**
   * A suggested verifikation for the period (BAS kontoplan). Debit the Stripe
   * receivable with everything customers paid; credit sales and output VAT.
   * Stripe's fees and payouts are separate entries (from Stripe's reports).
   */
  verifikation: { account: string; name: string; debit: number; credit: number }[];
};

export function summarize(rows: MomsRow[]): MomsSummary {
  const vat25 = { gross: 0, vat: 0, net: 0 };
  let exportGross = 0;
  let sales = 0;
  let refunds = 0;
  for (const r of rows) {
    if (r.kind === "sale") sales++;
    else refunds++;
    if (r.treatment === "vat25") {
      vat25.gross += r.gross;
      vat25.vat += r.vat;
      vat25.net += r.net;
    } else {
      exportGross += r.gross;
    }
  }
  const total = vat25.gross + exportGross;
  const verifikation = [
    { account: "1580", name: "Fordringar för kontokort (Stripe)", debit: total, credit: 0 },
    { account: "3001", name: "Försäljning inom Sverige/EU, 25 % moms", debit: 0, credit: vat25.net },
    { account: "2611", name: "Utgående moms försäljning, 25 %", debit: 0, credit: vat25.vat },
    { account: "3105", name: "Försäljning varor till land utanför EU", debit: 0, credit: exportGross },
  ].filter((line) => line.debit !== 0 || line.credit !== 0);
  return {
    vat25,
    exportGross,
    sales,
    refunds,
    deklaration: { ruta05: vat25.net, ruta10: vat25.vat, ruta36: exportGross },
    verifikation,
  };
}

export type Thresholds = {
  year: string;
  /** Öre excl. VAT: sales to EU countries other than Sweden (OSS limit €10,000 excl. VAT per year). */
  euCrossBorderNet: number;
  /** Öre: sales to Norway (VOEC limit NOK 50,000 per year). */
  norwayGross: number;
};

/** Year-to-date totals that decide when OSS or VOEC registration is needed. */
export function thresholds(rows: MomsRow[], year: string): Thresholds {
  let euCrossBorderNet = 0;
  let norwayGross = 0;
  for (const r of rows) {
    if (!r.date.startsWith(`${year}-`)) continue;
    if (r.treatment === "vat25" && r.country && r.country !== "SE") euCrossBorderNet += r.net;
    if (r.country === "NO") norwayGross += r.gross;
  }
  return { year, euCrossBorderNet, norwayGross };
}

/** Öre as Swedish kronor text: 2180 → "21,80", -10900 → "-109,00". */
export function kronor(ore: number): string {
  const sign = ore < 0 ? "-" : "";
  const abs = Math.abs(ore);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

/**
 * The period's rows as a Swedish-locale CSV (semicolons, decimal commas, UTF-8
 * with BOM so Excel reads å/ä/ö), one row per sale or refund, for Fortnox or
 * the accountant.
 */
export function momsCsv(rows: MomsRow[]): string {
  const header = ["Datum", "Order", "Typ", "Land", "Momsbehandling", "Belopp inkl. moms", "Varav frakt", "Moms", "Belopp exkl. moms"];
  const lines = rows.map((r) =>
    [
      r.date,
      r.ref,
      r.kind === "sale" ? "Försäljning" : "Återbetalning",
      r.country,
      r.treatment === "vat25" ? "25 % svensk moms" : "Export utanför EU, 0 %",
      kronor(r.gross),
      kronor(r.shipping),
      kronor(r.vat),
      kronor(r.net),
    ].join(";"),
  );
  return "﻿" + [header.join(";"), ...lines].join("\r\n") + "\r\n";
}
