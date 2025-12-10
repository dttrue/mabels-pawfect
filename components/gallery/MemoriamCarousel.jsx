// components/gallery/MemoriamCarousel.jsx
import prisma from "@/lib/prisma";
import MemoriamCarouselClient from "./MemoriamCarouselClient";

export default async function MemoriamCarousel() {
  const memorials = await prisma.gallery.findMany({
    where: {
      category: "MEMORIAM",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!memorials.length) return null;

  return <MemoriamCarouselClient memorials={memorials} />;
}
