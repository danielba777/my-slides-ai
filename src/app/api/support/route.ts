import { NextResponse } from "next/server";
import { Resend } from "resend";

import config from "@/config";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    await resend.emails.send({
      from: config.resend.fromAdmin,
      to: config.resend.supportEmail,
      subject: `Support Request: ${subject}`,
      html: `
        <h2>New Support Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    await resend.emails.send({
      from: config.resend.fromAdmin,
      to: email,
      subject: "Your Support Request",
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>We received your message and will respond as soon as possible.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr />
        <p>Best regards,<br />Your Support Team</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support request error:", error);
    return NextResponse.json(
      { error: "Failed to send support request" },
      { status: 500 },
    );
  }
}
