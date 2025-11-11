// no need for headers here anymore
import OrderPanel from "./OrderPanel";

export default async function SuccessPage({ searchParams }) {
  const sp = await searchParams;
  const sessionId = sp?.session_id ?? null;

  let initialOrder = null;
  if (sessionId) {
    try {
      const res = await fetch(
        `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`,
        { cache: "no-store" }
      );
      if (res.ok) initialOrder = await res.json();
    } catch {
      /* ignore; client will poll */
    }
  }

  return (
    <main className="min-h-screen p-8 mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">✅ Payment Successful!</h1>
      <p className="mb-6">Your order has been processed.</p>

      {sessionId && (
        <p className="text-xs opacity-60 mb-6">
          Session ID:{" "}
          <code className="px-1 py-0.5 rounded bg-base-200">{sessionId}</code>
        </p>
      )}

      <OrderPanel sessionId={sessionId} initialOrder={initialOrder} />

      <a href="/" className="btn btn-primary mt-8">
        Back to Home
      </a>
    </main>
  );
}
