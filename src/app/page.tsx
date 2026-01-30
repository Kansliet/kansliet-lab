import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ImageTrail, { ImageTrailItem } from "@/components/fancy-image-trail";
import { trailImages } from "@/data/trail-images";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <ImageTrail
            keyframes={{
              scale: [0, 1.2, 1.2, 0],
              opacity: [0, 1, 1, 0],
              rotate: [-5, 5],
            }}
            keyframesOptions={{ duration: 1 }}
            repeatChildren={5}
            baseZIndex={-50}
            className="h-full w-full"
          >
            {trailImages.map((image, index) => (
              <ImageTrailItem key={index}>
                <div className="relative w-32 h-40">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized
                  />
                </div>
              </ImageTrailItem>
            ))}
          </ImageTrail>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="container-kansliet text-center">
            <h1 className="text-caps text-5xl font-light leading-tight tracking-tight">
              KANSLIET
              <br />
              DESIGN COMPANY
            </h1>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
