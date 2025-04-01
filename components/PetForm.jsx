"use client";
import React from "react";

export default function PetForm({ pet, index, handlePetChange }) {
  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Pet Name
      </label>
      <input
        type="text"
        name="name"
        value={pet.name || ""}
        onChange={(e) => handlePetChange(index, e)}
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        DOB / Rescue Date
      </label>
      <input
        type="date"
        name="dob"
        value={pet.dob || ""}
        onChange={(e) => handlePetChange(index, e)}
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Vaccinations
      </label>
      <textarea
        name="vaccinations"
        value={pet.vaccinations || ""}
        onChange={(e) => handlePetChange(index, e)}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Medical Conditions
      </label>
      <textarea
        name="medicalConditions"
        value={pet.medicalConditions || ""}
        onChange={(e) => handlePetChange(index, e)}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Vet Info (Name & Address)
      </label>
      <textarea
        name="vetInfo"
        value={pet.vetInfo || ""}
        onChange={(e) => handlePetChange(index, e)}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Feeding Schedule
      </label>
      <textarea
        name="feedingSchedule"
        value={pet.feedingSchedule || ""}
        onChange={(e) => handlePetChange(index, e)}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Walk/Let Out Schedule
      </label>
      <textarea
        name="walkSchedule"
        value={pet.walkSchedule || ""}
        onChange={(e) => handlePetChange(index, e)}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Additional Notes
      </label>
      <textarea
        name="additionalNotes"
        value={pet.additionalNotes || ""}
        onChange={(e) => handlePetChange(index, e)}
        rows="2"
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );
}
