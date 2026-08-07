// components/Donation.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const DONATION_OPTIONS = [
  {
    purpose: "FOOD_LITTER",
    name: "Food and Litter",
    description: "Provide everyday kitten food and fresh litter.",
    amount: 10,
  },
  {
    purpose: "TOYS_ENRICHMENT",
    name: "Toys and Enrichment",
    description: "Support play, comfort, exercise, and healthy development.",
    amount: 15,
  },
  {
    purpose: "KITTEN_RESCUE",
    name: "General Rescue Care",
    description: "Help cover routine rescue and foster-care expenses.",
    amount: 25,
  },
  {
    purpose: "PREMIUM_RESCUE",
    name: "Medical and Emergency Support",
    description: "Provide substantial support for veterinary and urgent care.",
    amount: 100,
  },
];

function formatCurrency(amount) {
  const parsed = Number(amount);

  if (!Number.isFinite(parsed)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(parsed);
}

function ChoiceIndicator({ selected, selectedText, availableText }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold ${
        selected ? "text-pink-700" : "text-gray-500"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
          selected ? "border-pink-600 bg-pink-600" : "border-gray-400 bg-white"
        }`}
      >
        {selected ? (
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        ) : null}
      </span>

      {selected ? selectedText : availableText}
    </span>
  );
}

function CheckboxIndicator({ selected }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
        selected
          ? "border-pink-600 bg-pink-600 text-white"
          : "border-gray-400 bg-white"
      }`}
    >
      {selected ? (
        <span className="h-2.5 w-1.5 -translate-y-px rotate-45 border-b-2 border-r-2 border-white" />
      ) : null}
    </span>
  );
}

