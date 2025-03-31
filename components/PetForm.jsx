"use client";
import React from "react";

export default function PetForm({ form, handleChange }) {
  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Pet Name
      </label>
      <input
        type="text"
        name="petName"
        value={form.petName}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        DOB / Rescue Date
      </label>
      <input
        type="date"
        name="dob"
        value={form.dob}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Vaccinations
      </label>
      <textarea
        name="vaccinations"
        value={form.vaccinations}
        onChange={handleChange}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Medical Conditions
      </label>
      <textarea
        name="medicalConditions"
        value={form.medicalConditions}
        onChange={handleChange}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Vet Info (Name & Address)
      </label>
      <textarea
        name="vetInfo"
        value={form.vetInfo}
        onChange={handleChange}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Feeding Schedule
      </label>
      <textarea
        name="feedingSchedule"
        value={form.feedingSchedule}
        onChange={handleChange}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Walk/Let Out Schedule
      </label>
      <textarea
        name="walkSchedule"
        value={form.walkSchedule}
        onChange={handleChange}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Additional Notes
      </label>
      <textarea
        name="petNotes"
        value={form.petNotes}
        onChange={handleChange}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );
}
