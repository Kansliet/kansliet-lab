import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b-brutal py-20">
        <div className="container-kansliet">
          <h1 className="text-caps mb-12 text-lg font-light tracking-wide">
            STUDIO
          </h1>

          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-caps mb-6 text-sm font-normal tracking-wider">
                ABOUT KANSLIET
              </h2>
              <div className="text-normal-case space-y-4 text-base font-light leading-relaxed">
                <p>
                  Kansliet is a Swedish design company working in industrial,
                  spatial, and identity design. We make things that shape how
                  brands move in the real world.
                </p>
                <p>
                  Our approach is rooted in brutalist principles: honesty in
                  materials, clarity in function, and respect for the industrial
                  process. We believe good design doesn't need ornament—it needs
                  precision, purpose, and attention to detail.
                </p>
                <p>
                  Founded in 2020, we've worked with clients across Europe and
                  North America, delivering projects that range from product
                  design to complete brand systems.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-caps mb-6 text-sm font-normal tracking-wider">
                  SERVICES
                </h2>
                <div className="space-y-3">
                  <div className="border-b-brutal pb-3">
                    <h3 className="text-caps text-sm font-normal tracking-wider">
                      INDUSTRIAL DESIGN
                    </h3>
                    <p className="text-normal-case text-sm font-light opacity-60 mt-1">
                      Product design, prototyping, manufacturing support
                    </p>
                  </div>
                  <div className="border-b-brutal pb-3">
                    <h3 className="text-caps text-sm font-normal tracking-wider">
                      SPATIAL DESIGN
                    </h3>
                    <p className="text-normal-case text-sm font-light opacity-60 mt-1">
                      Interior architecture, retail environments, exhibitions
                    </p>
                  </div>
                  <div className="border-b-brutal pb-3">
                    <h3 className="text-caps text-sm font-normal tracking-wider">
                      BRAND IDENTITY
                    </h3>
                    <p className="text-normal-case text-sm font-light opacity-60 mt-1">
                      Visual systems, packaging, digital presence
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-caps mb-6 text-sm font-normal tracking-wider">
                  LOCATION
                </h2>
                <p className="text-normal-case text-base font-light">
                  Stockholm, Sweden
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
