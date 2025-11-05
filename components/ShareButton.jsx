"use client";

export default function ShareButton({
  url,
  title = "Halloween 2025 Winner – Petey the Postman",
  className = "",
}) {
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert("Link copied!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      onClick={share}
      className={
        className ||
        "inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-white/5"
      }
    >
      Share
    </button>
  );
}
