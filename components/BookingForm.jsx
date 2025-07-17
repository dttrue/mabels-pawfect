// components/BookingForm.jsx
"use client";
import toast from "react-hot-toast";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PetForm from "@/components/PetForm";
import BookingMultiDatePicker from "@/components/booking/BookingMultiDatePicker";
import { serviceOptions } from "@/lib/servicesData";
import BookingIntroModal from "@/components/modals/BookingIntroModal";


export default function BookingForm() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    pets: [
      {
        name: "",
        dob: "",
        vaccinations: "",
        medicalConditions: "",
        vetInfo: "",
        feedingSchedule: "",
        walkSchedule: "",
        additionalNotes: "",
      },
    ],
    entries: [],
    service: "",
    notes: "",
  });

  const [blockedDates, setBlockedDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showIntroModal, setShowIntroModal] = useState(false);
  const router = useRouter();
  const [formLoaded, setFormLoaded] = useState(false);
  const [bookingRestored, setBookingRestored] = useState(false);

  const isFormActuallyEmpty =
    bookingRestored &&
    !form.fullName &&
    !form.email &&
    !form.phone &&
    !form.address &&
    !form.service &&
    !form.notes &&
    (!form.entries || form.entries.length === 0) &&
    form.pets.length === 1 &&
    Object.values(form.pets[0]).every((val) => val === "");


  // Load all blocked overnights
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const res = await fetch("/api/blocked-dates?service=overnight");
        const data = await res.json();
        setBlockedDates(data); // e.g. ["2025-06-29", "2025-06-30"]
      } catch (err) {
        console.error("❌ Failed to fetch blocked dates:", err);
      }
    };

    fetchBlockedDates();
  }, []);


  // Load from localStorage on first render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bookingInfo");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setForm((prev) => ({
            ...prev,
            ...parsed,
            pets: parsed.pets || prev.pets,
            entries: parsed.entries || [],
          }));
        } catch (err) {
          console.warn("⚠️ Failed to load saved booking data:", err);
          localStorage.removeItem("bookingInfo");
        }
      }
      setBookingRestored(true);
      setFormLoaded(true);
    }
  }, []);

  // Save to localStorage when form updates
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("bookingInfo", JSON.stringify(form));
    }, 300);
    return () => clearTimeout(timeout);
  }, [form]);

  // Show intro modal if form is empty and user hasn't dismissed it
  useEffect(() => {
    if (formLoaded && bookingRestored && typeof window !== "undefined") {
      const hideIntro = localStorage.getItem("hideBookingIntro") === "true";
      if (!hideIntro && isFormActuallyEmpty) {
        setShowIntroModal(true);
      }
    }
  }, [formLoaded, bookingRestored, isFormActuallyEmpty]);




  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePetChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPets = [...form.pets];
    updatedPets[index][name] = value;
    setForm((prev) => ({ ...prev, pets: updatedPets }));
  };

  const handleAddPet = () => {
    setForm((prev) => ({
      ...prev,
      pets: [
        ...prev.pets,
        {
          name: "",
          dob: "",
          vaccinations: "",
          medicalConditions: "",
          vetInfo: "",
          feedingSchedule: "",
          walkSchedule: "",
          additionalNotes: "",
        },
      ],
    }));
  };

  const handleRemovePet = (index) => {
    const updatedPets = form.pets.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, pets: updatedPets }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!form.entries || form.entries.length === 0) {
      setErrorMessage("Please select at least one date and time.");
      setSubmitting(false);
      return;
    }

    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      pets: form.pets,
      service: form.service,
      notes: form.notes,
      entries: form.entries,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        setErrorMessage("");
        setTimeout(() => setSuccess(false), 5000);
        localStorage.removeItem("bookingInfo");
        setForm({
          fullName: "",
          phone: "",
          email: "",
          address: "",
          pets: [
            {
              name: "",
              dob: "",
              vaccinations: "",
              medicalConditions: "",
              vetInfo: "",
              feedingSchedule: "",
              walkSchedule: "",
              additionalNotes: "",
            },
          ],
          service: "",
          notes: "",
          entries: [],
        });
        setSelectedDay(null);
        setAvailableSlots([]);
        router.push("/thank-you");
      } else {
        const data = await res.json();
        if (
          data?.error?.includes(
            "Overnight bookings are unavailable from June 27"
          )
        ) {
          toast.error("🚫 Overnight stays are unavailable June 27 – Aug 2.");
        } else {
          toast.error(
            `⚠️ ${data.error || "Something went wrong. Please try again."}`
          );
        }
        setErrorMessage(
          data.error || "Something went wrong. Please try again."
        );
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showIntroModal && (
        <BookingIntroModal onClose={() => setShowIntroModal(false)} />
      )}
      <div className="w-full px-4 py-10 max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            🐾 Book a Service
          </h1>

          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md mb-6 text-sm">
            🔒 <strong>Important:</strong> Overnight bookings are{" "}
            <span className="font-semibold">
              unavailable from June 27 through August 2
            </span>
            . You can still book Drop-In Visits and Dog Walks during this time.
          </div>

          {success && (
            <div className="p-4 text-green-800 bg-green-100 rounded-lg shadow">
              Booking submitted successfully! We'll get back to you soon. 💌
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name, Contact, Address */}
            {["fullName", "phone", "email", "address"].map((field) => (
              <div key={field}>
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  {field === "fullName"
                    ? "Full Name"
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                />
              </div>
            ))}

            {/* Service */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Service
              </label>
              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                required
                className="select select-bordered w-full"
              >
                <option value="">Select a service</option>
                {serviceOptions.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Info */}
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded text-sm">
              Booking hours are limited to 6:00 AM – 11:00 PM. Choose a time
              within this window.
              <br />
              <a
                href="/contact"
                className="underline text-pink-600 font-medium"
              >
                Contact us
              </a>{" "}
              for special requests.
            </div>

            {/* 📅 Date Selector */}
            <BookingMultiDatePicker
              onChange={(entries) => {
                setForm((prev) => ({
                  ...prev,
                  entries, // [{ date: "2025-06-15", time: "10:00" }]
                }));
              }}
              blockedDates={blockedDates}
              service={form.service}
            />

            {/* Notes */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="3"
                className="textarea textarea-bordered w-full"
              />
            </div>

            {/* 🐶 Pet Info */}
            <h2 className="text-xl font-semibold mb-2">Pet Info</h2>
            {form.pets.map((pet, index) => (
              <div
                key={index}
                className="mb-6 border rounded-lg p-4 bg-gray-50 shadow-sm"
              >
                <PetForm
                  pet={pet}
                  index={index}
                  handlePetChange={handlePetChange}
                />
                {form.pets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePet(index)}
                    className="text-red-600 text-sm underline mt-2 hover:text-red-800"
                  >
                    Remove Pet
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddPet}
              className="btn btn-outline btn-sm"
            >
              + Add Another Pet
            </button>

            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full h-12 text-base"
              >
                📩 Submit Booking
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("bookingInfo");
                  setForm({
                    fullName: "",
                    phone: "",
                    email: "",
                    address: "",
                    pets: [
                      {
                        name: "",
                        dob: "",
                        vaccinations: "",
                        medicalConditions: "",
                        vetInfo: "",
                        feedingSchedule: "",
                        walkSchedule: "",
                        additionalNotes: "",
                      },
                    ],
                    entries: [],
                    service: "",
                    notes: "",
                  });
                  toast.success("Saved booking info cleared.");
                }}
                className="btn btn-outline w-full h-12 text-base"
              >
                🧹 Clear Saved Info
              </button>
            </div>

            {errorMessage && (
              <div className="p-4 text-sm text-red-800 bg-red-100 rounded-lg shadow-md">
                <p>{errorMessage}</p>
                <p className="mt-1">
                  If the issue persists, please{" "}
                  <a
                    href="mailto:Therainbowniche@gmail.com"
                    className="text-pink-600 underline hover:text-pink-700"
                  >
                    contact us
                  </a>
                  .
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

