// app/api/admin/donations/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

const VALID_STATUSES = new Set(["PENDING", "PAID", "FAILED", "REFUNDED"]);

const VALID_TARGETS = new Set(["GENERAL", "FOSTER_CAT"]);

const VALID_PURPOSES = new Set([
  "GENERAL",
  "FOOD_LITTER",
  "TOYS_ENRICHMENT",
  "KITTEN_RESCUE",
  "PREMIUM_RESCUE",
]);

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function authorizeAdmin() {
  const admin = await requireAdmin();

  if (admin.authorized) {
    return null;
  }

  return NextResponse.json(
    {
      error:
        admin.reason === "SIGNED_OUT"
          ? "Authentication required"
          : "Administrator access required",
    },
    {
      status: admin.reason === "SIGNED_OUT" ? 401 : 403,
    }
  );
}

export async function GET(req) {
  const unauthorized = await authorizeAdmin();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const url = new URL(req.url);

    const requestedPage = parsePositiveInteger(url.searchParams.get("page"), 1);

    const requestedPageSize = parsePositiveInteger(
      url.searchParams.get("pageSize"),
      25
    );

    const pageSize = Math.min(requestedPageSize, 100);

    const search = String(url.searchParams.get("search") || "").trim();

    const requestedStatus = String(
      url.searchParams.get("status") || ""
    ).toUpperCase();

    const requestedTarget = String(
      url.searchParams.get("target") || ""
    ).toUpperCase();

    const requestedPurpose = String(
      url.searchParams.get("purpose") || ""
    ).toUpperCase();

    const fosterCatId = String(
      url.searchParams.get("fosterCatId") || ""
    ).trim();

    const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : null;

    const target = VALID_TARGETS.has(requestedTarget) ? requestedTarget : null;

    const purpose = VALID_PURPOSES.has(requestedPurpose)
      ? requestedPurpose
      : null;

    /*
     * Search and purpose filters both contain OR conditions.
     * Placing them inside AND prevents one OR from overwriting
     * the other.
     */
    const filterConditions = [];

    if (purpose) {
      filterConditions.push({
        OR: [
          {
            items: {
              some: {
                purpose,
              },
            },
          },
          {
            /*
             * Backward compatibility for donations created
             * before DonationItem records were introduced.
             */
            AND: [
              {
                items: {
                  none: {},
                },
              },
              {
                purpose,
              },
            ],
          },
        ],
      });
    }

    if (search) {
      filterConditions.push({
        OR: [
          {
            donorName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            donorEmail: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            donorPhone: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            stripeSessionId: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            stripePaymentIntentId: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            fosterCat: {
              is: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      });
    }

    const filters = {
      ...(status ? { status } : {}),
      ...(target ? { target } : {}),
      ...(fosterCatId ? { fosterCatId } : {}),
      ...(filterConditions.length > 0
        ? {
            AND: filterConditions,
          }
        : {}),
    };

    const totalItems = await prisma.donation.count({
      where: filters,
    });

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * pageSize;

    const [
      donations,
      allDonationCount,
      paidSummary,
      pendingCount,
      failedCount,
      refundedCount,
      statusGroups,
      targetGroups,
      legacyPurposeGroups,
      paidDonationItems,
      fosterCats,
    ] = await Promise.all([
      prisma.donation.findMany({
        where: filters,

        include: {
          fosterCat: {
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              imageAlt: true,
              status: true,
            },
          },

          items: {
            select: {
              id: true,
              purpose: true,
              amountCents: true,
              quantity: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],

        skip,
        take: pageSize,
      }),

      prisma.donation.count(),

      prisma.donation.aggregate({
        where: {
          status: "PAID",
        },
        _count: {
          id: true,
        },
        _sum: {
          amountCents: true,
        },
      }),

      prisma.donation.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.donation.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.donation.count({
        where: {
          status: "REFUNDED",
        },
      }),

      prisma.donation.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
        _sum: {
          amountCents: true,
        },
      }),

      prisma.donation.groupBy({
        by: ["target"],
        where: {
          status: "PAID",
        },
        _count: {
          id: true,
        },
        _sum: {
          amountCents: true,
        },
      }),

      /*
       * These are paid donations created before DonationItem
       * records were introduced.
       */
      prisma.donation.groupBy({
        by: ["purpose"],
        where: {
          status: "PAID",
          items: {
            none: {},
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          amountCents: true,
        },
      }),

      /*
       * New donations store every selected purpose separately.
       */
      prisma.donationItem.findMany({
        where: {
          donation: {
            status: "PAID",
          },
        },
        select: {
          purpose: true,
          amountCents: true,
          quantity: true,
        },
      }),

      prisma.fosterCat.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
        ],
      }),
    ]);

    /*
     * Build accurate purpose totals from DonationItem records.
     * Legacy donations without items are added afterward.
     */
    const purposeBreakdownMap = new Map();

    for (const item of paidDonationItems) {
      const quantity = Number.isInteger(item.quantity) ? item.quantity : 1;

      const amountCents = Number(item.amountCents || 0) * quantity;

      const current = purposeBreakdownMap.get(item.purpose) || {
        purpose: item.purpose,
        count: 0,
        amountCents: 0,
      };

      current.count += quantity;
      current.amountCents += amountCents;

      purposeBreakdownMap.set(item.purpose, current);
    }

    for (const group of legacyPurposeGroups) {
      const current = purposeBreakdownMap.get(group.purpose) || {
        purpose: group.purpose,
        count: 0,
        amountCents: 0,
      };

      current.count += group._count.id;
      current.amountCents += group._sum.amountCents || 0;

      purposeBreakdownMap.set(group.purpose, current);
    }

    const purposeBreakdowns = Array.from(purposeBreakdownMap.values()).sort(
      (first, second) => first.purpose.localeCompare(second.purpose)
    );

    return NextResponse.json({
      donations,

      summary: {
        allDonationCount,
        paidDonationCount: paidSummary._count.id,
        paidAmountCents: paidSummary._sum.amountCents || 0,
        pendingCount,
        failedCount,
        refundedCount,
      },

      breakdowns: {
        statuses: statusGroups.map((group) => ({
          status: group.status,
          count: group._count.id,
          amountCents: group._sum.amountCents || 0,
        })),

        targets: targetGroups.map((group) => ({
          target: group.target,
          count: group._count.id,
          amountCents: group._sum.amountCents || 0,
        })),

        purposes: purposeBreakdowns,
      },

      fosterCats,

      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },

      activeFilters: {
        search,
        status,
        target,
        purpose,
        fosterCatId: fosterCatId || null,
      },
    });
  } catch (error) {
    console.error("[admin donations] GET error:", error);

    return NextResponse.json(
      {
        error: "Failed to load donation records",

        detail:
          process.env.NODE_ENV === "development"
            ? error?.message || String(error)
            : undefined,

        code:
          process.env.NODE_ENV === "development"
            ? error?.code || null
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}
