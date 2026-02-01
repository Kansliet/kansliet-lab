"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";

// Initialize the API with your key
const resend = new Resend(process.env.RESEND_API_KEY);

export type ContactState = { message?: string; error?: string };

export async function submitContact(
  _prevState: ContactState | null,
  formData: FormData,
): Promise<ContactState> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const company = formData.get("company")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  // 1. Basic Validation
  if (!name || !email || !message) {
    return { error: "Please fill in name, email, and message." };
  }

  try {
    // 2. Send the email via Resend
    // NOTE: On the free tier, you can ONLY send to the email you signed up with.
    // The "from" address must be 'onboarding@resend.dev' until you verify 'kansliet.co'.
    await resend.emails.send({
      from: "Kansliet Form <onboarding@resend.dev>",
      to: "desk@kansliet.co", // Make sure this is the email you used to sign up for Resend!
      replyTo: email, // This lets you hit "Reply" to answer the customer
      subject: `New Inquiry: ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Company: ${company || "N/A"}
        
        Message:
        ${message}
      `,
    });
  } catch (error) {
    console.error("Resend Error:", error);
    return { error: "Failed to send message. Please try again later." };
  }

  // 3. Redirect to success state
  redirect("/contact?success=1");
}
