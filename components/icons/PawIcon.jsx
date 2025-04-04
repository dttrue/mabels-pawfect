export default function PawIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="6" />
      <circle cx="48" cy="16" r="6" />
      <circle cx="20" cy="40" r="6" />
      <circle cx="44" cy="40" r="6" />
      <path d="M32 44c-7 0-14 4-14 10h28c0-6-7-10-14-10z" />
    </svg>
  );
}
