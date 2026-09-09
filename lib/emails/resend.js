import "server-only";

import { Resend } from "resend";

const DELIVERY_MODES = Object.freeze({
  PRODUCTION: "production",
  QA: "qa",
});

const FORBIDDEN_QA_DOMAINS = new Set([
  "mabelspawfectpetservices.com",
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const EMAIL_LOCAL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const QA_ENVELOPE_FIELDS = new Set([
  "to",
  "cc",
  "bcc",
  "replyTo",
  "reply_to",
]);
const QA_OMITTED_FIELDS = new Set([
  "headers",
  "tags",
  "__proto__",
  "prototype",
  "constructor",
]);

const CONFIGURATION_FAILURE = Object.freeze({
  status: 503,
  message: "Email service is not configured.",
});

const DELIVERY_FAILURE = Object.freeze({
  status: 502,
  message: "Email delivery failed.",
});

export class ResendConfigurationError extends Error {
  constructor() {
    super(CONFIGURATION_FAILURE.message);
    this.name = "ResendConfigurationError";
  }
}

export class ResendDeliveryError extends Error {
  constructor() {
    super(DELIVERY_FAILURE.message);
    this.name = "ResendDeliveryError";
  }
}

function isPresent(name) {
  return typeof process.env[name] !== "undefined";
}

function validQaDomain(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 253 ||
    value !== value.toLowerCase() ||
    /[\s\u0000-\u001f\u007f]/.test(value) ||
    value.includes("://") ||
    value.includes("/") ||
    value.includes(":") ||
    value.includes("*") ||
    value.startsWith(".") ||
    value.endsWith(".") ||
    [...FORBIDDEN_QA_DOMAINS].some(
      (forbidden) => value === forbidden || value.endsWith(`.${forbidden}`)
    )
  ) {
    return false;
  }

  const labels = value.split(".");
  return labels.length >= 2 && labels.every((label) => DOMAIN_LABEL_PATTERN.test(label));
}

function validQaRecipient(value, allowedDomain) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 254 ||
    /[\s\u0000-\u001f\u007f,;*<>"()[\]\\]/.test(value) ||
    value.includes("://") ||
    value.includes("/")
  ) {
    return false;
  }

  const parts = value.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  return (
    localPart.length > 0 &&
    localPart.length <= 64 &&
    !localPart.startsWith(".") &&
    !localPart.endsWith(".") &&
    !localPart.includes("..") &&
    EMAIL_LOCAL_PATTERN.test(localPart) &&
    domain === allowedDomain
  );
}

function getDeliveryConfiguration() {
  const mode = process.env.EMAIL_DELIVERY_MODE;
  const hasQaRecipient = isPresent("QA_EMAIL_OVERRIDE");
  const hasQaDomain = isPresent("QA_EMAIL_ALLOWED_DOMAIN");

  if (mode === DELIVERY_MODES.PRODUCTION) {
    if (hasQaRecipient || hasQaDomain) throw new ResendConfigurationError();
    return { mode, qaRecipient: null };
  }

  if (mode !== DELIVERY_MODES.QA || !hasQaRecipient || !hasQaDomain) {
    throw new ResendConfigurationError();
  }

  const qaRecipient = process.env.QA_EMAIL_OVERRIDE;
  const qaDomain = process.env.QA_EMAIL_ALLOWED_DOMAIN;

  if (!validQaDomain(qaDomain) || !validQaRecipient(qaRecipient, qaDomain)) {
    throw new ResendConfigurationError();
  }

  return { mode, qaRecipient };
}

function qaContainedMessage(message, qaRecipient) {
  const messageFields = Reflect.ownKeys(message);
  const contained = Object.create(null);

  for (const field of messageFields) {
    if (
      typeof field !== "string" ||
      QA_ENVELOPE_FIELDS.has(field) ||
      QA_OMITTED_FIELDS.has(field)
    ) {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(message, field);
    if (descriptor?.enumerable) contained[field] = message[field];
  }

  contained.to = qaRecipient;

  for (const field of ["cc", "bcc", "replyTo", "reply_to"]) {
    if (messageFields.includes(field)) contained[field] = qaRecipient;
  }

  return contained;
}

export function createResendClient() {
  getDeliveryConfiguration();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new ResendConfigurationError();
  return new Resend(apiKey);
}

export async function sendRequiredEmail(client, message) {
  const delivery = getDeliveryConfiguration();
  const outboundMessage =
    delivery.mode === DELIVERY_MODES.QA
      ? qaContainedMessage(message, delivery.qaRecipient)
      : message;

  try {
    const result = await client.emails.send(outboundMessage);
    if (result?.error || !result?.data?.id) throw new ResendDeliveryError();
    return result.data;
  } catch (error) {
    if (error instanceof ResendDeliveryError) throw error;
    throw new ResendDeliveryError();
  }
}

export function getRequiredEmailFailure(error) {
  if (error instanceof ResendConfigurationError) return CONFIGURATION_FAILURE;
  if (error instanceof ResendDeliveryError) return DELIVERY_FAILURE;
  return null;
}
