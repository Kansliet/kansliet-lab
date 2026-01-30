import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Carousel } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/data/projects";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-20">
          <div className="container-kansliet">
            <h1 className="text-caps text-lg font-light">PROJECT NOT FOUND</h1>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b-brutal py-20">
        <div className="container-kansliet">
          <div className="mb-12">
            <h1 className="text-caps mb-4 text-lg font-light tracking-wide">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map((tag: string) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-normal-case text-base font-light opacity-60">
              {project.category} · {project.year}
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Carousel
                images={project.images}
                autoplay={true}
                interval={4000}
              />
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-caps mb-4 text-sm font-normal tracking-wider">
                  DESCRIPTION
                </h2>
                <p className="text-normal-case text-base font-light leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div>
                <h2 className="text-caps mb-4 text-sm font-normal tracking-wider">
                  SPECIFICATIONS
                </h2>
                <div className="space-y-3">
                  {project.specs.map((spec: any, index: number) => (
                    <div key={index} className="border-b-brutal pb-3">
                      <div className="flex justify-between">
                        <span className="text-caps text-sm font-normal tracking-wider opacity-60">
                          {spec.label}
                        </span>
                        <span className="text-normal-case text-sm font-light">
                          {spec.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  return projects.map((project) => ({
    id: project.id,
  }));
}
