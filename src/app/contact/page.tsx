import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b-brutal py-20">
        <div className="container-kansliet">
          <h1 className="text-caps mb-12 text-lg font-light tracking-wide">
            CONTACT
          </h1>

          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-caps mb-6 text-sm font-normal tracking-wider">
                GET IN TOUCH
              </h2>
              <div className="text-normal-case space-y-4 text-base font-light leading-relaxed">
                <p>
                  Interested in working together? Send us a message and we'll
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
              <form className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="text-caps block mb-2 text-sm font-normal tracking-wider"
                  >
                    NAME
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="YOUR NAME"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="text-caps block mb-2 text-sm font-normal tracking-wider"
                  >
                    EMAIL
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="YOUR@EMAIL.COM"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="text-caps block mb-2 text-sm font-normal tracking-wider"
                  >
                    COMPANY
                  </label>
                  <Input id="company" type="text" placeholder="YOUR COMPANY" />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="text-caps block mb-2 text-sm font-normal tracking-wider"
                  >
                    MESSAGE
                  </label>
                  <Textarea
                    id="message"
                    placeholder="TELL US ABOUT YOUR PROJECT"
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  SEND MESSAGE
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
