"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";


export default function ReviewForm() {
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    image: null,
    rating: 0,
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = "/images/default-avatar.png"; 
      if (formData.image) {
        const uploadData = new FormData();
        uploadData.append("file", formData.image);
        uploadData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_PRESET
        );

        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload`,
          uploadData
        );

        imageUrl = res.data.secure_url;
      }

      await axios.post("/api/reviews", {
        name: formData.name,
        message: formData.message,
        imageUrl,
        rating: formData.rating,
      });

      alert("Review submitted for approval!");

      setFormData({
        name: "",
        message: "",
        image: null,
        rating: 0,
      });
      setPreview(null);
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
     <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto"
    >
      <h2 className="text-xl font-semibold mb-4">Leave a Review</h2>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Message</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows="4"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring"
        ></textarea>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1 font-medium">
          Upload Avatar (Optional)
        </label>
        <label className="cursor-pointer bg-pink-100 hover:bg-pink-200 text-pink-800 font-semibold py-2 px-4 rounded inline-block transition">
          Choose Image
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </label>

        <div className="relative w-16 h-16 mt-2">
          <Image
            src={preview || "/images/default-avatar.png"}
            alt="Avatar Preview"
            fill
            className="rounded-full object-cover border border-gray-300 shadow"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Rating</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((paw) => (
            <button
              type="button"
              key={paw}
              aria-label={`Rate ${paw} paws`}
              onClick={() => setFormData({ ...formData, rating: paw })}
              className={`text-2xl p-1 rounded-full transition-colors duration-200 ${
                paw <= formData.rating ? "text-pink-500" : "text-gray-300"
              } hover:bg-pink-100`}
            >
              🐾
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md font-semibold"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
