import { requireSession } from "@/lib/auth";
import { currentMonth, loadMomsRows } from "@/lib/moms-data";
import { momsCsv, parsePeriod, rowsIn } from "@/lib/moms";

/** The moms report's rows for one period, as a Swedish-locale CSV download. */
export async function GET(req: Request) {
  await requireSession();
  const requested = new URL(req.url).searchParams.get("period") ?? currentMonth();
  const period = parsePeriod(requested);
  if (!period) return new Response("Unknown period", { status: 400 });
  const { rows } = await loadMomsRows();
  const csv = momsCsv(rowsIn(rows, period));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kansliet-moms-${period.id}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
