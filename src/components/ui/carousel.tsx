"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  images: Array<string | { src: string; alt: string }>;
  autoplay?: boolean;
  interval?: number;
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ className, images, autoplay = false, interval = 5000, ...props }, ref) => {
    const [current, setCurrent] = React.useState(0);
    const [isHovered, setIsHovered] = React.useState(false);

    const next = React.useCallback(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prev = React.useCallback(() => {
      setCurrent((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const goTo = React.useCallback((index: number) => {
      setCurrent(index);
    }, []);

    React.useEffect(() => {
      if (!autoplay || isHovered) return;

      const timer = setInterval(next, interval);
      return () => clearInterval(timer);
    }, [autoplay, interval, isHovered, next]);

    return (
      <div
        ref={ref}
        className={cn(
          "border-brutal relative overflow-hidden bg-background",
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Images - Click to advance */}
        <div
          className="relative aspect-4/5 w-full bg-foreground/5 cursor-pointer"
          onClick={next}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "absolute inset-0 transition-opacity duration-500",
                index === current ? "opacity-100" : "opacity-0",
              )}
            >
              {typeof image === "string" ? (
                <div className="flex h-full items-center justify-center bg-foreground/5">
                  <span className="text-caps text-sm opacity-40">{image}</span>
                </div>
              ) : (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1400px) 80vw, 1120px"
                  className="object-cover"
                  priority={index === 0}
                />
              )}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="border-t-brutal flex items-center justify-between bg-background p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="text-caps flex h-10 w-10 items-center justify-center border-brutal bg-background text-sm font-normal transition-opacity hover:opacity-60"
            aria-label="Previous"
          >
            ←
          </button>

          <div className="text-caps flex items-center gap-2 text-sm font-light tracking-wider">
            <span className="font-normal">
              {String(current + 1).padStart(2, "0")}
            </span>
            <span className="opacity-40">/</span>
            <span className="opacity-40">
              {String(images.length).padStart(2, "0")}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="text-caps flex h-10 w-10 items-center justify-center border-brutal bg-background text-sm font-normal transition-opacity hover:opacity-60"
            aria-label="Next"
          >
            →
          </button>
        </div>

        {/* Dots */}
        <div className="border-t-brutal flex justify-center gap-2 bg-background p-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goTo(index);
              }}
              className={cn(
                "h-1 w-8 transition-opacity",
                index === current
                  ? "bg-foreground"
                  : "bg-foreground/20 hover:bg-foreground/40",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  },
);
Carousel.displayName = "Carousel";

export { Carousel };
