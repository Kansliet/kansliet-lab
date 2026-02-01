"use server";

import { redirect } from "next/navigation";

export type ContactState = { message?: string; error?: string };

export async function submitContact(
  _prevState: ContactState | null,
  formData: FormData,
): Promise<ContactState> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const company = formData.get("company")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  if (!name || !email || !message) {
    return { error: "Please fill in name, email, and message." };
  }

  // Placeholder: add your email sending logic (e.g. Resend, SendGrid, or API route)
  // await sendEmail({ name, email, company, message });

  redirect("/contact?success=1");
}
