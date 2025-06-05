// utils/generateDefaultTimeSlots.js

export default function generateDefaultTimeSlots(
  start = 6,
  end = 24,
  interval = 30
) {
  const slots = [];

  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += interval) {
      const date = new Date();
      date.setHours(h, m, 0, 0);

      const display = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const value = date.toTimeString().slice(0, 5); // e.g., "06:00"

      slots.push({ label: display, value });
    }
  }

  return slots;
}

