// components/AvailabilityCalendar.jsx
"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function AvailabilityCalendar({ onSelect }) {
  const [bookedDates, setBookedDates] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [slots, setSlots] = useState([]);
  const [calendarKey, setCalendarKey] = useState(Date.now()); // ✅ force re-render key

  const fetchAvailability = async () => {
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const startStr = today.toISOString().split("T")[0];
    const endStr = sixMonthsLater.toISOString().split("T")[0];

    const res = await fetch(
      `/api/availability?start=${startStr}&end=${endStr}`
    );
    const data = await res.json();

    const map = {};
    data.forEach((entry) => {
      map[entry.date] = entry;
    });

    return map; // ✅ return so it can be manually set
  };


  useEffect(() => {
    const loadInitialAvailability = async () => {
      const data = await fetchAvailability(); // ⬅️ get the returned map
      setBookedDates(data); // ⬅️ apply it to state
    };

    loadInitialAvailability();
  }, []);


  const handleDayClick = (day) => {
    const dateStr = day.toISOString().split("T")[0];
    const info = bookedDates[dateStr];

    const slotList = info?.slots || [];

    setSelectedDay(dateStr);
    setSlots(slotList);

    if (onSelect) {
      onSelect(dateStr, slotList);
    }
  };

  const handleBlockDate = async () => {
    if (!selectedDay) return;

    const res = await fetch("/api/block-date", {
      method: "POST",
      body: JSON.stringify({ date: selectedDay }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      alert("✅ Day blocked successfully.");
      const updated = await fetchAvailability();
      setBookedDates(updated); // ✅ rebind updated map
      setCalendarKey(() => Math.random().toString(36).substring(2));
 // 🔁 force DayPicker rerender
      setSelectedDay(null);
      setTimeout(() => {
        setSelectedDay(selectedDay); // or rebuild new Date(selectedDay)
      }, 50);
    }

  };

  const handleUnblockDate = async () => {
    if (!selectedDay) return;

    const res = await fetch("/api/block-date", {
      method: "DELETE",
      body: JSON.stringify({ date: selectedDay }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      alert("✅ Day unblocked successfully.");

      // Wipe + deselect first to clear UI state
      setBookedDates({});
      setSelectedDay(null);

      // 🔁 Force full remount via totally new key
      const newKey = Math.random().toString(36).substring(2);
      setCalendarKey(newKey);

      // 🕒 Slight delay before rehydrating
      setTimeout(async () => {
        const updated = await fetchAvailability();
        setBookedDates({ ...updated }); // force state change

        const fresh = new Date(selectedDay);
        const refreshedStr = fresh.toISOString().split("T")[0];
        setSelectedDay(refreshedStr); // retrigger modifier
      }, 100);
    } else {
      const error = await res.json();
      alert(`⚠️ ${error.error}`);
    }
  };








  const modifiers = {
    fullyBooked: (date) => {
      const key = date.toISOString().split("T")[0];
      return (
        bookedDates[key]?.isFullyBooked && !bookedDates[key]?.blockedByAdmin
      );
    },
    partiallyBooked: (date) => {
      const key = date.toISOString().split("T")[0];
      return bookedDates[key] && !bookedDates[key]?.isFullyBooked;
    },
    blockedByAdmin: (date) => {
      const key = date.toISOString().split("T")[0];
      const isBlocked = bookedDates[key]?.blockedByAdmin === true;
      console.log("🔍 modifier check:", key, isBlocked);
      return isBlocked;
    },
  };


  const modifiersClassNames = {
    blockedByAdmin: "bg-black text-white",
    fullyBooked: "bg-red-300 text-white",
    partiallyBooked: "bg-yellow-200",
  };

  const today = new Date();
  const sixMonthsOut = new Date();
  sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2">📅 Choose a date</h2>

      <DayPicker
        key={
          calendarKey +
          "_" +
          selectedDay +
          "_" +
          Object.entries(bookedDates)
            .map(([k, v]) => `${k}:${v?.blockedByAdmin ? 1 : 0}`)
            .join(",")
        } // 🔁 triple compound trigger
        mode="single"
        selected={selectedDay ? new Date(selectedDay) : undefined}
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        fromDate={today}
        toDate={sixMonthsOut}
      />

      {selectedDay && (
        <div className="mt-4 bg-base-200 p-4 rounded">
          <h3 className="font-semibold mb-2">
            🕒 Availability for {selectedDay}
          </h3>
          {slots.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {slots.map((slot, i) => (
                <li key={i}>{slot}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-green-700">✅ Fully available</p>
          )}
        </div>
      )}

      {/* {selectedDay && (
        <div className="mt-2 flex justify-end">
          {bookedDates[selectedDay]?.blockedByAdmin ? (
            <button
              onClick={handleUnblockDate}
              className="btn btn-sm btn-accent"
            >
              ✅ Unblock This Day
            </button>
          ) : (
            <button onClick={handleBlockDate} className="btn btn-sm btn-error">
              ⛔ Block This Day
            </button>
          )}
        </div>
      )} */}
    </div>
  );
}
