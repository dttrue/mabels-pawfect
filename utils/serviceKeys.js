// Map any overnight variant to the canonical key "overnight"
export function normalizeServiceKey(key = "") {
  const k = String(key).toLowerCase();
  if (k.includes("overnight")) return "overnight";
  return k;
}
