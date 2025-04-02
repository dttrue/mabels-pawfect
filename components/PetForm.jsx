"use client";
import React from "react";

export default function PetForm({ pet, index, handlePetChange }) {
 return (
   <div className="mt-6 space-y-4">
     {/* Pet Name */}
     <div>
       <label className="block text-sm font-medium text-gray-900 mb-1">
         Pet Name
       </label>
       <input
         type="text"
         name="name"
         value={pet.name || ""}
         onChange={(e) => handlePetChange(index, e)}
         placeholder="Bella"
         className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
       />
     </div>

     {/* DOB / Rescue Date */}
     <div>
       <label className="block text-sm font-medium text-gray-900 mb-1">
         DOB / Rescue Date
       </label>
       <input
         type="date"
         name="dob"
         value={pet.dob || ""}
         onChange={(e) => handlePetChange(index, e)}
         className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
       />
     </div>

     {/* Vaccinations */}
     <div>
       <label className="block text-sm font-medium text-gray-900 mb-1">
         Vaccinations
       </label>
       <textarea
         name="vaccinations"
         value={pet.vaccinations || ""}
         onChange={(e) => handlePetChange(index, e)}
         rows="2"
         placeholder="Rabies, Distemper..."
         className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
       />
     </div>

     {/* Medical Conditions */}
     <div>
       <label className="block text-sm font-medium text-gray-900 mb-1">
         Medical Conditions
       </label>
       <textarea
         name="medicalConditions"
         value={pet.medicalConditions || ""}
         onChange={(e) => handlePetChange(index, e)}
         rows="2"
         placeholder="Allergies, seizures..."
         className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
       />
     </div>

     {/* Vet Info */}
     <div>
       <label className="block text-sm font-medium text-gray-900 mb-1">
         Vet Info (Name & Address)
       </label>
       <textarea
         name="vetInfo"
         value={pet.vetInfo || ""}
         onChange={(e) => handlePetChange(index, e)}
         rows="2"
         placeholder="Dr. Smith, 123 Animal St..."
         className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
       />
     </div>

     {/* Feeding Schedule */}
     <div>
       <label className="block text-sm font-medium text-gray-900 mb-1">
         Feeding Schedule
       </label>
       <textarea
         name="feedingSchedule"
         value={pet.feedingSchedule || ""}
         onChange={(e) => handlePetChange(index, e)}
         rows="2"
         placeholder="Twice daily, 7am & 6pm"
         className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
       />
     </div>

     {/* Walk Schedule */}
     <div>
       <label className="block text-sm font-medium text-gray-900 mb-1">
         Walk/Let Out Schedule
       </label>
       <textarea
         name="walkSchedule"
         value={pet.walkSchedule || ""}
         onChange={(e) => handlePetChange(index, e)}
         rows="2"
         placeholder="Morning and evening walks"
         className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
       />
     </div>

     {/* Additional Notes */}
     <div>
       <label className="block text-sm font-medium text-gray-900 mb-1">
         Additional Notes
       </label>
       <textarea
         name="additionalNotes"
         value={pet.additionalNotes || ""}
         onChange={(e) => handlePetChange(index, e)}
         rows="2"
         placeholder="Anything else you'd like to share"
         className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
       />
     </div>
   </div>
 );

}
