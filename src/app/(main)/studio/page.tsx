import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KANSLIET (STUDIO)",
  description:
    "Kansliet is a Swedish design company working in industrial, spatial, and identity design. Our services include product design, spatial design, and brand identity. Based in Sweden.",
};

const clients = [
  { name: "Aimé Leon Dore", logo: "/clients/aime-leon-dore-logo-kansliet.svg" },
  { name: "ASICS", logo: "/clients/asics-logo-kansliet.svg" },
  { name: "Cannaluxe", logo: "/clients/cannaluxe-logo-kansliet.svg" },
  { name: "eBay", logo: "/clients/ebay-logo-kansliet.svg" },
  { name: "IKEA", logo: "/clients/ikea-logo-kansliet.svg" },
  { name: "LG", logo: "/clients/lg-logo-kansliet.svg" },
  { name: "Sweet Cheeks", logo: "/clients/sweet-cheeks-logo-kansliet.svg" },
  {
    name: "The Tinsel Rack",
    logo: "/clients/the-tinsel-rack-logo-kansliet.svg",
  },
  { name: "Waffries", logo: "/clients/waffries-logo-kansliet.svg" },
  { name: "Zalando", logo: "/clients/zalando-logo-kansliet.svg" },
];

export default function StudioPage() {
  return (
    // Mobile: py-10 / Desktop: py-20
    <div className="flex-1 bg-background flex flex-col py-10 lg:py-20">
      <div className="container-kansliet">
        {/* Mobile: text-3xl / Desktop: text-4xl */}
        <h1 className="text-3xl lg:text-4xl uppercase tracking-tight font-normal mb-10 lg:mb-20">
          STUDIO
        </h1>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* About Section */}
          <div>
            <h2 className="text-dossier text-caps tracking-widest opacity-50 mb-6">
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
                materials, clarity in function, and respect for the process. We
                believe good design doesn&apos;t need ornament, it needs
                precision, purpose, and attention to detail.
              </p>
              <p>
                Founded in 2020, we&apos;ve worked with clients across Europe,
                APAC and North America, delivering projects that range from
                product design to complete brand systems.
              </p>
            </div>
          </div>

          {/* Services & Location */}
          <div className="space-y-12">
            <div>
              <h2 className="text-dossier text-caps tracking-widest opacity-50 mb-6">
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
              <h2 className="text-dossier text-caps tracking-widest opacity-50 mb-6">
                LOCATION
              </h2>
              <p className="text-normal-case text-base font-light">SWEDEN</p>
            </div>
          </div>
        </div>

        {/* Clients Section */}
        <div className="mt-16 lg:mt-20 pt-16 lg:pt-20 border-t-brutal">
          <h2 className="text-dossier text-caps tracking-widest opacity-50 mb-10">
            SELECTED CLIENTS
          </h2>

          {/* GRID LAYOUT UPDATE:
            - grid-cols-2 (mobile) -> 4 (tablet) -> 5 (desktop)
            - Each logo is now trapped in a fixed container (h-6 w-24 mobile, h-8 w-28 desktop)
            - This prevents any single logo from looking "huge"
          */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {clients.map((client) => (
              <div
                key={client.name}
                className="flex items-center justify-center"
              >
                <div className="relative h-6 w-24 lg:h-8 lg:w-28 opacity-30 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0">
                  <Image
                    src={client.logo}
                    alt={client.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
