// components/blog/AuthorPulse.jsx
export default function AuthorPulse({ authorName }) {
  if (!authorName) return null;

  const AUTHOR_COLORS = {
    "Bridget Quinones": "bg-pink-400",
    "Daniel Torres": "bg-blue-500",
  };

  const pulseColor = AUTHOR_COLORS[authorName] ?? "bg-gray-400";

  return (
    <span
      aria-hidden
      className={`inline-block h-1.5 w-1.5 rounded-full animate-pulse ${pulseColor}`}
    />
  );
}
