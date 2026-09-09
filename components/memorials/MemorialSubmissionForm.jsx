// components/memorials/MemorialSubmissionForm.jsx
"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const DRAFT_STORAGE_PREFIX = "mabels-memorial-draft:";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const PET_TYPE_OPTIONS = [
  { value: "DOG", label: "Dog" },
  { value: "CAT", label: "Cat" },
  { value: "BIRD", label: "Bird" },
  { value: "RABBIT", label: "Rabbit" },
  { value: "REPTILE", label: "Reptile" },
  { value: "OTHER", label: "Other" },
];

const DONATION_OPTIONS = [3, 5, 10, 25];

const INITIAL_FORM = {
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",

  petName: "",
  petType: "",
  speciesOther: "",
  breed: "",
  birthYear: "",
  passedYear: "",

  headline: "",
  story: "",
  favoriteThings: "",
  closingMessage: "",

  donationAmount: "3",

  permissionToPublish: false,
  permissionToAdvertise: false,
  submitterConfirmedRights: false,
};

function createSelectedImage(file) {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

function getFileValidationError(file) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `${file.name} is not a supported image format.`;
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return `${file.name} must be smaller than 10 MB.`;
  }

  return null;
}

function draftStorageKey(memorialId) {
  return `${DRAFT_STORAGE_PREFIX}${memorialId}`;
}

function formFromMemorial(memorial) {
  return {
    ownerName: memorial.ownerName || "",
    ownerEmail: memorial.ownerEmail || "",
    ownerPhone: memorial.ownerPhone || "",
    petName: memorial.petName || "",
    petType: memorial.petType || "",
    speciesOther: memorial.speciesOther || "",
    breed: memorial.breed || "",
    birthYear: memorial.birthYear ? String(memorial.birthYear) : "",
    passedYear: memorial.passedYear ? String(memorial.passedYear) : "",
    headline: memorial.headline || "",
    story: memorial.story || "",
    favoriteThings: memorial.favoriteThings || "",
    closingMessage: memorial.closingMessage || "",
    donationAmount: Number.isInteger(memorial.donationAmountCents)
      ? String(memorial.donationAmountCents / 100)
      : "3",
    permissionToPublish: memorial.permissionToPublish === true,
    permissionToAdvertise: memorial.permissionToAdvertise === true,
    submitterConfirmedRights: memorial.submitterConfirmedRights === true,
  };
}

