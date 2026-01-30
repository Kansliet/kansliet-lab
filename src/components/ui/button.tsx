import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "text-caps inline-flex items-center justify-center text-sm font-light tracking-wide transition-opacity disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-brutal bg-foreground text-background hover:opacity-80",
        secondary:
          "border-brutal bg-background text-foreground hover:opacity-80",
        ghost: "hover:opacity-60",
        link: "border-b-2 border-foreground pb-1 hover:opacity-60",
      },
      size: {
        sm: "px-6 py-2",
        default: "px-8 py-3",
        lg: "px-10 py-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
