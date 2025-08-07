// app/donations/page.js

import Donations from "@/components/Donation";

export default function DonationsPage() {
  return (
    <main className="bg-white min-h-screen py-16 px-4">
      <section className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-extrabold text-pink-600 mb-4">
          Help Us Save Stray Animals 🐾
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Your donation provides food, shelter, and medical care for rescued pets in need.
          Every dollar goes directly to helping animals find loving homes.
        </p>

        <div className="bg-pink-50 p-6 rounded-2xl shadow-lg">
          <Donations />
        </div>

        <p className="mt-6 text-sm text-gray-400 italic">
          Bridget and the animals thank you for your kindness and generosity 💕
        </p>
      </section>
    </main>
  );
}
