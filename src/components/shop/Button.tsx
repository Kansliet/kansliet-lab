import type { ButtonHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant } from "@/lib/design-tokens";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
};

export function Button({ variant, className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}
