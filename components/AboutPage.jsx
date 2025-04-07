import Image from "next/image";


export default function AboutPage() {
  return (
    <section className="py-16 px-6 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          About Mabel’s Pawfect
        </h1>

        <img
          src="/images/about-me.jpg"
          alt="Bridget with Mabel"
          className="w-56 sm:w-64 h-auto mx-auto rounded-xl object-cover object-center border-4 border-pink-200 shadow-md mb-6"
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

        <a
          href="https://www.propethero.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <img
            alt="I got Cat and Dog First Aid and CPR certified at ProPetHero.com"
            src="https://www.propethero.com/images/sites/propethero/en/badge-6.png"
            className="mx-auto w-40 h-auto"
          />
        </a>
      </div>
    </section>
  );
}