export default function Donation({ className = "" }) {
  const [cats, setCats] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catsError, setCatsError] = useState(null);

  // Null means the General Rescue Fund is selected.
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [selectedPurposes, setSelectedPurposes] = useState([]);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFosterCats() {
      try {
        setLoadingCats(true);
        setCatsError(null);

        const response = await fetch("/api/foster-cats", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load foster cats.");
        }

        const loadedCats = Array.isArray(data?.cats) ? data.cats : [];

        setCats(loadedCats);

        const requestedCatId = new URLSearchParams(window.location.search).get(
          "fosterCat"
        );

        if (
          requestedCatId &&
          loadedCats.some((cat) => cat.id === requestedCatId)
        ) {
          setSelectedCatId(requestedCatId);
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("[donation] foster cat error:", error);

        setCatsError(error?.message || "Unable to load foster cats.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCats(false);
        }
      }
    }

    loadFosterCats();

    return () => {
      controller.abort();
    };
  }, []);

  const selectedCat = useMemo(
    () => cats.find((cat) => cat.id === selectedCatId) || null,
    [cats, selectedCatId]
  );

  const selectedOptions = useMemo(
    () =>
      DONATION_OPTIONS.filter((option) =>
        selectedPurposes.includes(option.purpose)
      ),
    [selectedPurposes]
  );

  const fixedTotal = selectedOptions.reduce(
    (total, option) => total + option.amount,
    0
  );

  const parsedCustomAmount = Number.parseFloat(customAmount);
  const customAmountIsValid =
    Number.isFinite(parsedCustomAmount) &&
    parsedCustomAmount >= 1 &&
    parsedCustomAmount <= 10000;

  const customTotal =
    customEnabled && customAmountIsValid ? parsedCustomAmount : 0;

  const finalAmount = fixedTotal + customTotal;
  const hasSelection = selectedOptions.length > 0 || customEnabled;
  const hasValidAmount =
    hasSelection &&
    (!customEnabled || customAmountIsValid) &&
    finalAmount >= 1 &&
    finalAmount <= 10000;

  const normalizedDonorName = donorName.trim();
  const normalizedDonorEmail = donorEmail.trim().toLowerCase();
  const donorNameIsValid =
    normalizedDonorName.length >= 2 && normalizedDonorName.length <= 100;
  const donorEmailIsValid =
    normalizedDonorEmail.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedDonorEmail);
  const hasValidDonorInfo = donorNameIsValid && donorEmailIsValid;

  const donationTargetName = selectedCat?.name || "General Rescue Fund";

  const donationTargetSentence = selectedCat
    ? selectedCat.name
    : "the General Rescue Fund";

  function updateFosterCatQuery(catId) {
    const url = new URL(window.location.href);

    if (catId) {
      url.searchParams.set("fosterCat", catId);
    } else {
      url.searchParams.delete("fosterCat");
    }

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  function selectGeneralFund() {
    setSelectedCatId(null);
    setCheckoutError(null);
    updateFosterCatQuery(null);
  }

  function selectCat(catId) {
    // Destination choices behave like radio buttons.
    // Clicking the selected cat again leaves it selected.
    setSelectedCatId(catId);
    setCheckoutError(null);
    updateFosterCatQuery(catId);
  }

  function toggleDonationOption(purpose) {
    setSelectedPurposes((current) =>
      current.includes(purpose)
        ? current.filter((item) => item !== purpose)
        : [...current, purpose]
    );

    setCheckoutError(null);
  }

  function toggleCustomDonation() {
    setCustomEnabled((current) => !current);
    setCheckoutError(null);
  }

  async function handleDonate() {
    if (!hasSelection) {
      setCheckoutError("Choose at least one support option before continuing.");
      return;
    }

    if (!hasValidAmount) {
      setCheckoutError(
        customEnabled && !customAmountIsValid
          ? "Enter a custom donation amount between $1 and $10,000."
          : "The combined donation must be between $1 and $10,000."
      );
      return;
    }

    if (!donorNameIsValid) {
      setCheckoutError("Enter your full name before continuing.");
      return;
    }

    if (!donorEmailIsValid) {
      setCheckoutError("Enter a valid email address before continuing.");
      return;
    }

    const items = [
      ...selectedOptions.map((option) => ({
        purpose: option.purpose,
      })),
      ...(customEnabled
        ? [
            {
              purpose: "GENERAL",
              amount: parsedCustomAmount,
            },
          ]
        : []),
    ];

    try {
      setLoading(true);
      setCheckoutError(null);

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          donationType: "kitten-rescue",
          target: selectedCat ? "FOSTER_CAT" : "GENERAL",
          fosterCatId: selectedCat?.id || null,
          donorName: normalizedDonorName,
          donorEmail: normalizedDonorEmail,
          items,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error || "Something went wrong. Please try again."
        );
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("[donation] checkout error:", error);

      setCheckoutError(
        error?.message || "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <div className={`text-left ${className}`}>
      <section className="mb-8 overflow-hidden rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-100 shadow-sm">
        <img
          src="/images/kitten-rescue.jpeg"
          alt="Rescued kittens receiving care"
          className="w-full rounded-t-xl bg-white object-contain"
        />

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-700">
            Kitten Rescue Fund
          </p>

          <h2 className="mt-2 text-xl font-bold text-gray-900">
            Help Save Rescue Kittens
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-700">
            Choose where your donation goes, select how you would like it to
            help, and review everything before continuing to Stripe.
          </p>
          <Link
            href="/foster-cats"
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-pink-300 bg-white px-4 py-2.5 text-sm font-semibold text-pink-700 transition hover:border-pink-500 hover:bg-pink-50"
          >
            Meet Our Foster Cats
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="donation-target-heading"
        aria-describedby="donation-target-description"
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-pink-700">
            Step 1
          </p>

          <h2
            id="donation-target-heading"
            className="mt-1 text-xl font-bold text-gray-900"
          >
            Choose Where Your Donation Goes
          </h2>

          <p
            id="donation-target-description"
            className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600"
          >
            Select the General Rescue Fund or choose a foster cat. The General
            Fund is selected by default.
          </p>
        </div>

        <div
          className="mt-5"
          role="radiogroup"
          aria-label="Donation destination"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!selectedCatId}
            onClick={selectGeneralFund}
            className={`w-full rounded-xl border p-5 text-left transition ${
              !selectedCatId
                ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                : "border-gray-200 bg-white hover:border-pink-300"
            }`}
          >
            <span className="flex items-start justify-between gap-4">
              <span>
                <span className="block font-bold text-gray-900">
                  General Rescue Fund
                </span>

                <span className="mt-1 block text-sm leading-6 text-gray-600">
                  Let the rescue use your donation wherever it is needed most.
                </span>
              </span>

              <ChoiceIndicator
                selected={!selectedCatId}
                selectedText="Selected"
                availableText="Select"
              />
            </span>
          </button>

          {loadingCats ? (
            <p className="mt-5 text-center text-sm text-gray-500">
              Loading foster cats...
            </p>
          ) : catsError ? (
            <p
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700"
              role="alert"
            >
              {catsError}
            </p>
          ) : cats.length > 0 ? (
            <>
              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-gray-700">
                  Or support a specific foster cat
                </p>

                <Link
                  href="/foster-cats"
                  className="shrink-0 text-xs font-semibold text-pink-700 hover:text-pink-900"
                >
                  View full profiles
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cats.map((cat) => {
                  const isSelected = selectedCatId === cat.id;

                  const catDetails = [cat.ageLabel, cat.sex]
                    .filter(Boolean)
                    .join(" Â· ");

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${isSelected ? "Selected" : "Select"} ${
                        cat.name
                      }`}
                      onClick={() => selectCat(cat.id)}
                      className={`group overflow-hidden rounded-xl border text-left transition ${
                        isSelected
                          ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                          : "border-gray-200 bg-white hover:border-pink-300"
                      }`}
                    >
                      <img
                        src={cat.imageUrl}
                        alt={cat.imageAlt || cat.name}
                        className="aspect-square w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                      />

                      <span className="block p-3">
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-gray-900 sm:text-base">
                              {cat.name}
                            </span>

                            {catDetails ? (
                              <span className="mt-0.5 block truncate text-[11px] text-gray-500 sm:text-xs">
                                {catDetails}
                              </span>
                            ) : null}
                          </span>

                          <span
                            aria-hidden="true"
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? "border-pink-600 bg-pink-600"
                                : "border-gray-400 bg-white"
                            }`}
                          >
                            {isSelected ? (
                              <span className="h-2.5 w-1.5 -translate-y-px rotate-45 border-b-2 border-r-2 border-white" />
                            ) : null}
                          </span>
                        </span>

                        <span
                          className={`mt-2 block text-[11px] font-semibold sm:text-xs ${
                            isSelected ? "text-pink-700" : "text-gray-500"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select kitten"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedCat ? (
                <div
                  className="mt-4 rounded-xl border border-pink-200 bg-pink-50 p-4"
                  aria-live="polite"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pink-700">
                        Selected Foster Cat
                      </p>

                      <h3 className="mt-1 font-bold text-gray-900">
                        {selectedCat.name}
                      </h3>

                      {selectedCat.ageLabel || selectedCat.sex ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {[selectedCat.ageLabel, selectedCat.sex]
                            .filter(Boolean)
                            .join(" Â· ")}
                        </p>
                      ) : null}
                    </div>

                    <span className="shrink-0 rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold text-white">
                      Selected
                    </span>
                  </div>

                  {selectedCat.shortBio ? (
                    <p className="mt-3 text-sm leading-6 text-gray-700">
                      {selectedCat.shortBio}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs font-semibold text-pink-700">
                    Your donation will be designated for {selectedCat.name}.
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="mt-5 text-center text-sm text-gray-500">
              No foster cats are currently available. You can still support the
              General Rescue Fund.
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="donation-purpose-heading"
        aria-describedby="donation-purpose-description"
        className="mt-10 border-t border-gray-200 pt-8"
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-pink-700">
            Step 2
          </p>

          <h2
            id="donation-purpose-heading"
            className="mt-1 text-xl font-bold text-gray-900"
          >
            Choose One or More Ways to Help
          </h2>

          <p
            id="donation-purpose-description"
            className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600"
          >
            Select as many support options as you would like. Every selection
            below supports {donationTargetSentence}.
          </p>
        </div>

        <div
          className="mt-5 grid gap-3 sm:grid-cols-2"
          role="group"
          aria-label="Donation support options"
        >
          {DONATION_OPTIONS.map((option) => {
            const isSelected = selectedPurposes.includes(option.purpose);

            return (
              <button
                key={option.purpose}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleDonationOption(option.purpose)}
                className={`rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                    : "border-gray-200 bg-white hover:border-pink-300"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-3">
                    <CheckboxIndicator selected={isSelected} />

                    <span className="font-bold text-gray-900">
                      {option.name}
                    </span>
                  </span>

                  <span className="whitespace-nowrap font-bold text-pink-700">
                    {formatCurrency(option.amount)}
                  </span>
                </span>

                <span className="mt-2 block text-sm leading-6 text-gray-600">
                  {option.description}
                </span>

                <span
                  className={`mt-3 block text-xs font-semibold ${
                    isSelected ? "text-pink-700" : "text-gray-500"
                  }`}
                >
                  {isSelected ? "Included in your donation" : "Add this option"}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className={`mt-4 rounded-xl border p-4 transition ${
            customEnabled
              ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
              : "border-gray-200 bg-white hover:border-pink-300"
          }`}
        >
          <button
            type="button"
            aria-pressed={customEnabled}
            onClick={toggleCustomDonation}
            className="w-full text-left"
          >
            <span className="flex items-start justify-between gap-4">
              <span className="flex items-start gap-3">
                <CheckboxIndicator selected={customEnabled} />

                <span>
                  <span className="block font-bold text-gray-900">
                    Add a Custom Amount
                  </span>

                  <span className="mt-1 block text-sm text-gray-600">
                    Add any amount from $1 to $10,000 to your selected options.
                  </span>
                </span>
              </span>
            </span>
          </button>

          {customEnabled ? (
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Custom donation amount
              </span>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
                  $
                </span>

                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  inputMode="decimal"
                  autoFocus
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(event) => {
                    setCustomAmount(event.target.value);
                    setCheckoutError(null);
                  }}
                  className="input input-bordered w-full pl-7"
                />
              </div>
            </label>
          ) : null}
        </div>
      </section>

      <section
        className="mt-10 border-t border-gray-200 pt-8"
        aria-labelledby="donor-information-heading"
        aria-describedby="donor-information-description"
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-pink-700">
            Step 3
          </p>

          <h2
            id="donor-information-heading"
            className="mt-1 text-xl font-bold text-gray-900"
          >
            Your Information
          </h2>

          <p
            id="donor-information-description"
            className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600"
          >
            Enter the name and email address that should be connected to this
            donation.
          </p>
        </div>

        <div className="mt-5 grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Full name
            </span>

            <input
              type="text"
              name="donorName"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="Your full name"
              value={donorName}
              onChange={(event) => {
                setDonorName(event.target.value);
                setCheckoutError(null);
              }}
              className="input input-bordered w-full"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Email address
            </span>

            <input
              type="email"
              name="donorEmail"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="you@example.com"
              value={donorEmail}
              onChange={(event) => {
                setDonorEmail(event.target.value);
                setCheckoutError(null);
              }}
              className="input input-bordered w-full"
            />
          </label>
        </div>

        <p className="mt-2 text-center text-xs text-gray-500">
          We use this information to identify your donation and send payment
          confirmation.
        </p>
      </section>

      <section
        className="mt-10 border-t border-gray-200 pt-8"
        aria-labelledby="donation-summary-heading"
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-pink-700">
            Step 4
          </p>

          <h2
            id="donation-summary-heading"
            className="mt-1 text-xl font-bold text-gray-900"
          >
            Review Your Donation
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Confirm the details below before continuing to Stripe.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Donor</dt>

              <dd className="text-right font-semibold text-gray-900">
                {normalizedDonorName || "Enter your name above"}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Email</dt>

              <dd className="break-all text-right font-semibold text-gray-900">
                {normalizedDonorEmail || "Enter your email above"}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Donation destination</dt>

              <dd className="text-right font-semibold text-gray-900">
                {donationTargetName}
              </dd>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <dt className="text-gray-500">Ways you are helping</dt>

              <dd className="mt-3 space-y-2">
                {selectedOptions.length === 0 && !customEnabled ? (
                  <p className="text-gray-500">
                    Choose at least one option above.
                  </p>
                ) : (
                  <>
                    {selectedOptions.map((option) => (
                      <div
                        key={option.purpose}
                        className="flex justify-between gap-4"
                      >
                        <span className="font-medium text-gray-900">
                          {option.name}
                        </span>

                        <span className="font-semibold text-gray-900">
                          {formatCurrency(option.amount)}
                        </span>
                      </div>
                    ))}

                    {customEnabled ? (
                      <div className="flex justify-between gap-4">
                        <span className="font-medium text-gray-900">
                          Custom Amount
                        </span>

                        <span className="font-semibold text-gray-900">
                          {customAmountIsValid
                            ? formatCurrency(parsedCustomAmount)
                            : "Enter an amount"}
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
              </dd>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between gap-4">
                <dt className="font-semibold text-gray-700">Donation total</dt>

                <dd className="text-xl font-bold text-gray-900">
                  {hasSelection && finalAmount > 0
                    ? formatCurrency(finalAmount)
                    : "Not selected"}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </section>

      {checkoutError ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700"
          role="alert"
        >
          {checkoutError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleDonate}
        disabled={loading || !hasValidAmount || !hasValidDonorInfo}
        className="mt-6 w-full rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Redirecting to Stripe..."
          : !hasValidAmount
            ? "Choose at Least One Option"
            : !hasValidDonorInfo
              ? "Enter Your Information"
              : `Donate ${formatCurrency(
                  finalAmount
                )} to ${donationTargetSentence}`}
      </button>

      <p className="mt-2 text-center text-xs text-gray-500">
        Secure payment processing provided by Stripe.
      </p>
    </div>
  );
}
