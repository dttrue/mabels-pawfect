// app/api/memorials/create/page.js
import MemorialSubmissionForm from "@/components/memorials/MemorialSubmissionForm";

export const metadata = {
  title: "Create a Pet Memorial | Mabel's Pawfect",
  description:
    "Create a lasting tribute to your beloved pet and share their story in the Mabel's Pawfect Memorial Gallery.",
};

export default function CreateMemorialPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white px-4 py-12 sm:py-16">
      <section className="mx-auto max-w-3xl">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-700">
            Mabel&apos;s Pawfect Memorial Gallery
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Create a Lasting Tribute
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-700 sm:text-lg">
            Share your pet&apos;s story and upload up to six photos. Bridget
            will review your submission and prepare it for the public Memorial
            Gallery.
          </p>

          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-pink-200 bg-white p-4 text-left shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Your memorial includes:
            </h2>

            <ul className="mt-2 space-y-1 text-sm leading-6 text-gray-600">
              <li>Up to six photos of your pet</li>
              <li>Your pet&apos;s story and favorite memories</li>
              <li>A dedicated page in our Memorial Gallery</li>
              <li>A minimum donation of $3</li>
            </ul>
          </div>
        </header>

        <div className="mt-10">
          <MemorialSubmissionForm />
        </div>
      </section>
    </main>
  );
}
