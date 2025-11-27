// app/blog/[slug]/page.jsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { sanityClient } from "@/lib/sanity";
import { urlFor } from "@/lib/sanityImage";

// Expanded query for gallery + future fields
const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  publishedAt,
  image,
  body
}`;

const options = { next: { revalidate: 30 } };

// 🔥 Portable Text Components (supports images + galleries + blockquotes)
const portableComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) return null;
      const src = urlFor(value).width(900).height(500).url();

      return (
        <figure className="my-6">
          <img
            src={src}
            alt={value.alt || ""}
            className="rounded-xl w-full h-auto object-cover"
          />
          {value.caption && (
            <figcaption className="text-sm text-gray-500 mt-2 text-center">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },

    // 🖼️ NEW — Gallery Block Renderer
    imageWithText: ({ value }) => {
      const alignment = value.alignment || "left";
      const img = value.image;
      const blocks = value.body || [];

      if (!img?.asset?._ref || !Array.isArray(blocks) || !blocks.length) {
        return null;
      }

      const src = urlFor(img).width(800).height(600).url();
      const isRight = alignment === "right";

      return (
        <section className="my-8">
          <div
            className={`
              flex flex-col md:flex-row gap-6 items-center
              ${isRight ? "md:flex-row-reverse" : ""}
            `}
          >
            <div className="md:w-1/2">
              <img
                src={src}
                alt={img.alt || ""}
                className="w-full h-auto rounded-xl object-cover"
              />
            </div>

            <div className="md:w-1/2">
              <PortableText
                value={blocks}
                components={{
                  block: {
                    normal: ({ children }) => (
                      <p className="mb-3 leading-relaxed">{children}</p>
                    ),
                  },
                }}
              />
            </div>
          </div>
        </section>
      );
    },
  },

  block: {
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),

    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-amber-400 pl-4 italic my-4">
        {children}
      </blockquote>
    ),
  },
};

export default async function PostPage({ params }) {
  // Next.js 15 dynamic params are async
  const { slug } = await params;

  const post = await sanityClient.fetch(POST_QUERY, { slug }, options);

  if (!post) {
    console.log("[BLOG] post not found for slug:", slug);
    return notFound();
  }

  const postImageUrl = post.image
    ? urlFor(post.image).width(550).height(310).url()
    : null;

  const hasBody = Array.isArray(post.body);

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
      <Link href="/blog" className="hover:underline">
        ← Back to posts
      </Link>

      {postImageUrl && (
        <img
          src={postImageUrl}
          alt={post.title}
          className="aspect-video rounded-xl"
          width="550"
          height="310"
        />
      )}

      <h1 className="text-4xl font-bold">{post.title}</h1>

      <div className="prose mt-4">
        <p className="text-sm text-gray-500 mb-4">
          {post.publishedAt
            ? `Published: ${new Date(post.publishedAt).toLocaleDateString()}`
            : null}
        </p>

        {hasBody ? (
          <PortableText value={post.body} components={portableComponents} />
        ) : (
          <p className="text-red-600 text-sm">
            No body array found on this post.
          </p>
        )}
      </div>
    </main>
  );
}
