// components/ModernAvailabilityCalendar.jsx
"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import clsx from "clsx";

export default function ModernAvailabilityCalendar({ onSelect }) {
  const [bookedDates, setBookedDates] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      const today = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 6);

      const startStr = today.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      const res = await fetch(
        `/api/availability?start=${startStr}&end=${endStr}`
      );
      const data = await res.json();

      const map = {};
      data.forEach(
        ({
          date,
          slots = [],
          isFullyBooked = false,
          blockedByAdmin = false,
        }) => {
          map[date] = { slots, isFullyBooked, blockedByAdmin };
        }
      );

      setBookedDates(map);
    };

    fetchAvailability();
  }, []);

  const handleDayClick = (day) => {
    const iso = day.toISOString().split("T")[0];
    setSelectedDay(iso);
    const slotList = bookedDates[iso]?.slots || [];
    onSelect?.(iso, slotList);
  };

  const modifiers = {
    fullyBooked: (d) =>
      bookedDates[d.toISOString().split("T")[0]]?.isFullyBooked,
    partiallyBooked: (d) => {
      const data = bookedDates[d.toISOString().split("T")[0]];
      return data && data.slots?.length > 0 && !data.isFullyBooked;
    },
    blocked: (d) => bookedDates[d.toISOString().split("T")[0]]?.blockedByAdmin,
  };

  const modifiersClassNames = {
    blocked: "bg-black text-white border border-pink-400",
    fullyBooked: "bg-pink-300 text-white",
    partiallyBooked: "bg-yellow-100 border-pink-200",
    selected: "ring-2 ring-pink-500",
  };

  const footer = (
    <div className="mt-4 text-sm text-center">
      <p>
        <span className="text-pink-500">🐾</span> Available |{" "}
        <span className="text-yellow-600">⚠️</span> Limited |{" "}
        <span className="text-pink-800">🚫</span> Blocked
      </p>
    </div>
  );

  return (
    <div className="p-4 bg-white shadow rounded-xl">
      <h2 className="text-lg font-bold text-center mb-3">
        📅 Select Booking Date
      </h2>

      <DayPicker
        selected={selectedDay ? new Date(selectedDay) : undefined}
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        fromDate={new Date()}
        toDate={new Date(new Date().setMonth(new Date().getMonth() + 6))}
      />

      {footer}
    </div>
  );
}
