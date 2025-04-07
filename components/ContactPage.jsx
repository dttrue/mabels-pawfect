"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to send message.");
      setStatus("Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="py-16 px-6 bg-pinky-50 min-h-screen">
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Get in Touch</h1>
        <p className="text-gray-600 mb-8">
          Questions, booking inquiries, or just want to say hi? We’d love to
          hear from you!
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md space-y-4 text-left"
        >
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <button
            type="submit"
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md font-semibold"
          >
            Send Message
          </button>

          {status && <p className="text-sm text-gray-500 mt-2">{status}</p>}
        </form>
      </div>
    </section>
  );
}
