import { cld } from "@/lib/cld";

export default async function ContestPage({ params }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/contest/${params.slug}/entries`
  );
  const { entries } = await res.json();

  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8 capitalize">
        {params.slug.replace("-", " ")} Contest 🎃
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <div key={entry.id} className="card bg-base-200 shadow-xl">
            <figure>
              <img
                src={cld(entry.publicId)}
                alt={entry.title}
                className="aspect-[4/3] object-cover"
              />
            </figure>
            <div className="card-body items-center text-center">
              <h2 className="card-title">{entry.title}</h2>
              <button className="btn btn-primary btn-sm mt-2">Vote</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
