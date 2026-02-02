"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_COMPANY = 300;
const MAX_MESSAGE = 10_000;

export type ContactState = { message?: string; error?: string };

export async function submitContact(
  _prevState: ContactState | null,
  formData: FormData,
): Promise<ContactState> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.error("RESEND_API_KEY is not configured.");
    return { error: "Contact form is temporarily unavailable. Please try again later." };
  }

  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const company = formData.get("company")?.toString().trim() ?? "";
  const message = formData.get("message")?.toString().trim() ?? "";

  if (!name || !email || !message) {
    return { error: "Please fill in name, email, and message." };
  }

  if (name.length > MAX_NAME) return { error: "Name is too long." };
  if (email.length > MAX_EMAIL) return { error: "Email is too long." };
  if (company.length > MAX_COMPANY) return { error: "Company name is too long." };
  if (message.length > MAX_MESSAGE) return { error: "Message is too long." };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    await resend.emails.send({
      from: "Kansliet Form <onboarding@resend.dev>",
      to: "desk@kansliet.co",
      replyTo: email,
      subject: `New Inquiry: ${name.slice(0, 100)}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "N/A"}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });
  } catch (error) {
    console.error("Resend Error:", error);
    return { error: "Failed to send message. Please try again later." };
  }

  redirect("/contact?success=1");
}
