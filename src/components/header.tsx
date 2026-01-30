import { Link } from "@/components/ui/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b-brutal bg-background">
      <div className="container-kansliet">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-caps text-lg font-light tracking-wider hover:opacity-100"
          >
            KANSLIET
          </Link>
          <nav className="flex gap-8">
            <Link href="/projects" variant="nav">
              WORK
            </Link>
            <Link href="/studio" variant="nav">
              STUDIO
            </Link>
            <Link href="/contact" variant="nav">
              CONTACT
            </Link>
            <Link href="/catalog" variant="nav">
              CATALOG
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
