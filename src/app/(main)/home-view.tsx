"use client";

import Image from "next/image";
import ImageTrail, { ImageTrailItem } from "@/components/fancy-image-trail";
import { Link } from "next-view-transitions";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { CursorFollower } from "@/components/cursor-follower";
import { TextDisperse } from "@/components/text-disperse";
import { motion, useInView, useReducedMotion } from "motion/react";

/** Minimal shape for home list — data comes from server via props, not from @/data. */
export type HomeTrailImage = { src: string; alt: string };

export type HomeProjectItem = {
  id: string;
  title: string;
  category: string;
  /** First project image, shown in the cursor hover preview. */
  previewImage?: HomeTrailImage;
};

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
  const [hoveredImage, setHoveredImage] = useState<HomeTrailImage | null>(null);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const listRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const listInView = useInView(listRef, { once: true, amount: 0.15 });
  const reduceMotion = useReducedMotion();

  // Gate the image trail to desktop. The trail is CSS-hidden below md, but
  // display:none does NOT stop <img> downloads — mobile would still fetch ~20
  // trail images for a feature it can't use. Start false (matches SSR) and flip
  // post-mount to avoid a hydration mismatch. 768px = Tailwind's md breakpoint.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    // One-time post-mount read of a browser-only API; starting false on the
    // server and syncing here is what prevents a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Cache the title's rect so the hero mousemove hit-test doesn't force a layout
  // (getBoundingClientRect) on every pointer event; re-measure only when it can
  // move (scroll/resize).
  const titleRectRef = useRef<DOMRect | null>(null);
  useEffect(() => {
    const measure = () => {
      titleRectRef.current = titleRef.current?.getBoundingClientRect() ?? null;
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, []);

  const handleHeroMouseMove = (e: MouseEvent<Element>) => {
    const rect = titleRectRef.current;
    if (!rect) return;
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
      {/* Primary heading — the visible hero is hidden on mobile, so this
          sr-only h1 guarantees a top-level heading on every viewport. */}
      <h1 className="sr-only">Kansliet — objects, spaces, systems</h1>
      {isDesktop && <CursorFollower image={hoveredImage} />}

      <div className="flex-1 relative hidden md:block">
        <div className="absolute inset-0">
          {isDesktop && !reduceMotion && (
            <ImageTrail
              keyframes={{
                scale: [0, 1.3, 1.3, 0],
                opacity: [0, 1, 1, 0],
                rotate: [-5, 5],
              }}
              keyframesOptions={{ duration: 1 }}
              repeatChildren={3}
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
                      loading="eager"
                    />
                  </div>
                </ImageTrailItem>
              ))}
            </ImageTrail>
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-100 pointer-events-none">
          <div
            ref={titleRef}
            className="container-kansliet w-full text-center pointer-events-none cursor-default"
          >
            <motion.div
              aria-hidden="true"
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
        className="relative z-10 border-t-brutal max-md:-mt-px bg-background py-12 pt-16 md:pt-12"
        initial="hidden"
        animate={listInView ? "visible" : "hidden"}
        variants={reduceMotion ? listVariantsReduced : listVariants}
      >
        <div className="container-kansliet">
          <h2 className="dossier-label px-4 mb-4">SELECTED WORKS</h2>
          <ul className="space-y-0 list-none m-0 p-0">
            {projects.map((project) => (
              <motion.li
                key={project.id}
                variants={
                  reduceMotion ? listItemVariantsReduced : listItemVariants
                }
                transition={listTransition}
                className="border-b-brutal"
              >
                <Link
                  href={`/works/${project.id}`}
                  className="group flex items-center justify-between py-4 hover:bg-foreground hover:text-background transition-colors lg:cursor-none"
                  onMouseEnter={() => setHoveredImage(project.previewImage ?? null)}
                  onMouseLeave={() => setHoveredImage(null)}
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

      {/* Warm the hover-preview cache once the list scrolls into view (desktop
          only, so it never competes with initial load). Same fill + w-32 h-40 +
          sizes as the CursorFollower preview, so next/image requests an
          identical URL — a guaranteed cache hit, making row swaps instant. */}
      {isDesktop && listInView && (
        <div aria-hidden className="hidden">
          {projects.map((p) =>
            p.previewImage ? (
              <div key={p.id} className="relative w-41.5 h-52">
                <Image
                  src={p.previewImage.src}
                  alt=""
                  fill
                  sizes="166px"
                  loading="eager"
                />
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
