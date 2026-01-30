import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const linkVariants = cva(
  "text-caps font-light tracking-wide transition-opacity",
  {
    variants: {
      variant: {
        default: "hover:opacity-60",
        underline: "border-b-2 border-foreground pb-1 hover:opacity-60",
        nav: "text-sm hover:opacity-60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface LinkProps
  extends
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <a
        className={cn(linkVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Link.displayName = "Link";

export { Link, linkVariants };
