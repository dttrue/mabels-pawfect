"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ThankYouPage() {
  useEffect(() => {
  confetti({
    angle: 120,
    spread: 100,
    particleCount: 200,
    origin: { y: 0.6 },
  });

  }, []);

  return (
    <section className="py-20 px-6 bg-pinky-50 min-h-screen text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-pink-600 mb-4">Thank You! 💖</h1>
        <p className="text-gray-700 mb-6">
          Your booking request has been received. We’ll get back to you shortly!
        </p>
        <p className="text-sm text-gray-500 mb-8">
          In the meantime, feel free to explore more about what we offer.
        </p>
        <a
          href="/"
          className="inline-block bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-md font-semibold"
        >
          Back to Home
        </a>
      </div>
    </section>
  );
}
