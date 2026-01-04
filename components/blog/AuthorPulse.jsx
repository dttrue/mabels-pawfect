// components/blog/AuthorPulse.jsx

export default function AuthorPulse({ author }) {
  if (!author) return null;

  const AUTHOR_COLORS = {
    "Bridget Quinones": "bg-pink-400",
    "Daniel Torres": "bg-indigo-400",
  };

  const pulseColor = AUTHOR_COLORS[author] ?? "bg-gray-400";

  return (
    <span
      aria-hidden
      className={`h-1 w-1 rounded-full animate-pulse ${pulseColor}`}
    />
  );
}
