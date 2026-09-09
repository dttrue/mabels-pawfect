"use client";

const LARGE_UPLOAD_THRESHOLD = 20 * 1024 * 1024;
const LARGE_UPLOAD_CHUNK_BYTES = 20 * 1024 * 1024;

function appendSignedFields(form, authorization) {
  for (const [key, value] of Object.entries(authorization.uploadParams || {})) {
    form.append(key, String(value));
  }
  form.append("api_key", authorization.apiKey);
  form.append("signature", authorization.signature);
}

async function readUploadResponse(response) {
  const uploaded = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error("Cloudinary upload failed");
  }
  return uploaded;
}

async function directUpload(file, authorization) {
  const form = new FormData();
  form.append("file", file);
  appendSignedFields(form, authorization);

  return readUploadResponse(
    await fetch(authorization.uploadUrl, {
      method: "POST",
      body: form,
    })
  );
}

async function directChunkedUpload(file, authorization) {
  let uploaded;

  for (let start = 0; start < file.size; start += LARGE_UPLOAD_CHUNK_BYTES) {
    const end = Math.min(start + LARGE_UPLOAD_CHUNK_BYTES, file.size);
    const isLast = end === file.size;
    const form = new FormData();
    form.append("file", file.slice(start, end), file.name);
    appendSignedFields(form, authorization);

    uploaded = await readUploadResponse(
      await fetch(authorization.uploadUrl, {
        method: "POST",
        headers: {
          "Content-Range": `bytes ${start}-${end - 1}/${isLast ? file.size : -1}`,
          "X-Unique-Upload-Id": authorization.grant.nonce,
        },
        body: form,
      })
    );
  }

  return uploaded;
}

export async function uploadAdminAsset(
  file,
  purpose,
  scope = {},
  signatureUrl = "/api/admin/cloudinary/signature"
) {
  if (!file) throw new Error("Select a file to upload");

  const signatureResponse = await fetch(signatureUrl, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose, scope }),
  });
  const authorization = await signatureResponse.json().catch(() => ({}));
  if (!signatureResponse.ok) {
    throw new Error(authorization?.error || "Upload authorization failed");
  }

  const { grant } = authorization;
  if (
    !grant ||
    file.size <= 0 ||
    file.size > grant.maxBytes ||
    !grant.acceptedMimeTypes?.includes(file.type)
  ) {
    throw new Error("The selected file does not meet the upload policy");
  }

  const uploaded =
    file.size > LARGE_UPLOAD_THRESHOLD
      ? await directChunkedUpload(file, authorization)
      : await directUpload(file, authorization);
  if (
    !uploaded?.public_id ||
    !uploaded?.version ||
    !uploaded?.signature
  ) {
    throw new Error("Cloudinary upload failed");
  }

  return {
    proof: {
      grant: authorization.grant,
      grantSignature: authorization.grantSignature,
      publicId: uploaded.public_id,
      version: uploaded.version,
      responseSignature: uploaded.signature,
    },
    previewUrl: uploaded.secure_url || "",
  };
}
