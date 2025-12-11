// components/AboutPage.jsx
import Image from "next/image";
import { getSiteImage } from "@/lib/siteImages";

export default async function AboutPage() {
  // Fetch Cloudinary-hosted versions if uploaded
  const aboutImg = await getSiteImage("about-me");
  const badgeImg = await getSiteImage("badge-pet-cpr");

  const aboutSrc = aboutImg?.imageUrl || "/images/about-me.jpg";
  const aboutAlt = aboutImg?.alt || "Bridget with Mabel";

  const badgeSrc = badgeImg?.imageUrl || "/images/badge-6.png";
  const badgeAlt = badgeImg?.alt || "Pet First Aid & CPR Certified";

  return (
    <section className="py-16 px-6 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          About Mabel’s Pawfect
        </h1>

        {/* About photograph */}
        <Image
          src={aboutSrc}
          alt={aboutAlt}
          width={500}
          height={700}
          className="w-56 sm:w-64 h-auto mx-auto rounded-xl object-cover object-center border-4 border-pink-200 shadow-md mb-6"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 14rem, 16rem"
        />

        <p className="text-gray-700 mb-4 leading-relaxed">
          <strong>Hi, I’m Bridget!</strong> I’m a Professional Pet Sitter with a
          big heart and an even bigger love for animals. Since August 2023, I’ve
          been proudly caring for pets full-time — after gaining hands-on
          experience working at a dog daycare.
        </p>

        <p className="text-gray-700 mb-4 leading-relaxed">
          So far, I’ve had the pleasure of working with over{" "}
          <strong>150 amazing clients</strong> and completing more than{" "}
          <strong>500 bookings</strong>. I’m certified in{" "}
          <strong>Pet First Aid</strong> and fully covered with{" "}
          <strong>Pet Sitting Insurance</strong> — because when I’m watching
          your fur-babies, I treat their safety like it's my top priority.
        </p>

        <p className="text-gray-700 mb-6 leading-relaxed">
          Whether it’s belly rubs, playtime zoomies, or just being a cozy
          companion, I’m here to make your pets feel loved while you're away.
          It’s not just a job — it’s my joy. 🐾
        </p>

        {/* Badge with link */}
        <a
          href="https://www.pettech.net"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center"
        >
          <Image
            src={badgeSrc}
            alt={badgeAlt}
            width={200}
            height={200}
            className="mx-auto w-40 h-auto transition-transform hover:scale-105 cursor-pointer"
            loading="lazy"
          />

          <span className="text-xs text-gray-500 mt-1 block">
            Click to verify certification
          </span>
        </a>
      </div>
    </section>
  );
}
