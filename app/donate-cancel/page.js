// app/donate-cancel/page.js

import Link from "next/link";

export default function DonateCancel() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Donation Canceled
        </h1>
        <p className="text-gray-700 text-lg mb-4">
          It looks like your donation was not completed.
        </p>
        <p className="text-gray-500 mb-6">
          If you changed your mind, no worries! You can always try again or
          contact us if you had any issues.
        </p>

        <Link
          href="/donations"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          Try Again
        </Link>
      </div>
    </main>
  );
}
