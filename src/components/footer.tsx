import { Link } from "@/components/ui/link";
import { RotatingLogo } from "@/components/rotating-logo";

export function Footer() {
  return (
    <footer className="border-t-brutal py-8 relative z-50 bg-background">
      <div className="container-kansliet">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex items-start gap-4">
            <RotatingLogo />
            <div>
              <p className="text-caps text-sm font-light tracking-wider opacity-60 mb-3">
                IDN-2526-K(DC)SYS
              </p>
              <p className="text-normal-case text-sm font-light opacity-60 max-w-md">
                AUTHORIZED BY KANSLIET, SWEDEN. ALL DATA, STATEMENTS, AND
                FORMULATIONS ARE TO BE INTERPRETED AS INDICATIVE ONLY.
                DOCUMENTED FOR INTERNAL DISTRIBUTION AND ARCHIVAL PURPOSES.
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="text-caps text-sm font-normal tracking-wider mb-3">
                FOLLOW US
              </h4>
              <div className="flex flex-col gap-2">
                <Link href="https://instagram.com" variant="nav">
                  INSTAGRAM
                </Link>
                <Link href="https://linkedin.com" variant="nav">
                  LINKEDIN
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-caps text-sm font-normal tracking-wider mb-3">
                GET IN TOUCH
              </h4>
              <a
                href="mailto:desk@kansliet.co"
                className="text-normal-case text-sm font-light hover:opacity-60 transition-opacity"
              >
                desk@kansliet.co
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
