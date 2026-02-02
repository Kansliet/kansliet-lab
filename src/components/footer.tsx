import { Link } from "@/components/ui/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t-brutal bg-background shrink-0 pb-12">
      <div className="container-kansliet">
        {/* Top Section: Navigation & Identity */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 py-8">
          <p className="text-dossier text-caps tracking-wider opacity-60">
            IDN-2526-K(DC)SYS
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
            <div className="flex gap-6">
              <Link
                href="https://instagram.com/kansliet.co"
                variant="nav"
                target="_blank"
                rel="noopener noreferrer"
              >
                INSTAGRAM
              </Link>
              <Link
                href="https://www.linkedin.com/company/kansliet"
                variant="nav"
                target="_blank"
                rel="noopener noreferrer"
              >
                LINKEDIN
              </Link>
            </div>
            <a
              href="mailto:desk@kansliet.co"
              className="text-dossier text-caps tracking-wider opacity-60 hover:opacity-100 transition-opacity"
            >
              desk@kansliet.co
            </a>
          </div>
        </div>

        {/* Bottom Section: 
            - Mobile: Flex Column, Left Aligned (Text top, Logo bottom left)
            - Desktop: Flex Row, Justified Between (Text left, Logo right)
        */}
        <div className="border-t border-signal/10 pt-6 mt-2 flex flex-col items-start gap-8 lg:flex-row lg:justify-between lg:items-end lg:gap-6">
          {/* Left: Fine Print */}
          <div className="max-w-3xl space-y-1.5 select-none text-[8px] font-mono uppercase tracking-widest leading-none opacity-40">
            <p>AUTHORIZED BY KANSLIET (DESIGN COMPANY), SWEDEN.</p>
            <p>
              ALL DATA, STATEMENTS, AND FORMULATIONS ARE TO BE INTERPRETED AS
              INDICATIVE ONLY.
            </p>
            <p>DOCUMENTED FOR INTERNAL DISTRIBUTION AND ARCHIVAL PURPOSES.</p>
            <p>
              USE OUTSIDE THE ORIGINAL CONTEXT IS NOT RECOMMENDED BUT NOT
              PROHIBITED.
            </p>
            <p>
              ALL ELEMENTS CONTAINED HERE ARE PART OF A LARGER STRUCTURE WHICH
              MAY OR MAY NOT EXIST.
            </p>
          </div>

          {/* Right: Rotating Logo 
              - Mobile: Falls to the bottom, aligned left (because of items-start)
              - Desktop: Pushed to the right (because of justify-between)
          */}
          <div className="shrink-0">
            <Image
              src="/kansliet-logo-footer_1.svg"
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 animate-spin-slow block"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
