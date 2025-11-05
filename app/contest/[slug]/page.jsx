// app/contest/[slug]/page.jsx
import { cld } from "@/lib/cld";
import { headers } from "next/headers";

// build a reliable base URL on the server (works locally and in prod)
function getBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const host = headers().get("host") || "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function ContestPage({ params }) {
  // ✅ Next 15: await params
  const { slug } = await params;

  const base = getBaseUrl();

  let entries = [];
  try {
    const res = await fetch(`${base}/api/contest/${slug}/entries`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      entries = Array.isArray(json.entries) ? json.entries : [];
    } else {
      console.error("entries fetch failed", res.status, await res.text());
    }
  } catch (e) {
    console.error("entries fetch error", e);
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-8 capitalize">
        {slug.replace(/-/g, " ")} Contest 🎃
      </h1>

      {entries.length === 0 ? (
        <p className="text-center opacity-70">No entries to display.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <div key={entry.id} className="card bg-base-200 shadow-xl">
              <figure>
                <img
                  src={cld(entry.publicId)}
                  alt={entry.title || "Contest entry"}
                  className="aspect-[4/3] w-full h-auto object-cover rounded-md"
                  loading="lazy"
                />
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title">{entry.title || "Entry"}</h2>
                {/* voting is closed, but keep button if you want */}
                {/* <button className="btn btn-primary btn-sm mt-2">Vote</button> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
