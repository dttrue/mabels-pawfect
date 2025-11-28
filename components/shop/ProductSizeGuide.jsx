// components/shop/ProductSizeGuide.jsx

/**
 * ProductSizeGuide
 *
 * Expects a `product` object with (all optional):
 * - weightOz, weightGrams
 * - lengthIn, widthIn, heightIn
 * - lengthCm, widthCm, heightCm
 * - forDogs, forCats
 * - recommendedSmall, recommendedMedium, recommendedLarge (Boolean?)
 */

function formatNumber(n, digits = 1) {
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  const s = n.toFixed(digits);
  // strip trailing .0 / .00 etc
  return s.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

export default function ProductSizeGuide({ product }) {
  if (!product) return null;

  const {
    weightOz,
    weightGrams,
    lengthIn,
    widthIn,
    heightIn,
    lengthCm,
    widthCm,
    heightCm,
    // NEW
    forDogs,
    forCats,
    categories,
    // size hints
    recommendedSmall,
    recommendedMedium,
    recommendedLarge,
  } = product;

  const hasSpecs =
    weightOz ||
    weightGrams ||
    lengthIn ||
    widthIn ||
    heightIn ||
    lengthCm ||
    widthCm ||
    heightCm;

  if (!hasSpecs) return null;

  // Infer dog/cat from flags or categories
  const catFromCategories = Array.isArray(categories)
    ? categories.some(
        (c) =>
          c.slug === "cat" ||
          c.slug === "cats" ||
          c.name?.toLowerCase().includes("cat")
      )
    : false;

  const dogFromCategories = Array.isArray(categories)
    ? categories.some(
        (c) =>
          c.slug === "dog" ||
          c.slug === "dogs" ||
          c.name?.toLowerCase().includes("dog")
      )
    : false;

  const isDogToy = forDogs ?? dogFromCategories ?? true;
  const isCatToy =
    typeof forCats === "boolean" ? forCats : catFromCategories || false;

  // Pick a "primary" length for comparisons
  const primaryLengthIn =
    typeof lengthIn === "number"
      ? lengthIn
      : typeof widthIn === "number"
        ? widthIn
        : typeof heightIn === "number"
          ? heightIn
          : null;

  const primaryLengthCm =
    typeof lengthCm === "number"
      ? lengthCm
      : typeof widthCm === "number"
        ? widthCm
        : typeof heightCm === "number"
          ? heightCm
          : null;

  // Auto dog-size category if explicit flags are not provided
  const hasExplicitDogSizes =
    typeof recommendedSmall === "boolean" ||
    typeof recommendedMedium === "boolean" ||
    typeof recommendedLarge === "boolean";

  let autoSizeCategory = null;
  if (!hasExplicitDogSizes && typeof primaryLengthIn === "number") {
    if (primaryLengthIn <= 6) autoSizeCategory = "Small";
    else if (primaryLengthIn <= 10) autoSizeCategory = "Medium";
    else autoSizeCategory = "Large";
  }

  const sizeBadges = [
    {
      key: "small",
      label: "Small dogs (up to ~25 lb)",
      active: hasExplicitDogSizes
        ? !!recommendedSmall
        : autoSizeCategory === "Small",
    },
    {
      key: "medium",
      label: "Medium dogs (~25–55 lb)",
      active: hasExplicitDogSizes
        ? !!recommendedMedium
        : autoSizeCategory === "Medium",
    },
    {
      key: "large",
      label: "Large dogs (55+ lb)",
      active: hasExplicitDogSizes
        ? !!recommendedLarge
        : autoSizeCategory === "Large",
    },
  ];

  // Simple "object comparison" text based on primary length
  let comparisonText = null;
  if (typeof primaryLengthIn === "number") {
    if (primaryLengthIn < 4) {
      comparisonText =
        "Roughly the size of a tennis ball or small squeaky toy.";
    } else if (primaryLengthIn <= 7) {
      comparisonText =
        "About the length of a standard smartphone or TV remote.";
    } else if (primaryLengthIn <= 12) {
      comparisonText = "Similar in length to a small loaf of bread or forearm.";
    } else {
      comparisonText =
        "Longer enrichment toy, closer to a large plush or tug toy.";
    }
  }

  return (
    <section className="mt-6 border-t pt-4 text-sm text-gray-700">
      <h3 className="font-semibold mb-3">Size &amp; Fit Guide</h3>

      {/* Species chips */}
      <div className="mb-3 flex flex-wrap gap-2 items-center">
        <span className="font-medium mr-1">For:</span>
        {isDogToy && (
          <span className="badge badge-sm badge-outline flex items-center gap-1">
            🐶 Dogs
          </span>
        )}
        {isCatToy && (
          <span className="badge badge-sm badge-outline flex items-center gap-1">
            🐱 Cats
          </span>
        )}
        
      </div>

      {/* Dog size badges (only if it's a dog toy) */}
      {isDogToy && (autoSizeCategory || hasExplicitDogSizes) && (
        <div className="mb-4">
          <p className="font-medium mb-1">Best for:</p>
          <div className="flex flex-wrap gap-2">
            {sizeBadges.map((badge) => (
              <span
                key={badge.key}
                className={
                  "badge badge-sm border rounded-full px-3 py-1 text-xs " +
                  (badge.active
                    ? "badge-primary text-primary-content"
                    : "badge-ghost text-gray-500")
                }
              >
                {badge.active ? "✅ " : "⚪️ "}
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cat note */}
      {isCatToy && (
        <div className="mb-3 text-xs text-gray-600">
          Great for most adult cats
          {primaryLengthIn && (
            <>
              {" "}
              — easy to bat, chase, and pounce at around{" "}
              {formatNumber(primaryLengthIn)}&quot; long.
            </>
          )}
        </div>
      )}

      {/* Quick visual sense of size */}
      {primaryLengthIn && (
        <div className="mb-4 bg-base-100/60 rounded-lg p-3">
          <p className="font-medium mb-1">Size at a glance</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              Approx. length{" "}
              <span className="font-semibold">
                {formatNumber(primaryLengthIn)} in
              </span>
              {primaryLengthCm && (
                <>
                  {" "}
                  (
                  <span className="font-semibold">
                    {formatNumber(primaryLengthCm)} cm
                  </span>
                  )
                </>
              )}
            </li>
            {comparisonText && <li>{comparisonText}</li>}
            {isDogToy && (
              <li>Great for giving your dog a clear “mouthful” target.</li>
            )}
          </ul>
        </div>
      )}

      {/* Detailed specs */}
      <div className="grid gap-3 sm:grid-cols-2 mt-2">
        {(weightOz || weightGrams) && (
          <div>
            <p className="font-medium mb-1">Weight</p>
            <p>
              {weightOz && (
                <>
                  {formatNumber(weightOz, 1)} oz
                  {weightGrams && " "}
                </>
              )}
              {weightGrams && (
                <span className="text-gray-600">
                  ({formatNumber(weightGrams, 2)} g)
                </span>
              )}
            </p>
          </div>
        )}

        {(lengthIn ||
          widthIn ||
          heightIn ||
          lengthCm ||
          widthCm ||
          heightCm) && (
          <div>
            <p className="font-medium mb-1">Dimensions</p>
            {lengthIn && widthIn && heightIn && (
              <p>
                {formatNumber(lengthIn)} × {formatNumber(widthIn)} ×{" "}
                {formatNumber(heightIn)} in
              </p>
            )}
            {lengthCm && widthCm && heightCm && (
              <p className="text-gray-600">
                ({formatNumber(lengthCm)} × {formatNumber(widthCm)} ×{" "}
                {formatNumber(heightCm)} cm)
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
