// components/AboutSection.jsx
import PawIcon from "@/components/icons/PawIcon";


<PawIcon className="w-5 h-5 text-pink-500 inline-block ml-2" />;


export default function AboutSection() {
  return (
    <section className="py-16 bg-pink-50">
      <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
        {/* Left: Image */}
        <div className="w-full md:w-1/2">
          <img
            src="/images/about-me.jpg" // Make sure this is placed correctly
            alt="Owner with dog"
            className="rounded-xl shadow-lg w-full object-cover"
          />
        </div>

        {/* Right: Text */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Meet Bridget <span className="ml-1 text-pink-500">🐾</span>
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            Hi, I’m Bridget — the heart and hands behind Mabel’s Pawfect Pet
            Services. I’ve always believed that pets aren’t just animals —
            they’re family.
          </p>
          <p className="text-gray-600">
            Whether it's a quick walk or overnight care, I treat every pet with
            the same love, patience, and attention I give my own. 🐾
          </p>
        </div>
      </div>
    </section>
  );
}
