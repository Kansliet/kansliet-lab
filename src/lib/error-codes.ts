// Redirects carry an error CODE in `?error=`, never display text. Pages look
// the message up here, so a crafted link like /store/cart?error=<anything>
// can't make the site show attacker-chosen text; unknown codes render nothing.

const ERROR_MESSAGES = {
  sold_out: "This item is sold out.",
  unavailable: "An item in your cart is no longer available. Remove it to continue.",
  checkout_failed: "Something went wrong starting checkout. Try again.",
  missing_credentials: "Email and password are required.",
  invalid_credentials: "Invalid email or password.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export function withError(path: string, code: ErrorCode): string {
  return `${path}?error=${code}`;
}

export function errorMessage(code: string | undefined): string | null {
  if (!code || !Object.hasOwn(ERROR_MESSAGES, code)) return null;
  return ERROR_MESSAGES[code as ErrorCode];
}
