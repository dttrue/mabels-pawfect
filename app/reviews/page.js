'use client'
import React, { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import ApprovedReviews from "@/components/ApprovedReviews";



export default function ReviewsPage() {
    const [editingReview, setEditingReview] = useState(null);
  return (
    <main className="bg-pinky-50 min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Client Reviews
        </h1>
        <p className="text-gray-600 mb-10">
          We’d love to hear from you! Submit your review and tell others about
          your experience.
        </p>
      </div>

      {/* Review Form with edit state */}
      <ReviewForm
        editingReview={editingReview}
        onFinishEdit={() => setEditingReview(null)}
      />

      {/* Review List with edit handler */}
      <div className="mt-16">
        <ApprovedReviews onEdit={setEditingReview} />
      </div>
    </main>
  );
}
