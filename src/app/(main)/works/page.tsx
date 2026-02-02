import {
  Grid,
  GridItem,
  GridItemTitle,
  GridItemMeta,
} from "@/components/ui/grid";
import Image from "next/image";
import { projects } from "@/data/projects";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KANSLIET (WORKS)",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet">
          <h1 className="text-caps mb-12 text-lg font-light tracking-wide">
            PROJECTS
          </h1>

          <Grid cols={3} gap={6}>
            {projects.map((project) => (
              <GridItem key={project.id} href={`/works/${project.id}`}>
                <div className="flex aspect-5/6 flex-col overflow-hidden">
                  <div className="relative min-h-0 flex-1 bg-foreground/5">
                    {project.images[0] ? (
                      <Image
                        src={project.images[0].src}
                        alt={project.images[0].alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1400px) 33vw, 400px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-caps text-sm opacity-40">
                          IMAGE
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 border-t-brutal bg-background p-4">
                    <GridItemTitle>{project.title}</GridItemTitle>
                    <GridItemMeta>
                      {project.category}, {project.year}
                    </GridItemMeta>
                  </div>
                </div>
              </GridItem>
            ))}
          </Grid>
        </div>
      </section>
    </div>
  );
}
