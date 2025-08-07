// lib/emails/generateBookingRequestEmail.js

import { formatDateWithTime } from "@/utils/formatDateTime";

export function generateBookingRequestEmail({
  fullName,
  phone,
  address,
  service,
  entries = [],
  pets = [],
  notes,
  acceptUrl,
  declineUrl,
}) {
  const formattedDates = entries
    .map((entry) => {
      const formatted =
        entry?.date && entry?.time
          ? formatDateWithTime(entry.date, entry.time)
          : "Invalid Date";
      return `<li>${formatted}</li>`;
    })
    .join("");

  const petInfoList = pets
    .map(
      (p) => `
        <li>
          <strong>${p.name}</strong> (${p.dob || "DOB not provided"})<br/>
          Vaccinations: ${p.vaccinations || "N/A"}<br/>
          Medical: ${p.medicalConditions || "N/A"}<br/>
          Feeding: ${p.feedingSchedule || "N/A"}<br/>
          Walks: ${p.walkSchedule || "N/A"}<br/>
          Vet: ${p.vetInfo || "N/A"}<br/>
          Notes: ${p.additionalNotes || "None"}
        </li><br/>`
    )
    .join("");

  return `
    <h2>🐾 New Booking Request</h2>
    <p><strong>Name:</strong> ${fullName}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Service:</strong> ${service}</p>
    <p><strong>Dates Requested:</strong></p>
    <ul>${formattedDates}</ul>
    <p><strong>Address:</strong> ${address}</p>
    <p><strong>Notes:</strong> ${notes || "None"}</p>
    <ul>${petInfoList}</ul>
    <hr/>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td bgcolor="#28a745" style="border-radius:5px;">
          <a href="${acceptUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-family:sans-serif;font-size:16px;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:5px;">
            ✅ Accept Booking
          </a>
        </td>
      </tr>
    </table>
    <br/>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td bgcolor="#dc3545" style="border-radius:5px;">
          <a href="${declineUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-family:sans-serif;font-size:16px;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:5px;">
            ❌ Decline Booking
          </a>
        </td>
      </tr>
    </table>
  `;
}
