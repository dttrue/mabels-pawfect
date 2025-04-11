'use client'
import React, { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import ApprovedReviews from "@/components/ApprovedReviews";



export default function ReviewsPage() {
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

      <ReviewForm />

      <div className="mt-16">
        <ApprovedReviews />
      </div>
    </main>
  );
}

