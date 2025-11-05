import Image from "next/image";
import Link from "next/link";
import ShareButton from "@/components/ShareButton";

export const metadata = {
  title: "Halloween 2025 Winner – Petey the Postman | Mabel’s Pawfect",
  description:
    "Petey the Postman won our Halloween 2025 costume contest! See the winning photo and highlights.",
  openGraph: {
    title: "Halloween 2025 Winner – Petey the Postman",
    description:
      "Petey the Postman won our Halloween 2025 costume contest! See the winning photo and highlights.",
    images: ["/images/contest/2025/petey-postman.jpg"],
  },
};

export default function WinnerPage() {
  const src = "/images/contest/2025/petey-postman.jpg";
  const canonical = "https://mabels-pawfect.com/contest/halloween-2025/winner"; // fine as a hardcoded share URL in dev

  return (
    <main className="min-h-screen bg-[#0f0a07] text-amber-100">
      <header className="border-b border-white/10 bg-gradient-to-r from-[#3b1f0e] via-[#5a2e0f] to-[#3b1f0e]">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">
            🏆 Halloween 2025 Winner: Petey the Postman
          </h1>
          <Link
            href="/"
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-semibold text-amber-100 hover:bg-white/5"
          >
            Back Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr] items-start">
          <div className="relative">
            <div className="rounded-xl border border-white/10 bg-[#1b120a] p-2 shadow-sm">
              <Image
                src={src}
                alt="Petey the Postman – Halloween 2025 winning costume"
                width={1200}
                height={1600}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>
            <div className="pointer-events-none absolute -left-2 -top-2 h-10 w-10 rounded-full bg-amber-400/30 blur-md" />
          </div>

          <div className="space-y-6">
            <p className="text-amber-100/90">
              Congratulations to <strong>Petey the Postman</strong>—our
              Halloween 2025 champion! Thanks to everyone who submitted entries
              and voted.
            </p>
            <ul className="space-y-2 text-sm text-amber-100/85">
              <li>📮 Outfit: USPS-inspired postman costume</li>
              <li>📅 Event: Mabel’s Pawfect Pet Services – Halloween 2025</li>
              <li>🍬 Prize: One toy + free 30-minute walk</li>
            </ul>

            <div className="flex flex-wrap gap-3">
              <a
                href={src}
                download
                className="inline-flex items-center justify-center rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-amber-300"
              >
                Download Photo
              </a>
              <Link
                href="/contest/halloween-2025"
                className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-white/5"
              >
                View All Entries
              </Link>
              <ShareButton url={canonical} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
