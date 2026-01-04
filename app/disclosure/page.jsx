// app/disclosure/page.jsx

import Link from "next/link";

export const metadata = {
  title: "Affiliate Disclosure | Mabel’s Pawfect",
  description:
    "Affiliate disclosure for Mabel’s Pawfect. Learn how affiliate links work and how we keep recommendations honest.",
};

export default function DisclosurePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-900">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold leading-tight text-[color:var(--foreground-strong)]">
          Affiliate Disclosure
        </h1>
        <p className="mt-3 text-neutral-600">
          We occasionally use affiliate links in our content. Here’s what that
          means, plainly.
        </p>
      </header>

      <section className="space-y-6 text-neutral-800 leading-relaxed">
        <div className="rounded-xl border border-pink-100 bg-pink-50/60 p-5">
          <p className="font-medium text-neutral-900">
            Disclosure (quick version)
          </p>
          <p className="mt-2 text-neutral-700">
            Some links on this site are affiliate links. If you purchase through
            those links, we may earn a small commission{" "}
            <span className="font-medium">at no extra cost to you</span>.
          </p>
          <p className="mt-2 text-neutral-700">
            <span className="font-medium">
              As Amazon Associates, we earn from qualifying purchases.
            </span>
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Why we use affiliate links</h2>
          <p className="mt-2 text-neutral-700">
            Affiliate links help support the time it takes to research, test,
            write, and maintain this site. They don’t change what we say — they
            just help fund the work.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            How recommendations work here
          </h2>
          <ul className="mt-3 list-disc pl-6 space-y-2 text-neutral-700">
            <li>
              We recommend products we’ve used ourselves or that we feel are a
              reasonable match for the situation described.
            </li>
            <li>
              If something has real trade-offs (tracking, odor, cost, etc.), we
              say so.
            </li>
            <li>
              We don’t claim a product is “best” for everyone — we focus on fit.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Amazon</h2>
          <p className="mt-2 text-neutral-700">
            We participate in the Amazon Services LLC Associates Program, an
            affiliate advertising program designed to provide a means for sites
            to earn advertising fees by advertising and linking to Amazon.
          </p>
          <p className="mt-2 text-neutral-700">
            Required statement:{" "}
            <span className="font-medium">
              As Amazon Associates, we earn from qualifying purchases.
            </span>
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            Chewy and other affiliate partners
          </h2>
          <p className="mt-2 text-neutral-700">
            We may also use affiliate links to other retailers (for example,
            Chewy). If we do, the same rule applies: if you buy through a link,
            we may earn a commission at no extra cost to you.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-2 text-neutral-700">
            Questions about affiliate links or how we choose products? Reach out
            via the{" "}
            <Link
              href="/contact"
              className="text-pink-700 hover:text-pink-800 underline underline-offset-4"
            >
              contact page
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
