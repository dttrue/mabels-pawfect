// components/BookingMultiDatePicker.jsx

// components/BookingMultiDatePicker.jsx

"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-multi-date-picker";
import generateDefaultTimeSlots from "@/utils/generateDefaultTimeSlots";

export default function BookingMultiDatePicker({
  onChange,
  blockedDates = [],
}) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [timesByDate, setTimesByDate] = useState({});

  const timeSlots = generateDefaultTimeSlots(6, 23, 30); // 6:00 AM – 11:00 PM

  // Sync selectedDates with timesByDate and emit formatted entries
  // 🧩 Sync timesByDate keys to match selectedDates
  useEffect(() => {
    const updated = { ...timesByDate };
    let changed = false;

    selectedDates.forEach((d) => {
      const iso = new Date(d).toISOString().split("T")[0];
      if (!(iso in updated)) {
        updated[iso] = "";
        changed = true;
      }
    });

    if (changed) {
      setTimesByDate(updated);
    }
  }, [selectedDates]);

  // ✅ Emit final entries once timesByDate is stable
  useEffect(() => {
    const entries = Object.entries(timesByDate).map(([date, time]) => {
      const matchedSlot = timeSlots.find((slot) => slot.value === time);
      return {
        date,
        time: matchedSlot?.label || "",
      };
    });

    
    onChange?.(entries);
  }, [timesByDate]);

  const handleTimeChange = (date, time) => {
    setTimesByDate((prev) => ({
      ...prev,
      [date]: time,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block font-semibold text-gray-800 text-lg mb-2">
          📅 Select Your Booking Dates
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Choose all dates you’d like to book. Then assign a time to each one
          below.
        </p>
        <DatePicker
          multiple
          value={selectedDates}
          onChange={setSelectedDates}
          format="YYYY-MM-DD"
          numberOfMonths={1}
          calendarPosition="bottom-left"
          className="rounded-xl shadow-md w-full bg-pinky-50 text-pinky-700 border-pinky-300 border transition-all duration-200"
          mapDays={({ date }) => {
            const iso = date?.toDate?.().toISOString().split("T")[0];
            if (blockedDates.includes(iso)) {
              return {
                disabled: true,
                style: {
                  backgroundColor: "#FAD1E8",
                  color: "#999",
                  textDecoration: "line-through",
                },
              };
            }
            return {};
          }}
        />
      </div>

      {Object.keys(timesByDate).length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-700">
            🕒 Choose a Time for Each Date
          </h3>
          <div className="space-y-4">
            {Object.entries(timesByDate).map(([date, time]) => (
              <div
                key={date}
                className="flex flex-col md:flex-row items-start md:items-center gap-3"
              >
                <span className="w-full md:w-1/3 font-medium text-gray-800">
                  {date}
                </span>
                <select
                  required
                  value={time}
                  onChange={(e) => handleTimeChange(date, e.target.value)}
                  className="select select-bordered w-full md:w-1/2"
                >
                  <option value="">-- Select Time --</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
