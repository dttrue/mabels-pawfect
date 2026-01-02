// components/gallery/MemorialGrid.jsx
import MemorialGridClient from "./MemorialGridClient";

export default async function MemorialGrid() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/gallery`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    console.error("Failed to fetch memorial gallery images");
    return <MemorialGridClient memorials={[]} />;
  }

  const images = await res.json();

  const memorials = images
    .filter((img) => img.category === "MEMORIAM" && img.deletedAt === null)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return <MemorialGridClient memorials={memorials} />;
}
