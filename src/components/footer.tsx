import { Link } from "@/components/ui/link";

export function Footer() {
  return (
    <footer className="border-t-brutal py-8">
      <div className="container-kansliet">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-caps text-sm font-light tracking-wider opacity-60 mb-3">
              IDN-2526-K(DC)SYS
            </p>
            <p className="text-normal-case text-sm font-light opacity-60 max-w-md">
              AUTHORIZED BY KANSLIET, SWEDEN. ALL DATA, STATEMENTS, AND
              FORMULATIONS ARE TO BE INTERPRETED AS INDICATIVE ONLY. DOCUMENTED
              FOR INTERNAL DISTRIBUTION AND ARCHIVAL PURPOSES.
            </p>
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
              <Link
                href="mailto:desk@kansliet.co"
                variant="underline"
                className="text-sm"
              >
                desk@kansliet.co
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
