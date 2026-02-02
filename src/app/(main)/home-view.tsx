"use client";

import Image from "next/image";
import ImageTrail, { ImageTrailItem } from "@/components/fancy-image-trail";
import { Link } from "next-view-transitions";
import type { MouseEvent } from "react";
import { useRef, useState } from "react";
import { CursorFollower } from "@/components/cursor-follower";
import { TextDisperse } from "@/components/text-disperse";
import { motion, useInView, useReducedMotion } from "motion/react";

/** Minimal shape for home list — data comes from server via props, not from @/data. */
export type HomeProjectItem = { id: string; title: string; category: string };

export type HomeTrailImage = { src: string; alt: string };

interface HomeViewProps {
  projects: HomeProjectItem[];
  trailImages: HomeTrailImage[];
}

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const listItemVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const listVariantsReduced = {
  hidden: {},
  visible: { transition: { staggerChildren: 0, delayChildren: 0 } },
};

export function HomeView({ projects, trailImages }: HomeViewProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const listRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const listInView = useInView(listRef, { once: true, amount: 0.15 });
  const reduceMotion = useReducedMotion();

  const handleHeroMouseMove = (e: MouseEvent<Element>) => {
    const el = titleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    const over =
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    setIsTitleHovered(over);
  };

  const titleTransition = reduceMotion
    ? { duration: 0.2, delay: 0 }
    : { duration: 0.7, delay: 0.45 };
  const listTransition = reduceMotion ? { duration: 0.15 } : { duration: 0.4 };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CursorFollower isVisible={isHovering} />

      <div className="flex-1 relative hidden md:block">
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
            onMouseMoveCapture={handleHeroMouseMove}
          >
            {trailImages.map((image, index) => (
              <ImageTrailItem key={`${image.src}-${index}`}>
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

        <div className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none">
          <div ref={titleRef} className="container-kansliet w-full text-center pointer-events-none cursor-default">
            <motion.div
              className="text-caps text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={titleTransition}
            >
              <TextDisperse isAnimated={isTitleHovered}>
                OBJECTS. SPACES. SYSTEMS
              </TextDisperse>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.section
        ref={listRef}
        className="relative z-10 border-t-brutal bg-background py-12 pt-16 md:pt-12"
        initial="hidden"
        animate={listInView ? "visible" : "hidden"}
        variants={reduceMotion ? listVariantsReduced : listVariants}
      >
        <div className="container-kansliet">
          <ul className="space-y-0 list-none m-0 p-0">
            {projects.map((project) => (
              <motion.li
                key={project.id}
                variants={reduceMotion ? listItemVariantsReduced : listItemVariants}
                transition={listTransition}
                className="border-b-brutal"
              >
                <Link
                  href={`/works/${project.id}`}
                  scroll={false}
                  className="group flex items-center justify-between py-4 hover:bg-foreground hover:text-background transition-colors lg:cursor-none"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <span className="text-caps text-sm font-light tracking-wider px-4">
                    {project.title}
                  </span>
                  <span className="text-caps text-sm font-light tracking-wider opacity-60 group-hover:opacity-100 px-4 text-right">
                    {project.category}
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.section>
    </div>
  );
}
