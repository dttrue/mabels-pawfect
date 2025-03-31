"use client";
import { useState } from "react";
import PetForm from "@/components/PetForm";

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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
       setForm({
         fullName: "",
         phone: "",
         address: "",
         petName: "",
         dob: "",
         vaccinations: "",
         medicalConditions: "",
         vetInfo: "",
         feedingSchedule: "",
         walkSchedule: "",
         petNotes: "",
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
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🐾 Book a Service</h1>

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
          Booking submitted successfully! We'll get back to you soon. 💌
        </div>
      )}

      {/* Form section */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-medium mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Contact Info */}
        <div>
          <label className="block font-medium mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

       {/* Email Info */}
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Address Info */}
        <div>
          <label className="block font-medium mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Pet Info Section */}
        <PetForm form={form} handleChange={handleChange} />

        {/* Service Info */}
        <div>
          <label className="block font-medium mb-1">Service</label>
          <select
            name="service"
            value={form.service}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          >
            <option value="">Select a service</option>
            <option value="Dog Walking">Dog Walking</option>
            <option value="Cat Sitting">Cat Sitting</option>
            <option value="Overnight Stay">Overnight Stay</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">
            Preferred Date & Time
          </label>
          <input
            type="datetime-local"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block font-medium mb-1">Additional Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows="3"
            className="w-full border rounded p-2"
          />
        </div>

        {/* Submit Button */}
        <h2 className="text-xl font-semibold mb-2">Pet Info</h2>
        {form.pets.map((pet, index) => (
          <div key={index} className="mb-6 border rounded p-4 bg-gray-50">
            <PetForm
              form={pet}
              handleChange={(e) => handlePetChange(index, e)}
            />
            <button
              type="button"
              onClick={() => handleRemovePet(index)}
              className="text-red-600 underline mt-2"
            >
              Remove Pet
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddPet}
          className="bg-gray-200 text-gray-800 py-1 px-3 rounded mb-4"
        >
          + Add Another Pet
        </button>
      </form>
    </div>
  );
}
