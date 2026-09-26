import { projects } from "@/data/projects";
import { ArchiveColumn } from "@/components/archive/ArchiveColumn";
import { toArchivePlates } from "@/components/archive/archive-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KANSLIET (WORKS)",
  alternates: { canonical: "/works" },
};

export default function ProjectsPage() {
  return (
    <>
      <h1 className="sr-only">Works</h1>
      <ArchiveColumn
        plates={toArchivePlates(projects)}
        projects={projects.map((p) => ({ id: p.id, title: p.title }))}
      />
    </>
  );
}
