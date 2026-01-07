// app/blog/page.jsx
import Link from "next/link";
import { sanityClient } from "@/lib/sanity";
import { urlFor } from "@/lib/sanityImage";
import AuthorPulse from "@/components/blog/AuthorPulse";

const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current)
] | order(isFeatured desc, publishedAt desc)[0...20]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  image,
  isFeatured,
  author->{name, image},
  categories[]->{title, "slug": slug.current}
}`;

const options = { next: { revalidate: 30 } };

function formatDate(d) {
  try {
    return d ? new Date(d).toLocaleDateString() : "";
  } catch {
    return "";
  }
}

/**
 * Index images: stop aggressive cropping.
 * - Use fit("max") to preserve the whole image.
 * - Use CSS object-contain on the img so it doesn't chop heads off.
 */
function postImageUrl(image) {
  return urlFor(image).width(1400).fit("max").auto("format").url();
}

function Byline({ author, publishedAt }) {
  const date = formatDate(publishedAt);
  const name = author?.name;

  if (!date && !name) return null;

  return (
    <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
      {date && <span>{date}</span>}

      {date && name && <AuthorPulse authorName={name} />}

      {name && <span>{name}</span>}
    </p>
  );
}

function CategoryChips({ categories = [] }) {
  if (!categories?.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {categories.slice(0, 3).map((c) => (
        <span
          key={c.slug || c.title}
          className="inline-flex items-center rounded-full border bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700"
        >
          {c.title}
        </span>
      ))}
    </div>
  );
}

export default async function BlogIndexPage() {
  const posts = await sanityClient.fetch(POSTS_QUERY, {}, options);

  if (!posts.length) {
    return (
      <main className="container mx-auto min-h-screen max-w-5xl p-6 sm:p-10">
        <header className="mb-10">
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="mt-2 text-gray-600">
            Tips, guides, and pet-parent resources from Mabel’s Pawfect Pet
            Services 🐾
          </p>
        </header>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <p className="text-gray-700">No posts yet — check back soon!</p>
        </div>
      </main>
    );
  }

  const [featured, ...rest] = posts;

  const allCats = posts.flatMap((p) => p.categories || []).filter(Boolean);
  const uniqueCats = Array.from(
    new Map(allCats.map((c) => [c.slug || c.title, c])).values()
  ).slice(0, 8);

  return (
    <main className="container mx-auto min-h-screen max-w-5xl p-6 sm:p-10">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold">Blog</h1>
            <p className="mt-2 text-gray-600">
              Tips, guides, and pet-parent resources from Mabel’s Pawfect Pet
              Services 🐾
            </p>
          </div>

          <Link
            href="/booking"
            className="hidden sm:inline-flex rounded-full bg-pink-100 px-4 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-200 transition"
          >
            Book a visit →
          </Link>
        </div>

        {uniqueCats.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {uniqueCats.map((c) => (
              <span
                key={c.slug || c.title}
                className="rounded-full bg-pink-50 px-3 py-1 text-sm font-semibold text-pink-700"
              >
                {c.title}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Featured post */}
      <section className="mb-10">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
          Featured
        </p>

        <Link
          href={`/blog/${featured.slug}`}
          className="group block overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
        >
          {featured.image && (
            <div className="relative w-full aspect-[16/9] bg-gray-100 overflow-hidden">
              <img
                src={postImageUrl(featured.image)}
                alt={featured.image?.alt || featured.title}
                className="absolute inset-0 h-full w-full object-contain group-hover:scale-[1.01] transition-transform"
                loading="eager"
                decoding="async"
              />

              {featured.isFeatured && (
                <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-800 shadow-sm">
                  Featured
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            <Byline
              author={featured.author}
              publishedAt={featured.publishedAt}
            />

            <h2 className="mt-2 text-2xl font-bold leading-snug">
              {featured.title}
            </h2>

            {featured.excerpt && (
              <p className="mt-3 text-gray-700 line-clamp-3">
                {featured.excerpt}
              </p>
            )}

            <CategoryChips categories={featured.categories} />

            <p className="mt-4 text-amber-600 font-semibold">
              Read the featured post →
            </p>
          </div>
        </Link>
      </section>

      {/* Latest posts grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Latest
          </p>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rest.map((post) => {
            const imgUrl = post.image ? postImageUrl(post.image) : null;

            return (
              <li key={post._id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block border rounded-2xl shadow-sm bg-white overflow-hidden hover:shadow-md transition"
                >
                  {imgUrl && (
                    <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={post.image?.alt || post.title}
                        className="absolute inset-0 h-full w-full object-contain group-hover:scale-[1.01] transition-transform"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <Byline
                      author={post.author}
                      publishedAt={post.publishedAt}
                    />

                    <h3 className="mt-1 text-lg font-semibold leading-snug">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="mt-2 text-sm text-gray-700 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <CategoryChips categories={post.categories} />

                    <p className="text-sm text-amber-600 mt-3 font-semibold">
                      Read more →
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
