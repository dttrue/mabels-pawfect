// app/training-and-credentials/page.jsx
import Image from "next/image";
import LinkedInSection from "@/components/training/LinkedInSection";

export const metadata = {
  title: "Training & Credentials | Mabel's Pawfect Pet Services",
  description:
    "Bridget's professional pet care experience, training background, and certifications.",
};

export default function TrainingAndCredentialsPage() {
  return (
    <section className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        {/* HERO WITH PORTRAIT */}
        <div className="text-center space-y-3 mb-8">
          <p className="text-sm font-medium text-rose-600 tracking-wide">
            Bridget Quinones · Owner &amp; Certified Pet Sitter
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Professional Training &amp; Real-World Experience
          </h1>

          <p className="max-w-xl mx-auto text-gray-700 leading-relaxed">
            When you trust someone with your pet, you’re trusting them with a
            family member. Bridget brings certified training, hands-on
            experience, and emergency readiness to every visit.
          </p>
        </div>

        {/* TRUST SNAPSHOT */}
        <div className="grid md:grid-cols-2 gap-6">
          <TrustCard
            title="2+ years as a professional pet sitter"
            text="Providing overnight care, drop-ins, and dog walking through Rover.com."
          />
          <TrustCard
            title="Business owner of Mabel's Pawfect Pet Services"
            text="Dedicated to personalized, in-home pet care for NJ families."
          />
          <TrustCard
            title="Assistant Manager at a luxury pet hotel"
            text="Former K9 Resorts staff — supervised daycare groups and specialized care."
          />
          <TrustCard
            title="Certified in behaviour & pet first aid"
            text="Animal Behaviour, Chicken Behaviour, Pet First Aid & CPR."
          />
        </div>

        {/* EXPERIENCE */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Professional Experience
          </h2>

          <ExperienceCard
            icon="💼"
            role="Pet Sitter"
            company="Rover.com"
            dates="Aug 2023 – Present"
            bullets={[
              "Overnight sitting, drop-ins, and walks.",
              "Experience with puppies, seniors, anxious & rescue dogs.",
              "Reliable communication and detailed updates.",
            ]}
          />

          <ExperienceCard
            icon="🐾"
            role="Pet Sitter / Business Owner"
            company="Mabel's Pawfect Pet Services"
            dates="Jul 2023 – Present"
            bullets={[
              "Personalized care plans for each household.",
              "Feeding, enrichment, medication (as directed).",
              "High-trust relationships with returning clients.",
            ]}
          />

          <ExperienceCard
            icon="🏨"
            role="Assistant Manager"
            company="K9 Resorts Luxury Pet Hotel"
            dates="Dec 2022 – Jul 2023"
            bullets={[
              "Supervised daycare & boarding groups.",
              "Monitored canine body language & safe interactions.",
              "Handled special diets, medications, and parent communication.",
            ]}
          />
        </div>

        {/* CERTIFICATIONS */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Certifications
          </h2>

          <CertificationCard
            icon="🎓"
            title="Animal Behaviour & Welfare"
            org="University of Edinburgh"
            issued="Issued May 2025"
          />

          <CertificationCard
            icon="🐔"
            title="Chicken Behaviour & Welfare"
            org="Coursera"
            issued="Issued May 2025"
          />

          <CertificationCard
            icon="⛑️"
            title="Pet First Aid & CPR"
            org="ProTrainings"
            issued="Issued Mar 2025 • Expires Mar 2027"
          />
        </div>

        {/* LINKEDIN COLLAPSIBLE SECTION (FLOWBITE ACCORDION) */}
        <LinkedInSection />

        {/* CTA */}
        <div className="text-center space-y-4 pt-8 pb-12">
          <p className="text-gray-700">
            Want to learn more or schedule a meet &amp; greet?
          </p>

          <div className="flex justify-center">
            <a
              href="/reviews"
              className="px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-black transition"
            >
              See Reviews
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- COMPONENTS (SERVER SAFE) ---------- */

function TrustCard({ title, text }) {
  return (
    <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm flex gap-3">
      <div className="mt-1">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-lg">
          ★
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-700 mt-1">{text}</p>
      </div>
    </div>
  );
}

function ExperienceCard({ icon, role, company, dates, bullets }) {
  return (
    <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm flex gap-4">
      <div className="mt-1">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 text-xl">
          {icon}
        </span>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{role}</h3>
        <p className="text-sm text-gray-700">{company}</p>
        <p className="text-xs text-gray-500 mb-3">{dates}</p>
        <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CertificationCard({ icon, title, org, issued }) {
  return (
    <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm flex gap-4">
      <div className="mt-1">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-xl">
          {icon}
        </span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-700">{org}</p>
        <p className="text-xs text-gray-500 mt-1">{issued}</p>
      </div>
    </div>
  );
}
