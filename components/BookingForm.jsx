"use client";
import { useState } from "react";
import PetForm from "@/components/PetForm";
import { useRouter } from "next/navigation";
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
    service: "",
    date: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
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

    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      pets: form.pets,
      service: form.service,
      date: form.date,
      notes: form.notes,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/thank-you");
      } else {
        alert("Something went wrong. Please try again.");
      }

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
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
          date: "",
          notes: "",
        });
      } else {
        alert("Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 py-10 sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2 text-gray-900">
          <span role="img" aria-label="paw">
            🐾
          </span>
          Book a Service
        </h1>
        {/* ✅ Toast-style success alert */}
        {success && (
          <div
            className="flex items-center p-4 mb-4 text-green-800 rounded-lg bg-green-100 shadow"
            role="alert"
          >
            <svg
              className="w-5 h-5 mr-2 text-green-700"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4l5-5-1.414-1.414L9 11.172 7.414 9.586 6 11l3 3z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">
              Booking submitted successfully! We'll get back to you soon. 💌
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 🔹 Full Name */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 🔹 Phone */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 🔹 Email */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 🔹 Address */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 🔹 Service */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Service
            </label>
            <select
              name="service"
              value={form.service}
              onChange={handleChange}
              required
              className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a service</option>
              <option value="Dog Walking">Dog Walking</option>
              <option value="Cat Sitting">Cat Sitting</option>
              <option value="Overnight Stay">Overnight Stay</option>
              <option value="Drop-In">Drop-In</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* 🔹 Date & Time */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Preferred Date & Time
            </label>
            <input
              type="datetime-local"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 🔹 Additional Notes */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 🔹 Pet Info */}
          <h2 className="text-xl font-semibold mb-2">Pet Info</h2>

          {Array.isArray(form.pets) &&
            form.pets.map((pet, index) => (
              <div
                key={index}
                className="mb-6 border rounded-lg p-4 bg-gray-50 shadow-sm"
              >
                <PetForm
                  pet={pet}
                  index={index}
                  handlePetChange={handlePetChange}
                />
                <button
                  type="button"
                  onClick={() => handleRemovePet(index)}
                  className="text-red-600 text-sm underline mt-2 hover:text-red-800"
                >
                  Remove Pet
                </button>
              </div>
            ))}

          <button
            type="button"
            onClick={handleAddPet}
            className="bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200 focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium rounded-lg text-sm px-4 py-2 mb-4"
          >
            + Add Another Pet
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white bg-pink-500 hover:bg-pink-600 focus:ring-4 focus:ring-pink-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            {submitting ? "Submitting..." : "Submit Booking"}
          </button>
        </form>
      </div>
    </div>
  );

}
