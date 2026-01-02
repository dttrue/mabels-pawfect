// components/gallery/HappyPetsGrid.jsx
import HappyPetsGridClient from "./HappyPetsGridClient";

export default async function HappyPetsGrid() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/gallery`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    console.error("Failed to fetch gallery images");
    return <HappyPetsGridClient images={[]} />;
  }

  const images = await res.json();

  // filter + sort server-side
  const happyImages = images
    .filter((img) => img.category === "HAPPY" && img.deletedAt === null)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return <HappyPetsGridClient images={happyImages} />;
}
