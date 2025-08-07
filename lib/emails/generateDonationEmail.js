// lib/emails/generateDonationEmail.js

export function generateDonationEmail({ customerName, donationAmount }) {
  return `
    <div style="font-family: sans-serif; color: #444;">
      <h2>🎉 Thank You for Donating!</h2>
      <p>Hi ${customerName || "there"},</p>
      <p>We're truly grateful for your generous donation of <strong>$${donationAmount}</strong> to help stray animals.</p>
      <p>Your kindness means the world to us — and to the paws you help protect. 🐾</p>
      <p>If you'd like to stay in touch, follow us on <a href="https://instagram.com/mabelspawfect">Instagram</a> or reply to this email!</p>
      <br />
      <p>With love,</p>
      <p>Bridget @ Mabel's Pawfect</p>
    </div>
  `;
}
