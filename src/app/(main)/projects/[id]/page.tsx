import { projects } from "@/data/projects";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  const currentIndex = projects.findIndex((p) => p.id === id);
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const nextProject =
    currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;

  if (!project) {
    notFound();
  }

  return (
    <div className="flex-1 bg-background flex flex-col">
      {/* Hero Image */}
      {project.images[0] && (
        <div className="relative w-full aspect-[16/9]">
          <Image
            src={project.images[0].src}
            alt={project.images[0].alt}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      )}

      <div className="flex-1 py-20">
        <div className="container-kansliet">
          {/* Title & Info */}
          <div className="mb-16">
            <div className="flex items-start justify-between mb-6">
              <h1 className="text-caps text-lg font-light tracking-wide">
                {project.title}
              </h1>
              <p className="text-caps text-sm font-light opacity-60 tracking-wider">
                {project.category}
              </p>
            </div>
            <p className="text-caps text-sm font-light opacity-60 tracking-wider">
              {project.year}
            </p>
          </div>

          {/* Tagline */}
          <div className="mb-16 pb-16 border-b-brutal">
            <h2 className="text-normal-case text-3xl font-light leading-tight max-w-4xl">
              {project.tagline}
            </h2>
          </div>

          {/* Description Paragraphs */}
          <div className="mb-20 max-w-3xl space-y-6">
            {project.description.map((paragraph: string, index: number) => (
              <p
                key={index}
                className="text-normal-case text-base font-light leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Image Gallery */}
          {project.images.length > 1 && (
            <div className="mb-20 space-y-6">
              {project.images.slice(1).map((image, index) => (
                <div key={index} className="relative w-full aspect-[16/10]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="pt-12 border-t-brutal">
            <div className="flex items-center justify-between">
              {prevProject ? (
                <Link
                  href={`/projects/${prevProject.id}`}
                  className="text-caps text-sm font-light tracking-wider hover:opacity-60 transition-opacity"
                >
                  ← PREVIOUS PROJECT
                </Link>
              ) : (
                <div></div>
              )}
              {nextProject ? (
                <Link
                  href={`/projects/${nextProject.id}`}
                  className="text-caps text-sm font-light tracking-wider hover:opacity-60 transition-opacity"
                >
                  NEXT PROJECT →
                </Link>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return projects.map((project) => ({
    id: project.id,
  }));
}
