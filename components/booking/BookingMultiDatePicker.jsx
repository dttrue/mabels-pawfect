// components/BookingMultiDatePicker.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import generateDefaultTimeSlots from "@/utils/generateDefaultTimeSlots";

export default function BookingMultiDatePicker({
  onChange,
  blockedDates = [], // ["2025-09-16", ...] — already normalized from API
  service = "",
}) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [timesByDate, setTimesByDate] = useState({});

  const timeSlots = generateDefaultTimeSlots(6, 23, 30); // 6:00 AM – 11:00 PM

  // Fast membership checks
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  // Local YYYY-MM-DD (no TZ drift)
  const ymd = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  };

  // Normalize the service label
  const normalizedService =
    typeof service === "object"
      ? service.label?.toLowerCase?.() || ""
      : service?.toLowerCase?.() || "";

  // ONE key path for both Dogs & Cats
  const isOvernight = normalizedService.includes("overnight");

  // Keep times dict in sync with selected dates
  useEffect(() => {
    const updated = { ...timesByDate };
    let changed = false;

    selectedDates.forEach((d) => {
      const key = ymd(d); // local
      if (!(key in updated)) {
        updated[key] = "";
        changed = true;
      }
    });

    if (changed) setTimesByDate(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDates]);

  // Emit up to parent when times change
  useEffect(() => {
    const entries = Object.entries(timesByDate).map(([date, time]) => {
      const matched = timeSlots.find((slot) => slot.value === time);
      return { date, time: matched?.label || "" };
    });
    onChange?.(entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timesByDate]);

  const handleTimeChange = (date, time) => {
    setTimesByDate((prev) => ({ ...prev, [date]: time }));
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
          onChange={(dates) => {
            // react-multi-date-picker gives DateObject; use .toDate() for JS Date
            const list = Array.isArray(dates) ? dates : [];
            const filtered = isOvernight
              ? list.filter((d) => !blockedSet.has(ymd(d?.toDate?.() ?? d)))
              : list;

            setSelectedDates(filtered);
          }}
          format="YYYY-MM-DD"
          numberOfMonths={2}
          calendarPosition="bottom-left"
          minDate={new Date()}
          maxDate={new Date(new Date().setMonth(new Date().getMonth() + 6))}
          className="rounded-xl shadow-md w-full bg-pinky-50 text-pinky-700 border-pinky-300 border transition-all duration-200"
          mapDays={({ date }) => {
            const iso = ymd(date?.toDate?.() ?? date);
            const disabled = isOvernight && blockedSet.has(iso);

            if (disabled) {
              return {
                disabled: true,
                style: {
                  color: "#bbb",
                  textDecoration: "line-through",
                  fontSize: "0.8rem",
                },
                content: (
                  <div className="flex flex-col items-center justify-center text-[10px] text-gray-500">
                    <span>{date.day}</span>
                    <span className="text-red-500">📛</span>
                  </div>
                ),
              };
            }
            return {};
          }}
        />

        <p className="text-sm mt-2 text-gray-600">
          <span className="inline-block mr-1">📛</span>Unavailable for overnight
          bookings
        </p>
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
