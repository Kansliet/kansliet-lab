import { ContactForm } from "./contact-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KANSLIET (CONTACT)",
  description:
    "Get in touch with Kansliet. Send a message for project inquiries, collaborations, or general questions. We respond within 24 hours.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const showSuccess = params.success === "1";

  return (
    // Mobile: py-10 / Desktop: py-20
    <div className="flex-1 bg-background flex flex-col py-10 lg:py-20 min-h-0">
      <div className="container-kansliet">
        {/* Page Title: Mobile: text-3xl / Desktop: text-4xl */}
        <h1 className="text-3xl lg:text-4xl uppercase tracking-tight font-normal mb-10 lg:mb-20">
          CONTACT
        </h1>

        {/* Success Banner */}
        {showSuccess && (
          <div className="mb-10 lg:mb-12 border border-signal bg-signal text-white p-6">
            <p className="text-caps text-sm tracking-widest font-bold mb-1">
              STATUS: RECEIVED
            </p>
            <p className="text-normal-case text-sm font-light opacity-90">
              Your transmission has been logged. Stand by for response within 24
              hours.
            </p>
          </div>
        )}

        <div className="grid gap-10 lg:gap-12 lg:grid-cols-2">
          {/* Left Column: Info & Links */}
          <div className="flex flex-col gap-10 lg:gap-16 order-2 lg:order-1">
            {/* Intro Text */}
            <div>
              <h2 className="text-dossier text-caps tracking-widest opacity-50 mb-4 lg:mb-6">
                GET IN TOUCH
              </h2>
              {/* Mobile: text-base / Desktop: text-lg */}
              <p className="text-normal-case text-base lg:text-lg font-light leading-relaxed max-w-md">
                Interested in working together? Send us a message and we&apos;ll
                get back to you within 24 hours.
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-6">
              {/* Email Block - Added flex-wrap for safety */}
              <div className="flex flex-wrap items-baseline gap-4">
                <span className="text-dossier text-caps tracking-widest opacity-50 shrink-0">
                  EMAIL
                </span>
                <a
                  href="mailto:desk@kansliet.co"
                  className="text-normal-case text-base font-light hover:opacity-60 transition-opacity break-all"
                >
                  desk@kansliet.co
                </a>
              </div>

              {/* Social Block */}
              <div className="flex items-baseline gap-4">
                <span className="text-dossier text-caps tracking-widest opacity-50 shrink-0">
                  SOCIAL
                </span>
                <div className="flex flex-col gap-1">
                  <a
                    href="https://instagram.com/kansliet.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-normal-case text-base font-light hover:opacity-60 transition-opacity"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://linkedin.com/company/kansliet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-normal-case text-base font-light hover:opacity-60 transition-opacity"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: The Form */}
          <div className="order-1 lg:order-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
