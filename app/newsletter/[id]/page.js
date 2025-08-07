// app/newsletter/page.js

import ClientNewsletterGallery from "@/components/newsletters/ClientNewsletterGallery";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewslettersPage() {
  const newsletters = await prisma.newsletter.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">📚 Newsletters</h1>
      <ClientNewsletterGallery newsletters={newsletters} />
    </div>
  );
}
