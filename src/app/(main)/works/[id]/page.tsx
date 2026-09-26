import { projects } from "@/data/projects";
import { SITE_URL } from "@/lib/site";
import { SpecSheet } from "@/components/spec-sheet";
import { SiblingRow } from "@/components/sibling-row";
import { ScrollRail } from "@/components/scroll-rail";
import { notFound } from "next/navigation";
import { ProjectCarousel } from "./project-carousel";
import type { Metadata } from "next";

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

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
  // Prefer a dedicated social-share asset when the project defines one.
  const shareImage = project.ogImage ?? project.images[0];
  const imageUrl = shareImage
    ? new URL(shareImage.src, SITE_URL).href
    : undefined;
  const images = imageUrl
    ? [{ url: imageUrl, alt: shareImage.alt }]
    : undefined;

  return {
    title: project.title,
    description: project.tagline,
    alternates: { canonical: `/works/${id}` },
    openGraph: {
      title: project.title,
      description: project.tagline,
      images,
    },
    // Without this, project pages inherit the root layout's twitter block and
    // advertise the site-wide title/description/image instead of their own.
    twitter: {
      title: project.title,
      description: project.tagline,
      images,
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

  if (!project) {
    notFound();
  }


  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.tagline,
    dateCreated: project.year,
    dateModified: project.updatedAt,
    image: project.images.map((img) => new URL(img.src, SITE_URL).href),
    creator: { "@type": "Organization", name: "Kansliet", url: SITE_URL },
    keywords: project.tags.join(", "),
  };

  return (
    <div className="scroll-pane-scope relative flex flex-col lg:flex-row bg-background w-full min-h-0 lg:h-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Left: Carousel — mobile: natural 4:5 aspect like before; desktop: fills viewport half */}
      <aside className="w-full lg:w-1/2 aspect-4/5 lg:aspect-auto lg:h-full min-h-0 shrink-0 flex flex-col">
        <ProjectCarousel images={project.images} />
      </aside>

      {/* Desktop: the pane scrolls, not the page, so it drives its own rail. */}
      <ScrollRail source="pane" />

      {/* Right: the dossier. Centred on the site's axis: identity and spec
          above, the row of sibling projects on the axis, the text below.
          Mobile: flows below the carousel; desktop: scrolls in its pane. */}
      <div className="scroll-pane min-w-0 min-h-0 flex-1 lg:h-full lg:overflow-y-auto">
        {/* The pane runs to the window's right edge at every width, so it takes
            the full axis gutter there (clear of the INDEX tab), and only a
            modest gap on the left, beside the photos. Own padding rather than
            .container-kansliet, whose desktop gutter assumes a full-width page.
            Desktop: the sibling row is pinned to the axis (50vh) and the top
            block hugs it from above, so clicking between projects never
            shifts the row, whatever each project's text length. The row is
            4rem tall (h-14 plates + py-1), hence 50vh − 2rem − gap. */}
        <div className="flex min-h-full flex-col gap-10 px-3 py-12 md:px-6 lg:pt-0 lg:pb-16 lg:pl-10 lg:pr-(--axis-gutter)">
          <div className="flex flex-col justify-end space-y-6 lg:min-h-[calc(50vh-2rem-2.5rem)]">
            <h1 className="text-lg uppercase tracking-wide font-normal">{project.title}</h1>
            <SpecSheet
              title={`P.${String(currentIndex + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}`}
              rows={[
                ["Category", project.category],
                ["Year", project.year],
                ...project.specs
                  .filter((spec) => spec.label !== "YEAR")
                  .map((spec): [string, string] => [spec.label, spec.value]),
              ]}
            />
          </div>

          <SiblingRow
            label="All works"
            items={projects.map((p) => ({
              href: `/works/${p.id}`,
              label: p.title,
              image: p.images[0]?.src ?? null,
              current: p.id === project.id,
            }))}
          />

          <div className="max-w-xl space-y-6">
            <h2 className="uppercase tracking-wide text-base font-light leading-snug">
              {project.tagline}
            </h2>
            {project.description.map((paragraph: string, index: number) => (
              <p key={index} className="text-normal-case text-base font-light leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
