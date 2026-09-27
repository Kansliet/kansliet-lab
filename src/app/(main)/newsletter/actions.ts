"use server";

import { redirect } from "next/navigation";
import { verifyFormToken } from "@/lib/form-token";
import { addNewsletterContact, sendStoreEmail } from "@/lib/mail";
import {
  EMAIL_PATTERN,
  NEWSLETTER_SEGMENT_ID,
  buildConfirmationEmail,
  confirmationQuery,
  verifyConfirmation,
} from "@/lib/newsletter";
import { getAppBaseUrl } from "@/lib/site";

export type SignupState = { sent?: boolean; error?: string; email?: string };

/**
 * Step 1 of double opt-in: email a confirmation link. The reply is the same
 * whether or not the address is already on the list, so the form can't be
 * used to find out who subscribes.
 */
export async function requestSignup(
  _prev: SignupState | null,
  formData: FormData,
): Promise<SignupState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  if (formData.get("_trap")) return { sent: true };
  if (!verifyFormToken(formData.get("_token")?.toString() ?? "")) {
    return { error: "Something went wrong. Please refresh the page and try again.", email };
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address.", email };
  }

  try {
    const link = `${getAppBaseUrl()}/newsletter/confirm?${confirmationQuery(email)}`;
    await sendStoreEmail({ to: email, ...buildConfirmationEmail(link) });
  } catch (err) {
    console.error("Newsletter confirmation email failed", err);
    return { error: "We couldn't send the confirmation email. Please try again later.", email };
  }
  return { sent: true };
}

/** Step 2: the button on the confirmation page. A click, not the page load, so link scanners can't subscribe anyone. */
export async function confirmSignup(formData: FormData) {
  const email = verifyConfirmation({
    e: formData.get("e")?.toString(),
    t: formData.get("t")?.toString(),
    s: formData.get("s")?.toString(),
  });
  if (!email) redirect("/newsletter/confirm?status=invalid");

  try {
    await addNewsletterContact(email, NEWSLETTER_SEGMENT_ID);
  } catch (err) {
    console.error("Newsletter subscribe failed", err);
    redirect("/newsletter/confirm?status=failed");
  }
  redirect("/newsletter/confirm?status=done");
}
