// app/memorials/success/page.js

import Link from "next/link";

export const metadata = {
  title: "Memorial Payment Complete | Mabel's Pawfect",
};

export default async function MemorialSuccessPage({ searchParams }) {
  const params = await searchParams;
  const sessionId = String(params?.session_id || "").trim();

  return (
    <main className="min-h-[70vh] bg-[#fff9ee] px-4 py-16">
      <section className="mx-auto max-w-xl rounded-2xl border border-pink-100 bg-white p-6 text-center shadow-xl sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Payment received
        </p>

        <h1 className="mt-4 text-3xl font-semibold text-gray-900">
          Your memorial has been submitted
        </h1>

        <p className="mt-4 text-gray-600">
          Thank you for creating a memorial with Mabel&apos;s Pawfect. Your
          payment was completed successfully, and the memorial will now be
          reviewed before publication.
        </p>

        {sessionId ? (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Payment reference
            </p>

            <p className="mt-2 break-all font-mono text-xs text-gray-700">
              {sessionId}
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/gallery/memoriam"
            className="rounded-lg bg-pink-600 px-5 py-3 font-medium text-white transition hover:bg-pink-700"
          >
            View Memorial Gallery
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Return Home
          </Link>
        </div>
      </section>
    </main>
  );
}
