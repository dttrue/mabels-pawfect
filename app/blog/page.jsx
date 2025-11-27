// app/blog/page.jsx
import Link from "next/link";
import { sanityClient } from "@/lib/sanity";
import { urlFor } from "@/lib/sanityImage";

const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current)
] | order(publishedAt desc)[0...20]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  image
}`;

const options = { next: { revalidate: 30 } };

export default async function BlogIndexPage() {
  const posts = await sanityClient.fetch(POSTS_QUERY, {}, options);

  if (!posts.length) {
    return (
      <main className="container mx-auto min-h-screen max-w-3xl p-8">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-gray-600">No posts yet. Check back soon! 🐾</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      <ul className="flex flex-col gap-y-6">
        {posts.map((post) => {
          const imgUrl = post.image
            ? urlFor(post.image).width(800).height(400).url()
            : null;

          return (
            <li key={post._id}>
              <Link
                href={`/blog/${post.slug}`}
                className="block border rounded-xl shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow"
              >
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt={post.image?.alt || post.title}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : ""}
                  </p>
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="text-sm text-amber-600 mt-3 font-medium">
                    Read more →
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
