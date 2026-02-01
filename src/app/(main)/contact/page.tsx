import { ContactForm } from "./contact-form";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const showSuccess = params.success === "1";

  return (
    <div className="flex-1 bg-background flex flex-col py-20 min-h-0">
      <div className="container-kansliet">
        {/* Page Title */}
        <h1 className="text-caps mb-12 text-lg font-light tracking-wide">
          CONTACT
        </h1>

        {/* Success Banner */}
        {showSuccess && (
          <div className="mb-12 border border-signal bg-signal text-white p-6">
            <p className="text-caps text-sm tracking-widest font-bold mb-1">
              STATUS: RECEIVED
            </p>
            <p className="text-normal-case text-sm font-light opacity-90">
              Your transmission has been logged. Stand by for response within 24
              hours.
            </p>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column: Info & Links */}
          <div className="flex flex-col gap-10">
            {/* Intro Text */}
            <div>
              <h2 className="text-caps mb-4 text-sm font-normal tracking-wider opacity-70">
                GET IN TOUCH
              </h2>
              <p className="text-normal-case text-base font-light leading-relaxed max-w-md">
                Interested in working together? Send us a message and we&apos;ll
                get back to you within 24 hours.
              </p>
            </div>

            {/* Contact Details - FORCED COLUMN LAYOUT */}
            <div className="space-y-8">
              {/* Email Block */}
              <div className="flex flex-col gap-2">
                <h3 className="text-caps text-sm font-normal tracking-wider opacity-70">
                  EMAIL
                </h3>
                <a
                  href="mailto:desk@kansliet.co"
                  className="text-normal-case text-base font-light hover:opacity-60 transition-opacity w-fit"
                >
                  desk@kansliet.co
                </a>
              </div>

              {/* Social Block */}
              <div className="flex flex-col gap-2">
                <h3 className="text-caps text-sm font-normal tracking-wider opacity-70">
                  SOCIAL
                </h3>
                <div className="flex flex-col gap-1">
                  <a
                    href="https://instagram.com/kansliet.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-normal-case text-base font-light hover:opacity-60 transition-opacity w-fit"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://linkedin.com/company/kansliet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-normal-case text-base font-light hover:opacity-60 transition-opacity w-fit"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: The Form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
