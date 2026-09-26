import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { currentMonth, loadMomsRows } from "@/lib/moms-data";
import { kronor, parsePeriod, rowsIn, summarize, thresholds, type Period } from "@/lib/moms";
import { AdminNav } from "../admin-nav";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "KANSLIET (MOMS)",
  robots: { index: false },
};

// Plain uppercase, not .text-caps: its display: inline-block breaks table cell layout.
const TH = "px-4 py-3 text-sm font-light uppercase tracking-wider opacity-60";
const TD = "px-4 py-2 tabular-nums";
const NUM = `${TD} text-right whitespace-nowrap`;

/** The last 12 months, then the quarters and years of this year and last, newest first. */
function periodOptions(now: string): Period[] {
  const [y, m] = now.split("-").map(Number);
  const out: Period[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(parsePeriod(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`)!);
  }
  for (const year of [y, y - 1]) {
    for (let q = 4; q >= 1; q--) {
      if (year === y && (q - 1) * 3 + 1 > m) continue;
      out.push(parsePeriod(`${year}-Q${q}`)!);
    }
    out.push(parsePeriod(String(year))!);
  }
  return out;
}

function Kr({ ore }: { ore: number }) {
  return <>{kronor(ore)} kr</>;
}

export default async function MomsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireSession();
  const now = currentMonth();
  const period = parsePeriod((await searchParams).period ?? now) ?? parsePeriod(now)!;
  const { rows: all, otherCurrency } = await loadMomsRows();
  const rows = rowsIn(all, period);
  const excluded = otherCurrency.filter((o) => o.date >= period.from && o.date <= period.to);
  const s = summarize(rows);
  const year = period.to.slice(0, 4);
  const t = thresholds(all, year);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet space-y-12">
          <AdminNav active="MOMS" />

          {/* Period: a GET form, so the URL is shareable and the CSV link follows it. */}
          <form className="flex flex-wrap items-end gap-4" method="get">
            <label className="space-y-2">
              <span className="dossier-label block">PERIOD</span>
              <select
                name="period"
                defaultValue={period.id}
                className="block border border-foreground bg-transparent px-3 py-2 text-sm uppercase tracking-wider"
              >
                {periodOptions(now).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="secondary" size="sm">
              SHOW
            </Button>
            <Link
              href={`/admin/moms/csv?period=${encodeURIComponent(period.id)}`}
              className="text-caps ml-auto text-sm font-light tracking-wider transition-opacity hover:opacity-60"
            >
              DOWNLOAD CSV ↓
            </Link>
          </form>

          <p className="text-dossier uppercase tracking-wider opacity-60">
            {period.label} · {period.from} – {period.to} · {s.sales} {s.sales === 1 ? "SALE" : "SALES"} · {s.refunds}{" "}
            {s.refunds === 1 ? "REFUND" : "REFUNDS"} · AMOUNTS IN SEK
          </p>
          {excluded.length > 0 && (
            <p role="status" className="border border-foreground p-4 text-sm font-light">
              Not in this report (not in SEK, so book them by hand):{" "}
              {excluded.map((o) => `${o.ref} (${o.currency}, ${o.date})`).join(", ")}.
            </p>
          )}

          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-3">
              <span className="dossier-label">MOMSDEKLARATION</span>
              <table className="w-full border-brutal text-sm">
                <tbody>
                  <tr>
                    <td className={TD}>05 · Momspliktig försäljning</td>
                    <td className={NUM}><Kr ore={s.deklaration.ruta05} /></td>
                  </tr>
                  <tr className="border-t border-foreground/15">
                    <td className={TD}>10 · Utgående moms 25 %</td>
                    <td className={NUM}><Kr ore={s.deklaration.ruta10} /></td>
                  </tr>
                  <tr className="border-t border-foreground/15">
                    <td className={TD}>36 · Försäljning av varor utanför EU</td>
                    <td className={NUM}><Kr ore={s.deklaration.ruta36} /></td>
                  </tr>
                </tbody>
              </table>
              <p className="text-normal-case text-sm font-light opacity-60">
                Skatteverket wants whole kronor. Sales only: add purchases and Stripe&apos;s fees from your
                bookkeeping.
              </p>
            </div>

            <div className="space-y-3">
              <span className="dossier-label">VERIFIKATION (FORTNOX)</span>
              {s.verifikation.length === 0 ? (
                <p className="text-sm font-light opacity-60">Nothing to book this period.</p>
              ) : (
                <table className="w-full border-brutal text-sm">
                  <thead>
                    <tr className="border-b border-foreground">
                      <th className={`${TH} text-left`}>KONTO</th>
                      <th className={`${TH} text-right`}>DEBET</th>
                      <th className={`${TH} text-right`}>KREDIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.verifikation.map((line, i) => (
                      <tr key={line.account} className={i > 0 ? "border-t border-foreground/15" : ""}>
                        <td className={TD}>
                          {line.account} <span className="font-light opacity-60">{line.name}</span>
                        </td>
                        <td className={NUM}>{line.debit ? <Kr ore={line.debit} /> : ""}</td>
                        <td className={NUM}>{line.credit ? <Kr ore={line.credit} /> : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-normal-case text-sm font-light opacity-60">
                A suggestion (BAS). Stripe&apos;s payouts to the bank and its fees are separate entries, from
                Stripe&apos;s reports. Confirm the accounts with your accountant once.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="dossier-label">THRESHOLDS {t.year}, YEAR TO DATE</span>
            <table className="w-full border-brutal text-sm">
              <tbody>
                <tr>
                  <td className={TD}>
                    EU outside Sweden, excl. VAT{" "}
                    <span className="font-light opacity-60">
                      · over €10,000 a year: register for OSS and charge each country&apos;s VAT
                    </span>
                  </td>
                  <td className={NUM}><Kr ore={t.euCrossBorderNet} /></td>
                </tr>
                <tr className="border-t border-foreground/15">
                  <td className={TD}>
                    Norway{" "}
                    <span className="font-light opacity-60">
                      · over NOK 50,000 a year: register for VOEC and charge Norwegian VAT at checkout
                    </span>
                  </td>
                  <td className={NUM}><Kr ore={t.norwayGross} /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <span className="dossier-label">ROWS</span>
            {rows.length === 0 ? (
              <div className="border-brutal p-10 text-center">
                <p className="text-caps text-sm font-light tracking-wider opacity-60">NO SALES OR REFUNDS IN THIS PERIOD.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border-brutal">
                <table className="w-full text-left text-sm">
                  <thead className="border-b-brutal">
                    <tr>
                      <th className={TH}>DATE</th>
                      <th className={TH}>ORDER</th>
                      <th className={TH}>TYPE</th>
                      <th className={TH}>COUNTRY</th>
                      <th className={`${TH} text-right`}>INCL. VAT</th>
                      <th className={`${TH} text-right`}>VAT</th>
                      <th className={`${TH} text-right`}>EXCL. VAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`${r.ref}-${r.kind}`} className={i > 0 ? "border-t border-foreground/15" : ""}>
                        <td className={TD}>{r.date}</td>
                        <td className={TD}>{r.ref}</td>
                        <td className={`${TD} uppercase`}>{r.kind === "sale" ? "Sale" : "Refund"}</td>
                        <td className={TD}>
                          {r.country || "—"}{" "}
                          <span className="font-light opacity-60">{r.treatment === "vat25" ? "25 %" : "EXPORT"}</span>
                        </td>
                        <td className={NUM}><Kr ore={r.gross} /></td>
                        <td className={NUM}><Kr ore={r.vat} /></td>
                        <td className={NUM}><Kr ore={r.net} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
