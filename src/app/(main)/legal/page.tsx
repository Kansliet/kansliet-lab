import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KANSLIET (LEGAL)",
  description: "Legal information and cookie policy for Kansliet.",
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
            <h2 className="text-caps text-sm font-normal tracking-wider mb-4">
              COOKIES
            </h2>
            <p>
              This site may use cookies for analytics and to improve your
              experience. By using the site you consent to our use of cookies as
              described in this policy. You can manage preferences via your
              browser settings.
            </p>
          </section>
          <section>
            <h2 className="text-caps text-sm font-normal tracking-wider mb-4">
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
