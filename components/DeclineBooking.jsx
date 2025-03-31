"use client";
import { useState, useEffect } from "react";


export default function DeclineBooking({ token }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleDecline = async () => {
    if (!message.trim()) {
      setError("Please provide a reason for declining.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Server error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Decline Booking</h1>
      <p className="mb-2 text-gray-700">
        Please let the client know why you're unable to accept this booking.
      </p>

      <textarea
        className="w-full border rounded p-3 h-32"
        placeholder="Write your message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {error && <p className="text-red-600 mt-2">{error}</p>}
      {success && (
        <p className="text-green-600 mt-2">
          Booking declined and message sent to client.
        </p>
      )}

      <button
        onClick={handleDecline}
        disabled={submitting}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        {submitting ? "Sending..." : "Decline Booking"}
      </button>
    </div>
  );
}
