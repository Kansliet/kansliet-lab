import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "text-caps inline-flex items-center text-xs font-normal tracking-wider",
  {
    variants: {
      variant: {
        default: "border-brutal bg-background text-foreground px-3 py-1",
        solid: "bg-foreground text-background px-3 py-1",
        outline: "border-brutal bg-transparent text-foreground px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
