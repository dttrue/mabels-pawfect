// components/dashboard/OvernightBlocker.jsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function OvernightBlocker() {
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [justUnblockedDate, setJustUnblockedDate] = useState(null);

  // Load all blocked overnights
  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const fetchBlockedDates = async () => {
    const res = await fetch("/api/blocked-dates?service=overnight");
    const data = await res.json();
    setBlockedDates(data); // e.g. ['2025-06-18']
  };

  const isBlocked = (date) => blockedDates.includes(date);

  const handleToggle = async () => {
    setLoading(true);

    const method = isBlocked(selectedDate) ? "DELETE" : "POST";

    const res = await fetch("/api/blocked-dates", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate }),
    });

    if (res.ok) {
      toast.success(
        method === "DELETE" ? "✅ Date unblocked." : "✅ Date blocked."
      );

      // 🧠 Save the unblocked date so we can strike it through temporarily
      if (method === "DELETE") {
        const formatted = new Date(selectedDate).toISOString().split("T")[0];
        setJustUnblockedDate(formatted);

        // Wait 1500ms to show strike-through before re-fetching list
        setTimeout(async () => {
          await fetchBlockedDates();
          setJustUnblockedDate(null);
        }, 1500);
      }

      await fetchBlockedDates();
    } else {
      const error = await res.json();
      toast.error(`⚠️ ${error.error || "Server error"}`);
    }

    setLoading(false);
  };



  return (
    <div className="mt-10 space-y-4">
      <h2 className="text-lg font-bold">📅 Overnight Booking Control</h2>

      <input
        type="date"
        className="input input-bordered"
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      {selectedDate && (
        <button
          disabled={loading}
          className={`btn w-full ${
            isBlocked(selectedDate) ? "btn-error" : "btn-primary"
          }`}
          onClick={handleToggle}
        >
          {loading
            ? "Processing..."
            : isBlocked(selectedDate)
              ? "Unblock Overnight"
              : "Block Overnight"}
        </button>
      )}

      {/* Show a small preview of currently blocked dates */}
      {blockedDates.length > 0 && (
        <div className="text-sm text-gray-600 mt-4">
          <p className="font-medium mb-1">Currently Blocked Dates:</p>
          <ul className="list-disc list-inside space-y-1">
            {console.log("🧾 Blocked Dates Rendering:", blockedDates)}
            {blockedDates.map((d) => {
              const isUnblocked = d === justUnblockedDate;
              return (
                <li
                  key={d}
                  className={`transition-all duration-300 ${
                    isUnblocked ? "line-through text-gray-400" : ""
                  }`}
                >
                  📌 {d}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );

}

