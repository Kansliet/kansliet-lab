"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  images: Array<string | { src: string; alt: string }>;
  autoplay?: boolean;
  interval?: number;
  /** Minimal variant: dots only over image, no thick control bar */
  variant?: "default" | "minimal";
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      className,
      images,
      autoplay = false,
      interval = 5000,
      variant = "default",
      ...props
    },
    ref,
  ) => {
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
        className={cn(" relative overflow-hidden bg-background", className)}
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
          {/* Minimal variant: dots + prev/next over image */}
          {variant === "minimal" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center bg-background/80 text-foreground text-sm transition-opacity hover:opacity-80"
                aria-label="Previous"
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center bg-background/80 text-foreground text-sm transition-opacity hover:opacity-80"
                aria-label="Next"
              >
                →
              </button>
              <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(index);
                    }}
                    className={cn(
                      "h-0.5 w-4 transition-opacity",
                      index === current
                        ? "bg-foreground opacity-100"
                        : "bg-foreground/40 hover:bg-foreground/60",
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Default variant: full control bar + dots below */}
        {variant === "default" && (
          <>
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
          </>
        )}
      </div>
    );
  },
);
Carousel.displayName = "Carousel";

export { Carousel };
