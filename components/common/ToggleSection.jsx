// components/common/ToggleSection.jsx
"use client";
import { useState } from "react";

export default function ToggleSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-md p-4 bg-base-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-lg">{title}</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-sm btn-outline"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
}
