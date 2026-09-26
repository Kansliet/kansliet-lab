import { cn } from "@/lib/utils";

/**
 * One compact spec sheet instead of label blocks spread across the page: a
 * single bordered element, a row per fact, like the data plate on a drawing.
 * Used by project (works/[id]) and product (store/[slug]) pages.
 */
export function SpecSheet({
  title,
  rows,
  className,
}: {
  title: string;
  rows: [label: string, value: React.ReactNode][];
  className?: string;
}) {
  return (
    <dl className={cn("max-w-md border-brutal text-sm", className)}>
      <div className="dossier-label block w-full">{title}</div>
      {rows.map(([label, value], index) => (
        <div
          key={label}
          className={`grid grid-cols-[7.5rem_1fr] gap-4 px-3 py-1.5 ${index > 0 ? "border-t border-foreground/15" : ""}`}
        >
          <dt className="font-light uppercase tracking-wider opacity-60">{label}</dt>
          <dd className="font-light uppercase tracking-wide">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
