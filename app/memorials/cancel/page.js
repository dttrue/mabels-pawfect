// app/memorials/cancel/page.js

import Link from "next/link";

export const metadata = {
  title: "Memorial Payment Canceled | Mabel's Pawfect",
};

export default async function MemorialCancelPage({ searchParams }) {
  const params = await searchParams;
  const memorialId = String(params?.memorialId || "").trim();

  const retryHref = memorialId
    ? `/memorials/create?memorialId=${encodeURIComponent(memorialId)}`
    : "/memorials/create";

  return (
    <main className="min-h-[70vh] bg-[#fff9ee] px-4 py-16">
      <section className="mx-auto max-w-xl rounded-2xl border border-pink-100 bg-white p-6 text-center shadow-xl sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Payment not completed
        </p>

        <h1 className="mt-4 text-3xl font-semibold text-gray-900">
          Your memorial has been saved
        </h1>

        <p className="mt-4 text-gray-600">
          No payment was processed. Your memorial submission and uploaded photos
          are still saved, so you can return and complete payment.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={retryHref}
            className="rounded-lg bg-pink-600 px-5 py-3 font-medium text-white transition hover:bg-pink-700"
          >
            Return to Memorial
          </Link>

          <Link
            href="/memorials"
            className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            View Memorial Gallery
          </Link>
        </div>
      </section>
    </main>
  );
}
