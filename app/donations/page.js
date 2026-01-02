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
          Your donation provides food, shelter, and medical care for rescued
          pets in need. Every dollar goes directly to helping animals find
          loving homes.
        </p>

        <div className="bg-pink-50 p-6 rounded-2xl shadow-lg">
          <Donations />
        </div>

        <p className="mt-6 text-sm text-gray-400 italic">
          Bridget and the animals thank you for your kindness and generosity 💕
        </p>

        {/* Local Rescue Links */}
        <div className="mt-12 text-left">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Local Animal Rescues We Support 🤍
          </h2>

          <ul className="space-y-4 text-sm text-gray-600">
            <li>
              <a
                href="https://10lilacres.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-pink-600 hover:underline"
              >
                10 Lil&apos; Acre Rescued Animal Farm
              </a>
              <div className="text-gray-500">
                116 Texas Rd, Old Bridge, NJ 08857
              </div>
            </li>

            <li>
              <a
                href="https://www.oldbridge.com/page/animal-control"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-pink-600 hover:underline"
              >
                Old Bridge Animal Shelter
              </a>
              <div className="text-gray-500">
                Municipal Center, 1 Old Bridge Plaza, Old Bridge, NJ 08857
              </div>
            </li>

            <li>
              <a
                href="https://www.huskyhouse.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-pink-600 hover:underline"
              >
                The Husky House
              </a>
              <div className="text-gray-500">391 NJ-34, Matawan, NJ 07747</div>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}

