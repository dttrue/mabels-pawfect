// utils/formatDateTime.js
export function formatDateWithTime(dateStr, timeStr) {
   try {
     const [year, month, day] = dateStr.split("-");
     const [hourRaw, minuteRaw, ampm] = timeStr
       .replace(" ", "")
       .match(/(\d+):(\d+)(AM|PM)/i)
       .slice(1);

     let hour = parseInt(hourRaw, 10);
     const minute = parseInt(minuteRaw, 10);
     if (ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
     if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;

     const formatted = new Date(
       Number(year),
       Number(month) - 1,
       Number(day),
       hour,
       minute
     );

     return formatted.toLocaleString("en-US", {
       weekday: "short",
       month: "long",
       day: "numeric",
       year: "numeric",
       hour: "numeric",
       minute: "2-digit",
     });
   } catch (err) {
     return "Invalid Date";
   }
}
