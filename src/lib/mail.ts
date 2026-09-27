import { Resend } from "resend";
import { COMPANY } from "@/lib/shop-info";

/**
 * desk@'s own copy comes from a different address on the same domain: a BCC
 * from desk@ to desk@ is delivered, but Gmail files it as sent mail, not in
 * the inbox.
 */
const STORE_SENDER = "Kansliet Store <store@kansliet.co>";

export type InternalTag = "NEW ORDER" | "WITHDRAWAL";

/**
 * A plain-text email to a customer (from RESEND_FROM_EMAIL, replies to desk@),
 * then a separate copy to desk@ from store@, subject "[NEW ORDER] KDC-00042",
 * so every order and withdrawal lands in the inbox. The copy goes out even if
 * the customer's email fails, and says so, since that's when desk@ needs to
 * act. Throws when the customer's email wasn't sent; a failed copy is only logged.
 */
export async function sendCustomerEmail(
  message: { to: string; subject: string; text: string },
  internal: { tag: InternalTag; orderRef: string },
) {
  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error("RESEND_API_KEY not set");
  }
  // Constructed here, not at module scope: the Resend constructor throws on a
  // missing key, and the build must not depend on it.
  const resend = new Resend(process.env.RESEND_API_KEY);

  let failure: Error | null = null;
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Kansliet <onboarding@resend.dev>",
      to: message.to,
      replyTo: COMPANY.email,
      subject: message.subject,
      text: message.text,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    failure = err instanceof Error ? err : new Error(String(err));
  }

  try {
    const { error } = await resend.emails.send({
      from: STORE_SENDER,
      to: COMPANY.email,
      // Replying to the copy answers the customer.
      replyTo: message.to,
      subject: `[${internal.tag}] ${internal.orderRef}`,
      text: [
        failure
          ? `NOT SENT to ${message.to} (${failure.message}). Send it by hand.`
          : `Sent to ${message.to}.`,
        "",
        "----",
        "",
        message.text,
      ].join("\n"),
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error(`${internal.orderRef}: internal copy to ${COMPANY.email} failed`, err);
  }

  if (failure) throw failure;
}
