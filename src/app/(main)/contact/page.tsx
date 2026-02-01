import { ContactForm } from "./contact-form";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const showSuccess = params.success === "1";

  return (
    <div className="flex-1 bg-background flex flex-col py-20">
      <div className="container-kansliet">
        <h1 className="text-caps mb-12 text-lg font-light tracking-wide">
          CONTACT
        </h1>

        {showSuccess && (
          <div className="mb-12 border-brutal bg-foreground/5 p-6">
            <p className="text-normal-case text-base font-light">
              Thank you for your message. We&apos;ll get back to you within 24
              hours.
            </p>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-caps mb-6 text-sm font-normal tracking-wider">
              GET IN TOUCH
            </h2>
            <div className="text-normal-case space-y-4 text-base font-light leading-relaxed">
              <p>
                Interested in working together? Send us a message and we&apos;ll
                get back to you within 24 hours.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <h3 className="text-caps text-sm font-normal tracking-wider mb-2">
                  EMAIL
                </h3>
                <a
                  href="mailto:desk@kansliet.co"
                  className="text-normal-case text-base font-light hover:opacity-60 transition-opacity"
                >
                  desk@kansliet.co
                </a>
              </div>

              <div>
                <h3 className="text-caps text-sm font-normal tracking-wider mb-2">
                  SOCIAL
                </h3>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://instagram.com/kansliet.co"
                    className="text-normal-case text-base font-light hover:opacity-60 transition-opacity"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://linkedin.com/company/kansliet"
                    className="text-normal-case text-base font-light hover:opacity-60 transition-opacity"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
