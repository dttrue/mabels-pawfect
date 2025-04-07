// app/api/contact/route.js
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const to = process.env.CONTACT_RECEIVER_EMAIL; // e.g., your Gmail or business inbox

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const subject = `New message from ${name}`;
    const body = `
      <strong>From:</strong> ${name} <br />
      <strong>Email:</strong> ${email} <br /><br />
      <strong>Message:</strong><br />
      ${message.replace(/\n/g, "<br />")}
    `;

    const data = await resend.emails.send({
      from: "Mabel's Contact Form <no-reply@mabelspawfectpetservices.com>",
      to: [to],
      subject,
      html: body,
    });

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
