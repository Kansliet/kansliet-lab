import Link from "next/link";
import Image from "next/image";
import { FullscreenMenu } from "@/components/fullscreen-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b-brutal bg-background">
      <div className="container-kansliet">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="hover:opacity-60 transition-opacity">
            <Image
              src="/kansliet-logo-navbar-web.svg"
              alt="Kansliet"
              width={250}
              height={0}
              style={{ height: "auto" }}
              priority
            />
          </Link>
          <FullscreenMenu />
        </div>
      </div>
    </header>
  );
}
