"use client";

import { Carousel } from "@/components/ui/carousel";
import type { Project } from "@/data/projects";

interface ProjectCarouselProps {
  images: Project["images"];
  projectTitle: string;
}

export function ProjectCarousel({
  images,
  projectTitle,
}: ProjectCarouselProps) {
  if (!images.length) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <span className="text-caps text-sm opacity-40">NO IMAGES</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Carousel
        images={images}
        autoplay={false}
        variant="minimal"
        className="h-full flex-1 min-h-0 border-0 border-b-0 border-r-0 rounded-none"
      />
    </div>
  );
}
