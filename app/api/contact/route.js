// app/api/contact/route.js
import { NextResponse } from "next/server";
import {
  createResendClient,
  getRequiredEmailFailure,
  sendRequiredEmail,
} from "@/lib/emails/resend";

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const emailClient = createResendClient();

    const subject = `New message from ${name}`;
    const body = `
      <strong>From:</strong> ${name} <br />
      <strong>Email:</strong> ${email} <br /><br />
      <strong>Message:</strong><br />
      ${message.replace(/\n/g, "<br />")}
    `;

    const data = await sendRequiredEmail(emailClient, {
      from: "Mabel's Contact Form <no-reply@mabelspawfectpetservices.com>",
      to: ["Therainbowniche@gmail.com"],
      replyTo: email, // 👈 so Bridget can reply straight to the sender
      subject,
      html: body,
    });
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    const emailFailure = getRequiredEmailFailure(err);
    if (emailFailure) {
      return NextResponse.json(
        { error: emailFailure.message },
        { status: emailFailure.status }
      );
    }
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
