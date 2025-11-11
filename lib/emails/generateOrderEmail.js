// lib/emails/generateOrderEmail.js

export function generateOrderEmail({ order, items }) {
  const rows = items
    .map(
      (i) =>
        `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${i.title} × ${i.qty}</td>
      <td align="right" style="padding:6px 8px;border-bottom:1px solid #eee">
        ${((i.priceCents * i.qty) / 100).toLocaleString("en-US", { style: "currency", currency: order.currency || "USD" })}
      </td>
    </tr>`
    )
    .join("");

  const ship = order.addressJson ? JSON.parse(order.addressJson) : null;
  const shipBlock = ship
    ? `
    <p style="margin:0"><b>Ship to</b></p>
    <p style="margin:0">
      ${[
        ship.name,
        ship.line1,
        ship.line2,
        [ship.city, ship.state].filter(Boolean).join(" "),
        ship.postal_code,
        ship.country,
      ]
        .filter(Boolean)
        .join("<br/>")}
    </p>`
    : "";

  return `
    <div style="font-family:Inter,system-ui,Segoe UI,Arial,sans-serif">
      <h2 style="margin:0 0 8px">🐾 New Shop Order #${order.id.slice(0, 8)}</h2>
      <p style="margin:0 0 12px">
        <b>Name:</b> ${order.name || "—"}<br/>
        <b>Email:</b> ${order.email || "—"}<br/>
        <b>Phone:</b> ${order.phone || "—"}
      </p>
      ${shipBlock}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:collapse">${rows}</table>
      <p style="margin-top:14px;font-weight:600">Total:
        ${(order.totalCents / 100).toLocaleString("en-US", { style: "currency", currency: order.currency || "USD" })}
      </p>
      <p style="margin-top:16px">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/orders/${order.id}">
          View in dashboard
        </a>
      </p>
    </div>
  `;
}
