import Image from "next/image";
import ImageTrail, { ImageTrailItem } from "@/components/fancy-image-trail";
import { trailImages } from "@/data/trail-images";
import { projects } from "@/data/projects";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <ImageTrail
            keyframes={{
              scale: [0, 1.3, 1.3, 0],
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
                    loading="lazy"
                  />
                </div>
              </ImageTrailItem>
            ))}
          </ImageTrail>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="container-kansliet text-center">
            <h1 className="text-caps text-5xl font-light leading-tight tracking-tight">
              KANSLIET
              <br />
              DESIGN COMPANY
            </h1>
          </div>
        </div>
      </div>

      {/* Projects List Section */}
      <section className="relative z-10 border-t-brutal bg-background py-12">
        <div className="container-kansliet">
          <div className="space-y-0">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex items-center justify-between py-4 border-b-brutal hover:bg-foreground hover:text-background transition-colors"
              >
                <span className="text-caps text-sm font-light tracking-wider px-4">
                  {project.title}
                </span>
                <span className="text-caps text-sm font-light tracking-wider opacity-60 group-hover:opacity-100 px-4 text-right">
                  {project.category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
