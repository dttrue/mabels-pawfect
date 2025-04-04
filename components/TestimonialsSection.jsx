"use client";
import { motion } from "framer-motion";
import testimonials from "@/lib/testimonialsData";

export default function TestimonialsSection() {
  return (
    <section className="bg-pinky-50 py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">
          What Our Clients Say
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow duration-200"
            >
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {testimonial.name}
                </h3>
                <p className="text-sm text-gray-500">{testimonial.date}</p>
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                  {testimonial.verified}
                </span>
              </div>
              <blockquote className="italic text-gray-700 text-sm leading-relaxed mt-3 border-l-4 border-pink-200 pl-4">
                “{testimonial.message}”
              </blockquote>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
