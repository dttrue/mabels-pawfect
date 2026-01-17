// app/admin/clients/[id]/page.js
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClientPaymentsEditor from "@/components/dashboard/ClientPaymentsEditor";

function money(cents = 0) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n / 100);
}

function toCents(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function bestDateMs(a) {
  const d = a.startAt || a.endAt || a.updatedAt || a.createdAt;
  const ms = d ? new Date(d).getTime() : 0;
  return Number.isFinite(ms) ? ms : 0;
}

function formatVisitDate(a) {
  try {
    const d = a.startAt || a.endAt || a.updatedAt || a.createdAt;
    return d ? new Date(d).toLocaleDateString() : "No date";
  } catch {
    return "No date";
  }
}

const PAYMENT_LABELS = {
  cash: "Cash",
  zelle: "Zelle",
  venmo: "Venmo",
  stripe: "Card / Stripe",
  other: "Other",
};

function getAppointmentAmountAndMethod(a) {
  const payments = a.payments || [];

  const fromPayments = payments.reduce(
    (sum, p) => sum + toCents(p.amountCents),
    0
  );

  const fallback = toCents(a.priceCents);
  const amountCents = fromPayments > 0 ? fromPayments : fallback;

  // method can live on Payment rows OR on Appointment (paymentType)
  const methodFromPayment = payments[0]?.method || null;
  const methodFromAppt = a.paymentType
    ? String(a.paymentType).toLowerCase()
    : null;

  const method = methodFromPayment || methodFromAppt;

  return { amountCents, method };
}

export default async function ClientDetailPage({ params }) {
  const id = params?.id;
  if (!id) notFound();

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      pets: {
        where: { deletedAt: null },
      },
      appointments: {
        where: { deletedAt: null },
        include: {
          payments: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!client) notFound();

  const pets = (client.pets || []).slice().sort((a, b) => {
    const ams = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bms = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ams - bms;
  });

  const appointments = (client.appointments || [])
    .slice()
    .sort((a, b) => bestDateMs(b) - bestDateMs(a));

  // Totals
  const allPayments = appointments.flatMap((a) => a.payments || []);
  const totalPaidCents =
    allPayments.reduce((sum, p) => sum + toCents(p.amountCents), 0) ||
    appointments.reduce((sum, a) => sum + toCents(a.priceCents), 0);

  const lastVisit = appointments.length
    ? formatVisitDate(appointments[0])
    : "No visits yet";

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold">{client.fullName}</h1>

      <p className="mt-1 text-sm text-gray-600">
        {client.email || "No email"} • {client.phone || "No phone"}
      </p>

      {client.address ? (
        <p className="mt-1 text-sm text-gray-600">{client.address}</p>
      ) : null}

      {client.notes ? (
        <p className="mt-2 text-sm text-gray-500 whitespace-pre-line">
          {client.notes}
        </p>
      ) : null}

      {/* Summary */}
      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">Pets</div>
          <div className="mt-1 text-lg font-semibold">{pets.length}</div>
        </div>

        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">Bookings</div>
          <div className="mt-1 text-lg font-semibold">
            {appointments.length}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">Total spent</div>
          <div className="mt-1 text-lg font-semibold">
            {money(totalPaidCents)}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">Last visit</div>
          <div className="mt-1 text-lg font-semibold">{lastVisit}</div>
        </div>
      </section>

      {/* Pets */}
      <section className="mt-8">
        <h2 className="mb-2 text-base font-semibold">Pets</h2>

        {pets.length === 0 ? (
          <p className="text-sm text-gray-500">No pets on file.</p>
        ) : (
          <ul className="space-y-2">
            {pets.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-gray-600">
                  {p.species || "Unknown species"}
                  {p.breed ? ` • ${p.breed}` : ""}
                  {p.age != null ? ` • ${p.age} yrs` : ""}
                </div>
                {p.notes ? (
                  <div className="mt-1 text-xs text-gray-500 whitespace-pre-line">
                    {p.notes}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Appointments + Payments */}
      <section className="mt-8">
        <h2 className="mb-2 text-base font-semibold">Appointments</h2>

        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments yet.</p>
        ) : (
          <ul className="space-y-3">
            {appointments.map((a) => {
              const { amountCents, method } = getAppointmentAmountAndMethod(a);
              const methodLabel = method
                ? PAYMENT_LABELS[method] || method
                : null;

              return (
                <li
                  key={a.id}
                  className="rounded-lg border bg-white p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{a.service}</div>
                      <div className="text-xs text-gray-500">
                        {formatVisitDate(a)}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        a.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : a.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {a.status || "pending"}
                    </span>
                  </div>

                  {/* High-level payment summary */}
                  <div className="mt-2 text-gray-700">
                    {amountCents > 0 ? (
                      methodLabel ? (
                        <>
                          Paid {money(amountCents)} · {methodLabel}
                        </>
                      ) : (
                        <>Recorded amount: {money(amountCents)}</>
                      )
                    ) : (
                      <span className="text-gray-400">
                        No payment recorded yet
                      </span>
                    )}
                  </div>

                  {/* Detailed payments editor (manual add/edit/delete) */}
                  <div className="mt-3">
                    <ClientPaymentsEditor appointments={[a]} />
                  </div>

                  {a.notes ? (
                    <div className="mt-2 text-xs text-gray-500 whitespace-pre-line">
                      {a.notes}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