export default function MemorialSubmissionForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImageCount, setExistingImageCount] = useState(0);
  const [draftAccess, setDraftAccess] = useState(null);
  const [restoringDraft, setRestoringDraft] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    completed: 0,
    total: 0,
  });

  const [error, setError] = useState("");
  const [createdMemorial, setCreatedMemorial] = useState(null);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);
  const storyCharactersRemaining = 5000 - form.story.length;

  const donationAmount = useMemo(
    () => Number(form.donationAmount),
    [form.donationAmount]
  );

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, [selectedImages]);

  const renderTurnstile = () => {
    if (
      draftAccess ||
      !TURNSTILE_SITE_KEY ||
      !turnstileContainerRef.current ||
      !window.turnstile ||
      turnstileWidgetIdRef.current !== null
    ) {
      return;
    }

    turnstileWidgetIdRef.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: TURNSTILE_SITE_KEY,
        action: "memorial_create",
        callback: (token) => {
          setTurnstileToken(token);
          setTurnstileError("");
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setTurnstileError(
            "Verification expired. Please complete it again."
          );
        },
        "error-callback": () => {
          setTurnstileToken("");
          setTurnstileError(
            "Verification could not load. Please refresh and try again."
          );
        },
      }
    );
  };

  const resetTurnstile = () => {
    setTurnstileToken("");

    if (
      window.turnstile &&
      turnstileWidgetIdRef.current !== null
    ) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  };

  useEffect(() => {
    if (window.turnstile) {
      renderTurnstile();
    }

    return () => {
      if (
        window.turnstile &&
        turnstileWidgetIdRef.current !== null
      ) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
    // The widget is needed only while creating the initial draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftAccess]);

  useEffect(() => {
    let canceled = false;

    async function restoreDraft() {
      const memorialId = new URLSearchParams(window.location.search).get(
        "memorialId"
      );

      if (!memorialId) {
        setRestoringDraft(false);
        return;
      }

      const draftCapability = window.sessionStorage.getItem(
        draftStorageKey(memorialId)
      );

      if (!draftCapability) {
        setError(
          "This browser session does not have the secure access needed to restore that memorial draft. Please start a new submission."
        );
        setRestoringDraft(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/memorials/${encodeURIComponent(memorialId)}/resume`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draftCapability }),
          }
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.memorial?.id) {
          throw new Error(
            data?.error || "The memorial draft could not be restored."
          );
        }

        if (canceled) {
          return;
        }

        setForm(formFromMemorial(data.memorial));
        setExistingImageCount(data.memorial.imageCount || 0);
        setDraftAccess({
          memorialId: data.memorial.id,
          draftCapability,
        });

        if (data.memorial.status === "PENDING_PAYMENT") {
          setCreatedMemorial(data.memorial);
        }
      } catch (restoreError) {
        if (!canceled) {
          setError(
            restoreError?.message || "The memorial draft could not be restored."
          );
        }
      } finally {
        if (!canceled) {
          setRestoringDraft(false);
        }
      }
    }

    restoreDraft();

    return () => {
      canceled = true;
    };
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleImageSelection = (event) => {
    setError("");

    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const availableSlots =
      MAX_IMAGES - existingImageCount - selectedImages.length;

    if (availableSlots <= 0) {
      setError(`You can upload up to ${MAX_IMAGES} photos.`);
      event.target.value = "";
      return;
    }

    const acceptedFiles = [];
    const validationErrors = [];

    for (const file of files.slice(0, availableSlots)) {
      const validationError = getFileValidationError(file);

      if (validationError) {
        validationErrors.push(validationError);
        continue;
      }

      acceptedFiles.push(createSelectedImage(file));
    }

    setSelectedImages((current) => [...current, ...acceptedFiles]);

    if (files.length > availableSlots) {
      validationErrors.push(
        `Only ${availableSlots} more photo${
          availableSlots === 1 ? "" : "s"
        } could be added.`
      );
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
    }

    event.target.value = "";
  };

  const removeImage = (imageId) => {
    setSelectedImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return current.filter((image) => image.id !== imageId);
    });
  };

  const validateForm = () => {
    if (!form.ownerName.trim()) {
      return "Please enter your name.";
    }

    if (!form.ownerEmail.trim()) {
      return "Please enter your email address.";
    }

    if (!form.petName.trim()) {
      return "Please enter your pet's name.";
    }

    if (!form.petType) {
      return "Please select your pet's type.";
    }

    if (form.petType === "OTHER" && !form.speciesOther.trim()) {
      return "Please tell us what type of pet you are memorializing.";
    }

    if (form.story.trim().length < 20) {
      return "Please share at least a few sentences about your pet.";
    }

    if (form.story.length > 5000) {
      return "Your pet's story cannot exceed 5,000 characters.";
    }

    if (selectedImages.length + existingImageCount === 0) {
      return "Please upload at least one photo of your pet.";
    }

    if (
      !Number.isFinite(donationAmount) ||
      donationAmount < 3 ||
      donationAmount > 10000
    ) {
      return "The memorial donation must be at least $3.";
    }

    if (!form.permissionToPublish) {
      return "Permission to publish is required for the Memorial Gallery.";
    }

    if (!form.submitterConfirmedRights) {
      return "Please confirm that you have permission to submit these photos and this story.";
    }

    if (!draftAccess && (!TURNSTILE_SITE_KEY || !turnstileToken)) {
      return TURNSTILE_SITE_KEY
        ? "Please complete the verification challenge."
        : "Memorial verification is not configured.";
    }

    return null;
  };

  const createMemorialDraft = async () => {
    const response = await fetch("/api/memorials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone,

        petName: form.petName,
        petType: form.petType,
        speciesOther: form.petType === "OTHER" ? form.speciesOther : null,
        breed: form.breed,

        birthYear: form.birthYear || null,
        passedYear: form.passedYear || null,

        headline: form.headline,
        story: form.story,
        favoriteThings: form.favoriteThings,
        closingMessage: form.closingMessage,

        donationAmountCents: Math.round(donationAmount * 100),

        permissionToPublish: form.permissionToPublish,
        permissionToAdvertise: form.permissionToAdvertise,
        submitterConfirmedRights: form.submitterConfirmedRights,
        turnstileToken,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (
      !response.ok ||
      !data?.memorial?.id ||
      typeof data?.draftCapability !== "string"
    ) {
      throw new Error(
        data?.error || "The memorial draft could not be created."
      );
    }

    window.sessionStorage.setItem(
      draftStorageKey(data.memorial.id),
      data.draftCapability
    );

    return {
      memorial: data.memorial,
      draftCapability: data.draftCapability,
    };
  };

  const markReservationForReview = async (
    memorialId,
    draftCapability,
    reservationId
  ) => {
    try {
      await fetch(`/api/memorials/${encodeURIComponent(memorialId)}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftCapability, reservationId }),
      });
    } catch {
      // The server-side reservation remains available for manual review.
    }
  };

  const restoreImageCount = async (memorialId, draftCapability) => {
    const response = await fetch(
      `/api/memorials/${encodeURIComponent(memorialId)}/resume`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftCapability }),
      }
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.memorial?.id) {
      return null;
    }

    return data.memorial.imageCount;
  };

  const uploadMemorialImages = async (memorialId, draftCapability) => {
    const imagesToUpload = [...selectedImages];
    let finalizedImageCount = existingImageCount;

    setUploadProgress({
      completed: 0,
      total: imagesToUpload.length,
    });

    for (let index = 0; index < imagesToUpload.length; index += 1) {
      const selectedImage = imagesToUpload[index];
      const grantResponse = await fetch(
        `/api/memorials/${encodeURIComponent(memorialId)}/images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftCapability }),
        }
      );
      const grant = await grantResponse.json().catch(() => ({}));

      if (
        !grantResponse.ok ||
        !grant?.reservation?.id ||
        !grant?.uploadUrl ||
        !grant?.signature
      ) {
        throw new Error(
          grant?.error || `Photo ${index + 1} could not be prepared.`
        );
      }

      const imageFormData = new FormData();
      imageFormData.append("file", selectedImage.file);
      imageFormData.append("api_key", grant.apiKey);
      imageFormData.append("signature", grant.signature);

      Object.entries(grant.uploadParams || {}).forEach(([key, value]) => {
        imageFormData.append(key, String(value));
      });

      let cloudinaryResponse;

      try {
        cloudinaryResponse = await fetch(grant.uploadUrl, {
          method: "POST",
          body: imageFormData,
        });
      } catch (uploadError) {
        await markReservationForReview(
          memorialId,
          draftCapability,
          grant.reservation.id
        );
        throw uploadError;
      }

      const cloudinaryData = await cloudinaryResponse
        .json()
        .catch(() => ({}));

      if (!cloudinaryResponse.ok) {
        await markReservationForReview(
          memorialId,
          draftCapability,
          grant.reservation.id
        );
        throw new Error(`Photo ${index + 1} could not be uploaded.`);
      }

      const finalizationBody = {
        draftCapability,
        reservationId: grant.reservation.id,
        altText: `${form.petName.trim()} memorial photo ${
          finalizedImageCount + 1
        }`,
        proof: {
          publicId: cloudinaryData.public_id,
          assetId: cloudinaryData.asset_id,
          version: cloudinaryData.version,
          responseSignature: cloudinaryData.signature,
        },
      };

      let finalizationResponse;
      let finalizationData;

      try {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          finalizationResponse = await fetch(
            `/api/memorials/${encodeURIComponent(memorialId)}/images`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(finalizationBody),
            }
          );
          finalizationData = await finalizationResponse
            .json()
            .catch(() => ({}));

          if (finalizationResponse.ok || finalizationResponse.status < 500) {
            break;
          }
        }
      } catch (finalizationError) {
        await markReservationForReview(
          memorialId,
          draftCapability,
          grant.reservation.id
        );
        throw finalizationError;
      }

      if (!finalizationResponse.ok || !finalizationData?.image?.id) {
        if (finalizationResponse.status === 409) {
          const restoredCount = await restoreImageCount(
            memorialId,
            draftCapability
          );

          if (
            Number.isInteger(restoredCount) &&
            restoredCount > finalizedImageCount
          ) {
            finalizedImageCount = restoredCount;
          } else {
            throw new Error(
              finalizationData?.error ||
                `Photo ${index + 1} could not be finalized.`
            );
          }
        } else {
          await markReservationForReview(
            memorialId,
            draftCapability,
            grant.reservation.id
          );
          throw new Error(
            finalizationData?.error ||
              `Photo ${index + 1} could not be finalized.`
          );
        }
      } else {
        finalizedImageCount = finalizationData.imageCount;
      }

      URL.revokeObjectURL(selectedImage.previewUrl);
      setSelectedImages((current) =>
        current.filter((image) => image.id !== selectedImage.id)
      );
      setExistingImageCount(finalizedImageCount);

      setUploadProgress({
        completed: index + 1,
        total: imagesToUpload.length,
      });
    }

    return finalizedImageCount;
  };

  const handleCheckout = async () => {
    if (
      !createdMemorial?.id ||
      !draftAccess?.draftCapability ||
      startingCheckout
    ) {
      return;
    }

    try {
      setStartingCheckout(true);
      setError("");

      const response = await fetch("/api/memorials/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memorialId: createdMemorial.id,
          draftCapability: draftAccess.draftCapability,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error || "Memorial checkout could not be started."
        );
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      console.error("[memorial-submission] checkout error:", checkoutError);

      setError(
        checkoutError?.message || "Memorial checkout could not be started."
      );

      setStartingCheckout(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      let access = draftAccess;
      let memorial;

      if (!access) {
        let created;

        try {
          created = await createMemorialDraft();
        } catch (creationError) {
          resetTurnstile();
          throw creationError;
        }

        memorial = created.memorial;
        access = {
          memorialId: created.memorial.id,
          draftCapability: created.draftCapability,
        };
        setDraftAccess(access);
        setTurnstileToken("");
      } else {
        memorial = {
          id: access.memorialId,
          donationAmountCents: Math.round(donationAmount * 100),
          currency: "usd",
        };
      }

      const imageCount =
        selectedImages.length > 0
          ? await uploadMemorialImages(
              access.memorialId,
              access.draftCapability
            )
          : existingImageCount;

      setCreatedMemorial({
        ...memorial,
        id: access.memorialId,
        imageCount,
      });
    } catch (submissionError) {
      console.error("[memorial-submission] submission error:", submissionError);

      setError(
        submissionError?.message ||
          "The memorial could not be saved. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (createdMemorial) {
    return (
      <section className="rounded-2xl border border-green-200 bg-white p-6 text-center shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Memorial Saved
        </p>

        <h2 className="mt-3 text-3xl font-bold text-gray-900">
          {form.petName}&apos;s tribute is ready for checkout
        </h2>

        <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
          Your story and {createdMemorial.imageCount || existingImageCount} photo
          {(createdMemorial.imageCount || existingImageCount) === 1 ? "" : "s"} were uploaded successfully.
          The next step is completing your ${donationAmount.toFixed(2)} memorial
          donation.
        </p>

        <div className="mx-auto mt-6 max-w-md rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
          <p className="text-sm text-gray-500">Memorial reference</p>
          <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900">
            {createdMemorial.id}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={startingCheckout}
          className="mt-6 w-full rounded-xl bg-pink-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {startingCheckout
            ? "Opening secure checkout..."
            : `Continue to Payment — $${donationAmount.toFixed(2)}`}
        </button>

        <p className="mt-3 text-sm text-gray-500">
          Payment is processed securely through Stripe. Your memorial will be
          reviewed after payment is confirmed.
        </p>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-pink-100 bg-white p-5 shadow-xl sm:p-8"
    >
      <section>
        <h2 className="text-xl font-bold text-gray-900">Your information</h2>

        <p className="mt-1 text-sm text-gray-500">
          We use your email to send payment confirmation, memorial status
          updates, and contact you if Bridget has questions about your
          submission. Your email and phone number will not appear publicly.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ownerName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Your name
            </label>

            <input
              id="ownerName"
              type="text"
              autoComplete="name"
              value={form.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
              className="input input-bordered w-full"
              required
            />
          </div>

          <div>
            <label
              htmlFor="ownerEmail"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <input
              id="ownerEmail"
              type="email"
              autoComplete="email"
              value={form.ownerEmail}
              onChange={(event) =>
                updateField("ownerEmail", event.target.value)
              }
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="ownerPhone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Phone number{" "}
              <span className="font-normal text-gray-400">Optional</span>
            </label>

            <input
              id="ownerPhone"
              type="tel"
              autoComplete="tel"
              value={form.ownerPhone}
              onChange={(event) =>
                updateField("ownerPhone", event.target.value)
              }
              className="input input-bordered w-full"
            />
          </div>
        </div>
      </section>

      <hr className="my-8 border-gray-200" />

      <section>
        <h2 className="text-xl font-bold text-gray-900">
          Tell us about your pet
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="petName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Pet&apos;s name
            </label>

            <input
              id="petName"
              type="text"
              value={form.petName}
              onChange={(event) => updateField("petName", event.target.value)}
              className="input input-bordered w-full"
              required
            />
          </div>

          <div>
            <label
              htmlFor="petType"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Type of pet
            </label>

            <select
              id="petType"
              value={form.petType}
              onChange={(event) => updateField("petType", event.target.value)}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select a pet type</option>

              {PET_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {form.petType === "OTHER" && (
            <div className="sm:col-span-2">
              <label
                htmlFor="speciesOther"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                What type of pet?
              </label>

              <input
                id="speciesOther"
                type="text"
                value={form.speciesOther}
                onChange={(event) =>
                  updateField("speciesOther", event.target.value)
                }
                className="input input-bordered w-full"
                required
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label
              htmlFor="breed"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Breed <span className="font-normal text-gray-400">Optional</span>
            </label>

            <input
              id="breed"
              type="text"
              value={form.breed}
              onChange={(event) => updateField("breed", event.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          <div>
            <label
              htmlFor="birthYear"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Birth year{" "}
              <span className="font-normal text-gray-400">Optional</span>
            </label>

            <input
              id="birthYear"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              inputMode="numeric"
              value={form.birthYear}
              onChange={(event) => updateField("birthYear", event.target.value)}
              className="input input-bordered w-full"
              placeholder="2010"
            />
          </div>

          <div>
            <label
              htmlFor="passedYear"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Year of passing{" "}
              <span className="font-normal text-gray-400">Optional</span>
            </label>

            <input
              id="passedYear"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              inputMode="numeric"
              value={form.passedYear}
              onChange={(event) =>
                updateField("passedYear", event.target.value)
              }
              className="input input-bordered w-full"
              placeholder="2025"
            />
          </div>
        </div>
      </section>

      <hr className="my-8 border-gray-200" />

      <section>
        <h2 className="text-xl font-bold text-gray-900">Share their story</h2>

        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="headline"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Memorial headline{" "}
              <span className="font-normal text-gray-400">Optional</span>
            </label>

            <input
              id="headline"
              type="text"
              maxLength={150}
              value={form.headline}
              onChange={(event) => updateField("headline", event.target.value)}
              className="input input-bordered w-full"
              placeholder={`Forever loved, forever remembered`}
            />
          </div>

          <div>
            <label
              htmlFor="story"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Your pet&apos;s story
            </label>

            <textarea
              id="story"
              rows={8}
              maxLength={5000}
              value={form.story}
              onChange={(event) => updateField("story", event.target.value)}
              className="textarea textarea-bordered w-full leading-6"
              placeholder="Tell us what made your pet special, how they became part of your family, and the memories you want people to remember."
              required
            />

            <p
              className={`mt-1 text-right text-xs ${
                storyCharactersRemaining < 250
                  ? "text-orange-600"
                  : "text-gray-400"
              }`}
            >
              {storyCharactersRemaining.toLocaleString()} characters remaining
            </p>
          </div>

          <div>
            <label
              htmlFor="favoriteThings"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Favorite things{" "}
              <span className="font-normal text-gray-400">Optional</span>
            </label>

            <textarea
              id="favoriteThings"
              rows={3}
              maxLength={1000}
              value={form.favoriteThings}
              onChange={(event) =>
                updateField("favoriteThings", event.target.value)
              }
              className="textarea textarea-bordered w-full"
              placeholder="Favorite toys, treats, places, habits, or activities"
            />
          </div>

          <div>
            <label
              htmlFor="closingMessage"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Closing message{" "}
              <span className="font-normal text-gray-400">Optional</span>
            </label>

            <textarea
              id="closingMessage"
              rows={3}
              maxLength={1000}
              value={form.closingMessage}
              onChange={(event) =>
                updateField("closingMessage", event.target.value)
              }
              className="textarea textarea-bordered w-full"
              placeholder="A final message to your pet"
            />
          </div>
        </div>
      </section>

      <hr className="my-8 border-gray-200" />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add your photos</h2>

            <p className="mt-1 text-sm text-gray-500">
              Upload between one and six photos. The first photo will be used as
              the initial cover.
            </p>
          </div>

          <p className="text-sm font-medium text-gray-600">
            {existingImageCount + selectedImages.length} of {MAX_IMAGES} ready
          </p>
        </div>

        <div className="mt-5">
          <label
            htmlFor="memorialPhotos"
            className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-6 text-center transition ${
              existingImageCount + selectedImages.length >= MAX_IMAGES
                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                : "border-pink-300 bg-pink-50 text-pink-800 hover:border-pink-500 hover:bg-pink-100"
            }`}
          >
            <span className="font-semibold">
              {existingImageCount + selectedImages.length >= MAX_IMAGES
                ? "Maximum photos selected"
                : "Choose photos"}
            </span>

            <span className="mt-1 text-xs">
              JPEG, PNG, or WebP. Maximum 10 MB each.
            </span>
          </label>

          <input
            id="memorialPhotos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={
              existingImageCount + selectedImages.length >= MAX_IMAGES ||
              submitting ||
              restoringDraft
            }
            onChange={handleImageSelection}
            className="sr-only"
          />
        </div>

        {selectedImages.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {selectedImages.map((image, index) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={image.previewUrl}
                    alt={`Selected memorial preview ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-xs font-medium text-white">
                      Cover
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="min-w-0 truncate text-xs text-gray-500">
                    {image.file.name}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    disabled={submitting}
                    className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="my-8 border-gray-200" />

      <section>
        <h2 className="text-xl font-bold text-gray-900">Memorial donation</h2>

        <p className="mt-1 text-sm text-gray-500">
          The minimum donation is $3. You may choose a larger amount to support
          Bridget&apos;s work with animals.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {DONATION_OPTIONS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => updateField("donationAmount", String(amount))}
              className={`rounded-lg border px-5 py-2.5 font-semibold transition ${
                Number(form.donationAmount) === amount
                  ? "border-pink-600 bg-pink-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-pink-400"
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>

        <div className="mt-4 max-w-xs">
          <label
            htmlFor="donationAmount"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Custom donation
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              $
            </span>

            <input
              id="donationAmount"
              type="number"
              min="3"
              max="10000"
              step="1"
              inputMode="decimal"
              value={form.donationAmount}
              onChange={(event) =>
                updateField("donationAmount", event.target.value)
              }
              className="input input-bordered w-full pl-7"
            />
          </div>
        </div>
      </section>

      <hr className="my-8 border-gray-200" />

      <section>
        <h2 className="text-xl font-bold text-gray-900">
          Publication permissions
        </h2>

        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.permissionToPublish}
              onChange={(event) =>
                updateField("permissionToPublish", event.target.checked)
              }
              className="checkbox checkbox-sm mt-0.5"
            />

            <span className="text-sm leading-6 text-gray-700">
              I give Mabel&apos;s Pawfect permission to publish this memorial,
              story, and submitted photos in the public Memorial Gallery.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.permissionToAdvertise}
              onChange={(event) =>
                updateField("permissionToAdvertise", event.target.checked)
              }
              className="checkbox checkbox-sm mt-0.5"
            />

            <span className="text-sm leading-6 text-gray-700">
              I also give Mabel&apos;s Pawfect permission to feature this
              memorial in advertising, social media, or promotional materials.
              This is optional.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.submitterConfirmedRights}
              onChange={(event) =>
                updateField("submitterConfirmedRights", event.target.checked)
              }
              className="checkbox checkbox-sm mt-0.5"
            />

            <span className="text-sm leading-6 text-gray-700">
              I confirm that I own these photos or have permission to submit
              them, and that the information I provided is accurate.
            </span>
          </label>
        </div>
      </section>

      {!draftAccess && (
        <section className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="lazyOnload"
            onLoad={renderTurnstile}
            onReady={renderTurnstile}
          />
          <p className="mb-3 text-sm text-gray-600">
            Complete the verification below before saving your memorial.
          </p>
          <div ref={turnstileContainerRef} />
          {turnstileError && (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {turnstileError}
            </p>
          )}
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
        >
          {error}
        </div>
      )}

      {submitting && uploadProgress.total > 0 && (
        <div className="mt-6 rounded-xl border border-pink-200 bg-pink-50 p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-pink-900">
              Uploading memorial photos
            </span>

            <span className="text-pink-700">
              {uploadProgress.completed} of {uploadProgress.total}
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-pink-100">
            <div
              className="h-full rounded-full bg-pink-600 transition-all duration-300"
              style={{
                width: `${
                  uploadProgress.total > 0
                    ? (uploadProgress.completed / uploadProgress.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={
          submitting ||
          restoringDraft ||
          (!draftAccess && (!TURNSTILE_SITE_KEY || !turnstileToken))
        }
        className="mt-8 w-full rounded-xl bg-pink-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {restoringDraft
          ? "Restoring secure draft..."
          : submitting
          ? uploadProgress.total > 0
            ? `Uploading photo ${Math.min(
                uploadProgress.completed + 1,
                uploadProgress.total
              )} of ${uploadProgress.total}...`
            : "Saving memorial..."
          : "Continue to Memorial Donation"}
      </button>

      <p className="mt-3 text-center text-xs leading-5 text-gray-500">
        Your memorial will not appear publicly until payment is completed and
        Bridget has reviewed and approved the submission.
      </p>
    </form>
  );
}
