"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function ApprovedReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get("/api/reviews");
        const approved = res.data.filter((r) => r.approved);
        setReviews(approved);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) return <p className="text-center">Loading reviews...</p>;

  return (
    <section className="py-16 px-4 bg-pinky-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">
          Verified Client Reviews
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex items-center mb-4">
                <img
                  src={review.imageUrl || "/images/default-avatar.png"}
                  alt={review.name}
                  className="w-12 h-12 rounded-full object-cover mr-3"
                />
                <div>
                  <p className="font-semibold text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">Verified Review</p>
                </div>
              </div>

              <blockquote className="text-sm italic text-gray-600 mb-3">
                “{review.message}”
              </blockquote>

              {typeof review.rating === "number" && review.rating > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-1">
                    Rating:{" "}
                    <span className="font-medium text-gray-700">
                      {review.rating}/5
                    </span>
                  </p>
                  <div
                    className="flex space-x-1"
                    title={`${review.rating} out of 5 paws`}
                  >
                    {[1, 2, 3, 4, 5].map((paw) => (
                      <span
                        key={paw}
                        className={`text-xl ${
                          paw <= review.rating
                            ? "text-pink-500"
                            : "text-gray-300"
                        }`}
                      >
                        🐾
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm italic text-gray-400">
                  No rating provided
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
