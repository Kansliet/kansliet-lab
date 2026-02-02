import { projects } from "@/data/projects";
import { trailImages } from "@/data/trail-images";
import { HomeView } from "./home-view";

/**
 * Home is a server component: it imports data and passes it as props to the
 * client island (HomeView). Data never ships in the client JS bundle — it's
 * serialized in the RSC payload. Only the interactive parts run on the client.
 */
export default function HomePage() {
  return (
    <HomeView
      projects={projects.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
      }))}
      trailImages={trailImages}
    />
  );
}
