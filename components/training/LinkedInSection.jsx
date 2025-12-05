// components/training/LinkedInSection.jsx

export default function LinkedInSection() {
  return (
    <details className="group bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <summary className="flex items-center justify-between cursor-pointer text-sm md:text-base">
        <span className="font-semibold text-gray-900">
          Verify my experience on LinkedIn
        </span>
        <span className="ml-3 text-gray-500 group-open:hidden">+</span>
        <span className="ml-3 text-gray-500 hidden group-open:inline">−</span>
      </summary>

      <div className="mt-3 space-y-3 text-sm text-gray-700">
        <p>
          Prefer to see everything on an official profile? You can view my full
          work history, certifications, and skills on LinkedIn.
        </p>

        <a
          href="https://www.linkedin.com/in/bridget-quinones-9ab17b286/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0a66c2] text-white font-semibold shadow hover:bg-[#004182] transition"
        >
          {/* LinkedIn “in” badge */}
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-white text-[#0a66c2] font-bold text-xs">
            in
          </span>
          <span>View LinkedIn Profile</span>
        </a>
      </div>
    </details>
  );
}
