import * as React from "react";
import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 2 | 3 | 4 | 6 | 8;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 3, gap = 6, children, ...props }, ref) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      6: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
    };

    const gapSize = {
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
    };

    return (
      <div
        ref={ref}
        className={cn("grid", gridCols[cols], gapSize[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Grid.displayName = "Grid";

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  href?: string;
}

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, children, href, ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn(
          "border-brutal group relative overflow-hidden bg-background transition-opacity hover:opacity-80",
          href && "cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );

    if (href) {
      return <Link href={href} scroll={false}>{content}</Link>;
    }

    return content;
  },
);
GridItem.displayName = "GridItem";

const GridItemImage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("aspect-square overflow-hidden bg-background", className)}
    {...props}
  >
    {children}
  </div>
));
GridItemImage.displayName = "GridItemImage";

const GridItemContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-t-brutal bg-background p-4 min-h-[4.5rem] flex flex-col justify-center",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
GridItemContent.displayName = "GridItemContent";

const GridItemTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-caps text-sm font-normal tracking-wider", className)}
    {...props}
  >
    {children}
  </h3>
));
GridItemTitle.displayName = "GridItemTitle";

const GridItemMeta = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-normal-case text-sm font-light opacity-60 mt-1",
      className,
    )}
    {...props}
  >
    {children}
  </p>
));
GridItemMeta.displayName = "GridItemMeta";

export {
  Grid,
  GridItem,
  GridItemImage,
  GridItemContent,
  GridItemTitle,
  GridItemMeta,
};
