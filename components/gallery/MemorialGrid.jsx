// components/gallery/MemorialGrid.jsx

import prisma from "@/lib/prisma";
import MemorialGridClient from "./MemorialGridClient";

export default async function MemorialGrid() {
  const memorials = await prisma.petMemorial.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      petName: true,
      headline: true,
      story: true,
      birthYear: true,
      passedYear: true,
      publishedAt: true,
      images: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          caption: true,
          isCover: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  const formattedMemorials = memorials
    .map((memorial) => {
      const coverImage =
        memorial.images.find((image) => image.isCover) || memorial.images[0];

      if (!coverImage) {
        return null;
      }

      return {
        ...memorial,
        coverImage,
      };
    })
    .filter(Boolean);

  return <MemorialGridClient memorials={formattedMemorials} />;
}
