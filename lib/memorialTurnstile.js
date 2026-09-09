import "server-only";

import { getCanonicalAppOrigin } from "@/lib/memorialCheckout";
import { MemorialUploadError } from "@/lib/memorialUpload";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const EXPECTED_ACTION = "memorial_create";
const MAX_TOKEN_LENGTH = 2048;
const MAX_RESPONSE_LENGTH = 16 * 1024;
const VERIFY_TIMEOUT_MS = 8000;

function unavailableError() {
  return new MemorialUploadError(
    "Verification is temporarily unavailable. Please try again.",
    503,
    { code: "TURNSTILE_UNAVAILABLE" }
  );
}

async function readBoundedResponseJson(response, controller) {
  if (!response.body) {
    throw unavailableError();
  }

  const reader = response.body.getReader();
  const chunks = [];
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!(value instanceof Uint8Array)) {
        throw unavailableError();
      }

      bytesRead += value.byteLength;

      if (bytesRead > MAX_RESPONSE_LENGTH) {
        controller.abort();
        void reader.cancel().catch(() => {});
        throw unavailableError();
      }

      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  let responseText;
  try {
    const responseBytes = Buffer.concat(chunks, bytesRead);
    responseText = new TextDecoder("utf-8", { fatal: true }).decode(
      responseBytes
    );
  } catch {
    throw unavailableError();
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw unavailableError();
  }
}

function configuration() {
  const siteKey = String(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
  ).trim();
  const secretKey = String(process.env.TURNSTILE_SECRET_KEY || "").trim();

  let expectedHostname;
  try {
    expectedHostname = new URL(getCanonicalAppOrigin()).hostname.toLowerCase();
  } catch {
    throw new MemorialUploadError(
      "Memorial verification is not configured.",
      503,
      { code: "TURNSTILE_CONFIGURATION_ERROR" }
    );
  }

  if (!siteKey || !secretKey || !expectedHostname) {
    throw new MemorialUploadError(
      "Memorial verification is not configured.",
      503,
      { code: "TURNSTILE_CONFIGURATION_ERROR" }
    );
  }

  return { secretKey, expectedHostname };
}

export async function verifyMemorialCreationChallenge(token) {
  const challengeToken = String(token || "").trim();

  if (!challengeToken || challengeToken.length > MAX_TOKEN_LENGTH) {
    throw new MemorialUploadError(
      "Please complete the verification challenge.",
      400,
      { code: "TURNSTILE_REQUIRED" }
    );
  }

  const { secretKey, expectedHostname } = configuration();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: challengeToken,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      controller.abort();
      throw unavailableError();
    }

    const result = await readBoundedResponseJson(response, controller);
    const hostname = String(result?.hostname || "").toLowerCase();
    const action = String(result?.action || "");

    if (
      result?.success !== true ||
      hostname !== expectedHostname ||
      action !== EXPECTED_ACTION
    ) {
      const errorCodes = Array.isArray(result?.["error-codes"])
        ? result["error-codes"]
        : [];
      const isExpired = errorCodes.includes("timeout-or-duplicate");

      throw new MemorialUploadError(
        isExpired
          ? "Verification expired. Please complete it again."
          : "Verification could not be completed. Please try again.",
        isExpired ? 409 : 403,
        { code: isExpired ? "TURNSTILE_EXPIRED" : "TURNSTILE_FAILED" }
      );
    }

    return true;
  } catch (error) {
    if (error instanceof MemorialUploadError) {
      throw error;
    }

    throw unavailableError();
  } finally {
    clearTimeout(timeout);
  }
}
