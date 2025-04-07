import Link from "next/link";
import servicesData from "@/lib/servicesData";

export default function ServicesPage() {
  return (
    <section className="py-16 px-6 bg-pinky-50 min-h-screen">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Our Services</h1>
        <p className="text-gray-600 mb-12">
          We provide loving, dependable care for your pets—whether you're home
          or away.
        </p>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          {servicesData.map((service) => (
            <div
              key={service.title}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                {service.icon} {service.title}
              </h3>
              <p className="text-gray-700">{service.description}</p>
            </div>
          ))}
        </div>

        {/* Book Now CTA */}
        <div className="mt-12">
          <Link href="/booking">
            <button className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow transition">
              Book Now
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
