// app/highlights/page.js
import  prisma  from "@/lib/prisma";
import HighlightsGrid from "@/components/highlights/HighlightsGrid";

export const dynamic = "force-dynamic";

export default async function HighlightsIndexPage() {
  const items = await prisma.highlight.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true, // "video" | "image"
      url: true, // canonical MP4 or image URL
      publicId: true, // Cloudinary public_id
      posterUrl: true, // optional poster frame
    },
  });

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Highlights</h1>
      <HighlightsGrid items={items} />
    </main>
  );
}
