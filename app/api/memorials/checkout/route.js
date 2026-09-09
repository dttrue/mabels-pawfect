export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  getMemorialStripe,
  isMemorialStripeProviderError,
  MemorialStripeConfigurationError,
} from "@/lib/memorialStripe";
import {
  activateMemorialCheckoutAttempt,
  bestEffortExpireMemorialCheckoutSession,
  expireMemorialCheckoutAttempt,
  getCanonicalAppOrigin,
  prepareMemorialCheckoutAttempt,
} from "@/lib/memorialCheckout";
import {
  bestEffortTagMemorialForReview,
  MemorialUploadError,
  readBoundedJson,
} from "@/lib/memorialUpload";

function sessionMatchesAttempt(session, attempt) {
  return (
    session?.status === "open" &&
    session?.payment_status !== "paid" &&
    session?.mode === "payment" &&
    typeof session?.url === "string" &&
    session.url.length > 0 &&
    session?.metadata?.paymentType === "memorial" &&
    session?.metadata?.memorialId === attempt.memorialId &&
    session?.metadata?.checkoutAttemptId === attempt.id &&
    Number(session?.amount_total) === attempt.amountCents &&
    String(session?.currency || "").toLowerCase() === attempt.currency &&
    Number(session?.expires_at) * 1000 > Date.now()
  );
}

function checkoutSessionParameters(memorial, attempt, appOrigin) {
  return {
    mode: "payment",
    customer_email: memorial.ownerEmail,
    expires_at: Math.floor(attempt.stripeSessionExpiresAt.getTime() / 1000),
    line_items: [
      {
        price_data: {
          currency: attempt.currency,
          unit_amount: attempt.amountCents,
          product_data: {
            name: `${memorial.petName} Memorial`,
            description:
              "A personalized online pet memorial page containing the pet's photos, story, and tribute.",
            tax_code: "txcd_10701401",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentType: "memorial",
      memorialId: memorial.id,
      checkoutAttemptId: attempt.id,
    },
    payment_intent_data: {
      metadata: {
        paymentType: "memorial",
        memorialId: memorial.id,
        checkoutAttemptId: attempt.id,
      },
    },
    success_url: `${appOrigin}/memorials/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appOrigin}/memorials/create?memorialId=${encodeURIComponent(
      memorial.id
    )}&checkout=canceled`,
  };
}

async function obtainStripeSession(memorialStripe, prepared, appOrigin) {
  const { attempt, memorial } = prepared;

  if (attempt.state === "OPEN" && attempt.stripeSessionId) {
    const existing = await memorialStripe.checkout.sessions.retrieve(
      attempt.stripeSessionId
    );

    if (sessionMatchesAttempt(existing, attempt)) {
      return existing;
    }

    if (
      existing?.payment_status === "paid" ||
      existing?.status === "complete"
    ) {
      throw new MemorialUploadError(
        "This payment is already being processed.",
        409,
        { code: "CHECKOUT_PAYMENT_PROCESSING" }
      );
    }

    const obsoleteSessionId = await expireMemorialCheckoutAttempt(attempt.id);
    await bestEffortExpireMemorialCheckoutSession(obsoleteSessionId);
    return null;
  }

  if (attempt.state !== "CREATING") {
    return null;
  }

  return memorialStripe.checkout.sessions.create(
    checkoutSessionParameters(memorial, attempt, appOrigin),
    { idempotencyKey: `memorial-checkout-${attempt.idempotencyKey}` }
  );
}

async function prepareAndObtainSession(
  memorialStripe,
  memorialId,
  draftCapability,
  appOrigin
) {
  for (let pass = 0; pass < 2; pass += 1) {
    const prepared = await prepareMemorialCheckoutAttempt(
      memorialId,
      draftCapability
    );

    for (const reservation of prepared.expiredReservations) {
      await bestEffortTagMemorialForReview(reservation.publicId);
    }

    for (const obsoleteSessionId of prepared.obsoleteSessionIds) {
      await bestEffortExpireMemorialCheckoutSession(obsoleteSessionId);
    }

    const session = await obtainStripeSession(
      memorialStripe,
      prepared,
      appOrigin
    );

    if (session) {
      return { prepared, session };
    }
  }

  throw new MemorialUploadError(
    "Checkout state changed while the session was opening. Please retry.",
    409,
    { code: "CHECKOUT_STATE_CHANGED" }
  );
}

export async function POST(request) {
  try {
    const body = await readBoundedJson(request, 4 * 1024);
    const memorialId = String(body?.memorialId || "").trim();
    const draftCapability = String(body?.draftCapability || "");

    if (!memorialId) {
      throw new MemorialUploadError("Missing memorial ID.", 400);
    }

    // Resolve only from the deployment-owned canonical URL. Request Host and
    // forwarded headers are intentionally never trusted for Stripe redirects.
    const appOrigin = getCanonicalAppOrigin();
    const memorialStripe = getMemorialStripe();
    const { prepared, session } = await prepareAndObtainSession(
      memorialStripe,
      memorialId,
      draftCapability,
      appOrigin
    );

    try {
      await activateMemorialCheckoutAttempt({
        attemptId: prepared.attempt.id,
        memorialId,
        draftCapability,
        session,
      });
    } catch (error) {
      // A provider session created with the persisted idempotency key remains
      // recoverable after transient database failures. Only a definite local
      // state/capability rejection retires it.
      if (error instanceof MemorialUploadError && error.status < 500) {
        const obsoleteSessionId = await expireMemorialCheckoutAttempt(
          prepared.attempt.id
        );
        await bestEffortExpireMemorialCheckoutSession(
          obsoleteSessionId || session.id
        );
      }

      throw error;
    }

    return NextResponse.json(
      { url: session.url },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    if (error instanceof MemorialStripeConfigurationError) {
      return NextResponse.json(
        { error: "Memorial payments are not configured." },
        { status: 503 }
      );
    }

    if (error instanceof MemorialUploadError) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error.code ? { code: error.code } : {}),
        },
        { status: error.status }
      );
    }

    const providerFailure = isMemorialStripeProviderError(error);
    console.error(
      providerFailure
        ? "[memorial-checkout] Payment provider request failed."
        : "[memorial-checkout] Checkout processing failed."
    );

    return NextResponse.json(
      { error: "We could not start memorial checkout. Please try again." },
      { status: providerFailure ? 502 : 500 }
    );
  }
}
