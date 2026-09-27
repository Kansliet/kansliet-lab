import { Resend } from "resend";
import { COMPANY } from "@/lib/shop-info";

/**
 * A plain-text email to a customer, BCC desk@ (so a missing copy there is the
 * signal to resend by hand) and replies going to desk@. Throws when Resend
 * isn't configured or refuses the message; callers decide whether that fails
 * the request.
 */
export async function sendCustomerEmail(message: { to: string; subject: string; text: string }) {
  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error("RESEND_API_KEY not set");
  }
  // Constructed here, not at module scope: the Resend constructor throws on a
  // missing key, and the build must not depend on it.
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Kansliet <onboarding@resend.dev>",
    to: message.to,
    bcc: COMPANY.email,
    replyTo: COMPANY.email,
    subject: message.subject,
    text: message.text,
  });
  if (error) throw new Error(error.message);
}
