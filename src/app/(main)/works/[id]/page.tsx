import { projects } from "@/data/projects";
import { Link } from "next-view-transitions";
import { notFound } from "next/navigation";
import { ProjectCarousel } from "./project-carousel";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return { title: "Project Not Found" };
  }
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kansliet.co";
  const imageUrl = project.images[0]
    ? new URL(project.images[0].src, baseUrl).href
    : undefined;

  return {
    title: project.title,
    description: project.tagline,
    openGraph: {
      title: project.title,
      description: project.tagline,
      images: imageUrl
        ? [{ url: imageUrl, alt: project.images[0].alt }]
        : undefined,
    },
  };
}

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

  const pageNum = currentIndex + 1;
  const totalPages = projects.length;

  return (
    <div className="flex-1 bg-background flex flex-col lg:flex-row min-h-0 w-full relative">
      {/* Left: Image carousel — same 4:5 aspect on mobile and desktop */}
      <aside className="w-full lg:w-1/2 shrink-0 aspect-4/5 lg:sticky lg:top-0 lg:self-start">
        <ProjectCarousel images={project.images} projectTitle={project.title} />
      </aside>

      {/* Right: Project info */}
      <div className="flex-1 flex flex-col min-w-0 py-10 lg:py-20 min-h-0">
        <div className="container-kansliet flex flex-col">
          {/* Top Row: Page Num + Title + Category */}
          <div className="flex flex-col gap-6 lg:gap-8 mb-10 lg:mb-20">
            <p className="dossier-label tabular-nums">
              P. {String(pageNum).padStart(2, "0")} /{" "}
              {String(totalPages).padStart(2, "0")}
            </p>

            <div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-6">
              {/* Mobile: text-3xl / Desktop: text-4xl */}
              <h1 className="text-3xl lg:text-4xl uppercase tracking-tight font-normal">
                {project.title}
              </h1>

              <div className="flex items-baseline gap-4">
                <span className="dossier-label">
                  CATEGORY
                </span>
                <span className="text-caps text-sm font-light tracking-wider uppercase">
                  {project.category}
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Year Line */}
          <div className="border-b-brutal pb-8 lg:pb-10 mb-8 lg:mb-10">
            <div className="flex items-baseline gap-4">
              <span className="dossier-label">
                YEAR
              </span>
              <span className="text-caps text-sm font-light tracking-wider uppercase">
                {project.year}
              </span>
            </div>
          </div>

          {/* Bottom Specs Grid */}
          {project.specs.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 border-b-brutal pb-8 lg:pb-10 mb-8 lg:mb-10">
              {project.specs
                .filter((spec) => spec.label !== "YEAR")
                .map((spec) => (
                  <div key={spec.label} className="flex items-baseline gap-3">
                    <span className="dossier-label shrink-0">
                      {spec.label}
                    </span>
                    <span className="text-caps text-sm font-light tracking-wider uppercase truncate">
                      {spec.value}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Tagline */}
          <div className="mb-8 lg:mb-10">
            <h2 className="uppercase tracking-wide text-xl lg:text-3xl font-light leading-tight max-w-xl">
              {project.tagline}
            </h2>
          </div>

          {/* Description */}
          <div className="mb-10 lg:mb-12 max-w-xl space-y-6">
            {project.description.map((paragraph: string, index: number) => (
              <p
                key={index}
                className="text-normal-case text-base font-light leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Prev/Next */}
          <div className="pt-10 lg:pt-12 border-t-brutal flex items-center justify-between mt-auto">
            {prevProject ? (
              <Link
                href={`/works/${prevProject.id}`}
                scroll={false}
                className="text-caps text-sm font-light tracking-wider hover:opacity-60 transition-opacity"
              >
                ← PREVIOUS
              </Link>
            ) : (
              <span aria-hidden />
            )}
            {nextProject ? (
              <Link
                href={`/works/${nextProject.id}`}
                scroll={false}
                className="text-caps text-sm font-light tracking-wider hover:opacity-60 transition-opacity"
              >
                NEXT →
              </Link>
            ) : (
              <span aria-hidden />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
