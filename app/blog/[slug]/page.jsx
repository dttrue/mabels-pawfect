// app/blog/[slug]/page.jsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { sanityClient } from "@/lib/sanity";
import { urlFor } from "@/lib/sanityImage";
import AuthorPulse from "@/components/blog/AuthorPulse";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  publishedAt,
  image,
  author->{name, image},
  body[]{
    ...,
    _type == "imageGallery" => {
      layout,
      images[]{
        ...,
        alt,
        caption
      }
    }
  }
}`;

const options = { next: { revalidate: 30 } };

function formatDate(d) {
  try {
    return d ? new Date(d).toLocaleDateString() : "";
  } catch {
    return "";
  }
}

const portableComponents = {
  types: {
    imageGallery: ({ value }) => {
      const images = value?.images || [];
      if (images.length < 2) return null;

      const layout = value?.layout || "grid-2";

      const renderImg = (img) => {
        const src = img?.asset?._ref
          ? urlFor(img)
              .width(1600)
              .fit("max") // ✅ do not crop
              .auto("format")
              .url()
          : null;

        if (!src) return null;

        return (
          <figure key={img._key} className="break-inside-avoid">
            <img
              src={src}
              alt={img.alt || ""}
              className="w-full h-auto rounded-2xl border bg-white"
              loading="lazy"
              decoding="async"
            />
            {img.caption && (
              <figcaption className="mt-2 text-center text-sm text-gray-500">
                {img.caption}
              </figcaption>
            )}
          </figure>
        );
      };

      // Masonry
      if (layout === "masonry") {
        return (
          <section className="not-prose my-10">
            <div className="columns-1 sm:columns-2 gap-4">
              {images.map((img) => (
                <div key={img._key} className="mb-4 break-inside-avoid">
                  {renderImg(img)}
                </div>
              ))}
            </div>
          </section>
        );
      }

      // 3-col
      if (layout === "grid-3") {
        return (
          <section className="not-prose my-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {images.map(renderImg)}
            </div>
          </section>
        );
      }

      // default 2-col
      return (
        <section className="not-prose my-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map(renderImg)}
          </div>
        </section>
      );
    },

    // ✅ Chart images: always no crop
    chartImage: ({ value }) => {
      if (!value?.asset?._ref) return null;

      const src = urlFor(value)
        .width(2200)
        .fit("max") // ✅ no cropping
        .auto("format")
        .url();

      return (
        <figure className="not-prose my-10">
          <img
            src={src}
            alt={value.alt || ""}
            className="mx-auto w-full h-auto max-w-4xl rounded-xl border bg-white"
            loading="lazy"
            decoding="async"
          />
          {value.caption && (
            <figcaption className="mt-3 text-center text-sm text-gray-500">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },

    // ✅ Inline images inside the article: NO CROPPING
    image: ({ value }) => {
      if (!value?.asset?._ref) return null;

      const src = urlFor(value)
        .width(1800)
        .fit("max") // ✅ keep full image
        .auto("format")
        .url();

      return (
        <figure className="not-prose my-8">
          <img
            src={src}
            alt={value.alt || ""}
            className="w-full h-auto rounded-2xl border bg-white"
            loading="lazy"
            decoding="async"
          />

          {value.caption && (
            <figcaption className="mt-3 text-center text-sm text-gray-500">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },

    // ✅ imageWithText: keep layout, but don't crop the image
    imageWithText: ({ value }) => {
      const alignment = value?.alignment || "left";
      const img = value?.image;
      const blocks = value?.body || [];

      if (!img?.asset?._ref || !Array.isArray(blocks) || !blocks.length) {
        return null;
      }

      const src = urlFor(img)
        .width(1600)
        .fit("max") // ✅ no cropping
        .auto("format")
        .url();

      const isRight = alignment === "right";

      return (
        <section className="not-prose my-10">
          <div
            className={[
              "rounded-2xl border bg-white p-5 shadow-sm",
              "flex flex-col md:flex-row gap-6 items-start",
              isRight ? "md:flex-row-reverse" : "",
            ].join(" ")}
          >
            <div className="md:w-1/2">
              <img
                src={src}
                alt={img.alt || ""}
                className="w-full h-auto rounded-2xl border bg-white"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="md:w-1/2">
              <div className="prose prose-slate max-w-none prose-p:leading-8 prose-p:my-4">
                <PortableText value={blocks} />
              </div>
            </div>
          </div>
        </section>
      );
    },
  },

  block: {
    normal: ({ children, index }) => (
      <p
        className={
          index === 0
            ? "mb-6 text-lg leading-8 text-gray-800 font-medium"
            : "mb-5 text-base leading-7 text-gray-700"
        }
      >
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="not-prose my-8 rounded-2xl border border-pink-100 bg-pink-50/40 p-5">
        <div className="text-gray-800 leading-8 italic">{children}</div>
      </blockquote>
    ),
  },
};

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await sanityClient.fetch(POST_QUERY, { slug }, options);

  if (!post) return notFound();

  // ✅ Hero stays cropped (intentional)
  const heroUrl = post.image
    ? urlFor(post.image)
        .width(1800)
        .fit("max") // ✅ no crop
        .auto("format")
        .url()
    : null;


  const hasBody = Array.isArray(post.body);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/blog" className="text-sm text-gray-600 hover:underline">
          ← Back to posts
        </Link>

        {heroUrl && (
          <div className="mt-6 rounded-2xl border bg-white p-3">
            <img
              src={heroUrl}
              alt={post.image?.alt || post.title}
              className="w-full h-auto max-h-[520px] object-contain mx-auto"
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        <header className="mt-7">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {post.title}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span>{formatDate(post.publishedAt)}</span>
            <AuthorPulse authorName={post.author?.name} />
            <span>{post.author?.name}</span>
          </div>
        </header>

        <article
          className="
            prose prose-slate max-w-none mt-8

            prose-p:leading-8 prose-p:my-5
            prose-p:first-of-type:text-lg
            prose-p:first-of-type:leading-9
            prose-p:first-of-type:text-gray-800

            prose-headings:tracking-tight
            prose-headings:font-semibold
            prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
            prose-h3:mt-10 prose-h3:mb-3

            prose-a:text-pink-700 prose-a:no-underline prose-a:font-medium
            hover:prose-a:underline underline-offset-4

            prose-strong:text-gray-900
            prose-li:my-1 prose-li:leading-7
          "
        >
          {hasBody ? (
            <PortableText value={post.body} components={portableComponents} />
          ) : (
            <p className="text-red-600 text-sm">
              No body array found on this post.
            </p>
          )}
        </article>
      </div>
    </main>
  );
}
