// lib/publicFosterCats.js

import prisma from "@/lib/prisma";

export async function getPublicFosterCats() {
  const fosterCats = await prisma.fosterCat.findMany({
    where: {
      deletedAt: null,
      isFeatured: true,
      status: "ACTIVE",
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      shortBio: true,
      story: true,
      careNeeds: true,
      ageLabel: true,
      sex: true,
      imageUrl: true,
      imageAlt: true,
      goalCents: true,
      donations: {
        where: {
          status: "PAID",
        },
        select: {
          amountCents: true,
        },
      },
    },
  });

  return fosterCats.map(({ donations, ...cat }) => ({
    ...cat,
    raisedCents: donations.reduce(
      (total, donation) => total + donation.amountCents,
      0
    ),
    paidDonationCount: donations.length,
  }));
}
