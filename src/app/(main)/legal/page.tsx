import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KANSLIET (LEGAL)",
  description: "Legal information and cookie policy for Kansliet.",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <div className="flex-1 bg-background flex flex-col py-10 lg:py-20">
      <div className="container-kansliet max-w-2xl">
        <h1 className="text-3xl lg:text-4xl uppercase tracking-tight font-normal mb-10 lg:mb-20">
          LEGAL
        </h1>
        <div className="space-y-10 text-normal-case text-base font-light leading-relaxed">
          <section>
            <h2 className="dossier-label mb-4">
              COOKIES
            </h2>
            <p>
              We use analytics cookies (Google Analytics) to understand how
              visitors use this site. These cookies are only set after you
              explicitly accept via the consent banner. You can decline at any
              time and no analytics data will be collected. You can also clear
              previously given consent by clearing your browser&apos;s local
              storage for this site.
            </p>
          </section>
          <section>
            <h2 className="dossier-label mb-4">
              CONTACT
            </h2>
            <p>
              For questions about data or this policy, contact{" "}
              <a
                href="mailto:desk@kansliet.co"
                className="underline hover:opacity-60"
              >
                desk@kansliet.co
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
