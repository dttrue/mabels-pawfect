// app/api/email/send-donation-receipt/route.js
import Stripe from "stripe";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // ensure Node runtime
// export const runtime = "nodejs"; // (optional on newer Next versions)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

function generateDonationEmail({ customerName, donationAmount, receiptUrl }) {
  return `
    <div style="font-family:sans-serif;color:#444;line-height:1.5">
      <h2>🎉 Thank You for Donating!</h2>
      <p>Hi ${customerName || "there"},</p>
      <p>We’re truly grateful for your donation of <strong>$${donationAmount}</strong> to help stray animals.</p>
      ${receiptUrl ? `<p><a href="${receiptUrl}" target="_blank">View your receipt</a></p>` : ""}
      <p>Your kindness means the world to us — and to the paws you help protect. 🐾</p>
      <p>With love,<br/>Bridget @ Mabel’s Pawfect</p>
    </div>
  `;
}

export async function POST(req) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId)
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    // Pull verified data from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.charges"],
    });

    const amount = (session.amount_total ?? 0) / 100;
    const email = session.customer_details?.email;
    const name = session.customer_details?.name || "";
    const charge = session.payment_intent?.charges?.data?.[0];
    const receiptUrl = charge?.receipt_url || "";

    if (!email)
      return NextResponse.json(
        { error: "No email on session" },
        { status: 400 }
      );

    // Use a sender that WILL deliver in dev.
    // Swap to your verified domain later (e.g., no-reply@mabelspawfectpetservices.com)
    const sender = "Mabel’s Pawfect <onboarding@resend.dev>";

    const { id: messageId } = await resend.emails.send({
      from: sender,
      to: email,
      subject: "💖 Thank You for Your Donation!",
      html: generateDonationEmail({
        customerName: name,
        donationAmount: amount,
        receiptUrl,
      }),
    });

    return NextResponse.json({ ok: true, messageId });
  } catch (e) {
    console.error("Email send error:", e);
    return NextResponse.json(
      { error: "Failed to send receipt" },
      { status: 500 }
    );
  }
}
