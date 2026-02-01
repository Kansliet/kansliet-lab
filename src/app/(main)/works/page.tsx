import {
  Grid,
  GridItem,
  GridItemImage,
  GridItemContent,
  GridItemTitle,
  GridItemMeta,
} from "@/components/ui/grid";
import Image from "next/image";
import { projects } from "@/data/projects";

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
                <GridItemImage>
                  {project.images[0] ? (
                    <Image
                      src={project.images[0].src}
                      alt={project.images[0].alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1400px) 33vw, 400px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-foreground/5">
                      <span className="text-caps text-sm opacity-40">
                        IMAGE
                      </span>
                    </div>
                  )}
                </GridItemImage>
                <GridItemContent>
                  <GridItemTitle>{project.title}</GridItemTitle>
                  <GridItemMeta>
                    {project.category}, {project.year}
                  </GridItemMeta>
                </GridItemContent>
              </GridItem>
            ))}
          </Grid>
        </div>
      </section>
    </div>
  );
}
