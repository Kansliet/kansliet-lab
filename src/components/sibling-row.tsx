import Image from "next/image";
import Link from "next/link";

export type Sibling = {
  href: string;
  label: string;
  image: string | null;
  current: boolean;
};

/**
 * The row of small monochrome plates on a detail page's axis: every sibling
 * project or product, the current one in colour. Replaces page counters and
 * previous/next links — the whole set is one glance away.
 */
export function SiblingRow({ items, label }: { items: Sibling[]; label: string }) {
  return (
    <nav aria-label={label} className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-1.5 py-1">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-label={item.label}
              aria-current={item.current ? "page" : undefined}
              data-active={item.current}
              className="plate relative block h-14 w-11 bg-foreground/10 data-[active=true]:outline data-[active=true]:outline-1 data-[active=true]:outline-offset-2 data-[active=true]:outline-foreground"
            >
              {item.image ? (
                <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center p-0.5 text-center text-[0.4rem] uppercase leading-tight opacity-60">
                  {item.label}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
