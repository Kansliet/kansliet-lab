import { Link } from "next-view-transitions";
import { logout } from "@/app/(main)/login/actions";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  { href: "/admin/orders", label: "ORDERS" },
  { href: "/admin/products", label: "PRODUCTS" },
] as const;

/** Header shared by the admin pages: section tabs, then log out. */
export function AdminNav({ active }: { active: (typeof SECTIONS)[number]["label"] }) {
  return (
    <div className="mb-12 flex items-baseline justify-between gap-6">
      <nav className="flex items-baseline gap-4">
        {SECTIONS.map((section) =>
          section.label === active ? (
            <h1 key={section.href} className="dossier-label">
              {section.label}
            </h1>
          ) : (
            <Link
              key={section.href}
              href={section.href}
              className="text-caps text-sm font-light tracking-wider opacity-60 transition-opacity hover:opacity-100"
            >
              {section.label}
            </Link>
          )
        )}
      </nav>
      <form action={logout}>
        <Button type="submit" variant="ghost" className="px-0 py-0">
          LOG OUT
        </Button>
      </form>
    </div>
  );
}
