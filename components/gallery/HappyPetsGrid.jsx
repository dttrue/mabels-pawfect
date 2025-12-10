// components/gallery/HappyPetsGrid.jsx
import HappyPetsGridClient from "./HappyPetsGridClient";
import prisma from "@/lib/prisma";

export default async function HappyPetsGrid() {
  // Fetch once on the server so HTML includes the grid from first paint
  const images = await prisma.gallery.findMany({
    where: {
      category: "HAPPY",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  return <HappyPetsGridClient images={images} />;
}

