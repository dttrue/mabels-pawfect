// app/shop/thank-you/page.js

export const runtime = "nodejs";

export default function ThankYouPage({ searchParams } = {}) {
  const sessionId = searchParams?.session_id;
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-3">Thank you! 🐾</h1>
      <p className="opacity-80">Your order has been received.</p>
      {sessionId && <p className="mt-2 text-xs opacity-60">Ref: {sessionId}</p>}
      <a href="/shop" className="mt-6 inline-block underline">
        Back to Shop
      </a>
    </main>
  );
}
