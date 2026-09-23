// Shared design tokens — spacing, buttons, type scale — applied consistently
// across every page instead of re-decided per page. See docs/shop/CART-SPEC.md-style
// history: this collapses the audit findings from the design-token review.

export const PAGE_SHELL = {
  form: "mx-auto max-w-xl px-6 py-16", // single-column forms/status: login, success
  full: "px-8 py-16", // shop, product, cart — fills the page, no max-w, matching teenage.engineering's store
  data: "mx-auto max-w-4xl px-6 py-16", // admin tables that genuinely need the width
};

export const HEADING = "text-2xl font-semibold text-zinc-900 dark:text-zinc-50";

export const PRICE_PRIMARY = "text-xl font-semibold text-zinc-900 dark:text-zinc-50";
export const PRICE_SECONDARY = "text-sm text-zinc-500 dark:text-zinc-400";

export type ButtonVariant = "primary" | "secondary" | "tertiary";

const BUTTON_BASE = "cursor-pointer font-medium transition-colors";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "rounded-none px-6 py-4 text-base bg-zinc-900 text-zinc-50 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400",
  secondary:
    "rounded-none border border-zinc-900 px-6 py-2 text-sm text-zinc-900 hover:bg-zinc-900 hover:text-zinc-50 dark:border-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-900",
  tertiary:
    "text-sm text-zinc-500 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
};

export function buttonClasses(variant: ButtonVariant, className = ""): string {
  return [BUTTON_BASE, BUTTON_VARIANTS[variant], className].filter(Boolean).join(" ");
}
