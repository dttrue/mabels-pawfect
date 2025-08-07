// components/NewsletterUploadPage.jsx
"use client";

import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // ensures SSR pulls latest data

export default async function NewslettersPage() {
  const newsletters = await prisma.newsletter.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">📚 Newsletters</h1>

      {newsletters.length === 0 ? (
        <p className="text-center text-gray-500">
          No newsletters available yet. Check back soon!
        </p>
      ) : (
        <div
          className={`grid gap-8 ${
            newsletters.length === 1
              ? "grid-cols-1 place-items-center"
              : "md:grid-cols-2"
          }`}
        >
          {newsletters.map((n) => (
            <div
              className="card bg-base-100 shadow-xl w-full max-w-xl"
              key={n.id}
            >
              <figure>
                <label htmlFor={`modal-${n.id}`}>
                  <img
                    src={n.imageUrl}
                    alt={n.altText || n.title}
                    className="w-full h-auto object-cover cursor-pointer hover:opacity-80 transition"
                  />
                </label>
              </figure>
              <div className="card-body">
                <h2 className="card-title">
                  <Link
                    href={`/newsletter/${n.id}`}
                    className="hover:underline hover:text-pink-600"
                  >
                    {n.title}
                  </Link>
                </h2>
                {n.description && <p>{n.description}</p>}
                {n.keywords?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-400">Tags:</span>{" "}
                    {n.keywords.map((k, i) => (
                      <span key={i} className="badge badge-outline mr-1">
                        {k}
                      </span>
                    ))}
                  </div>
                )}
                {n.fileUrl && (
                  <a
                    href={n.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-accent mt-4"
                  >
                    📄 Download PDF
                  </a>
                )}
              </div>

              {/* Modal */}
              <input
                type="checkbox"
                id={`modal-${n.id}`}
                className="modal-toggle"
              />
              <div className="modal">
                <div className="modal-box max-w-5xl p-4">
                  <h3 className="font-bold text-lg mb-4">{n.title}</h3>
                  <img
                    src={n.imageUrl}
                    alt={n.altText || n.title}
                    className="w-full h-auto rounded object-contain"
                  />
                  <div className="modal-action">
                    <label htmlFor={`modal-${n.id}`} className="btn">
                      Close
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
