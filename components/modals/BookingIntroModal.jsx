// components/modals/BookingIntroModal.jsx
"use client";

import React, { useState, useEffect } from "react";

export default function BookingIntroModal({ onClose }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("hideBookingIntro", "true");
    }
    onClose();
  };

  // Apply fade-in effect using Tailwind
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-out animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">🎉 New Booking Features</h2>

        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>
            <strong>Multi-Date Booking:</strong> Select multiple days & times in one booking!
          </li>
          <li>
            <strong>Auto-Save:</strong> Your info is saved automatically in your browser.
          </li>
          <li>
            <strong>Clear Info:</strong> Use the 🧹 button to reset saved info at any time.
          </li>
        </ul>

        <div className="mt-4 flex items-center">
          <input
            id="dontShowAgain"
            type="checkbox"
            checked={dontShowAgain}
            onChange={() => setDontShowAgain(!dontShowAgain)}
            className="mr-2"
          />
          <label htmlFor="dontShowAgain" className="text-sm text-gray-600">
            Don’t show this again
          </label>
        </div>

        <div className="mt-6 text-right">
          <button onClick={handleClose} className="btn btn-primary btn-sm">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
