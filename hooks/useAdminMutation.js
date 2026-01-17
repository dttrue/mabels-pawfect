// hooks/useAdminMutation.js
"use client";

import { useState } from "react";

export function useAdminMutation() {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function run(fn) {
    setSaving(true);
    setErr("");
    try {
      return await fn();
    } catch (e) {
      setErr(e?.message || "Request failed");
      throw e;
    } finally {
      setSaving(false);
    }
  }

  return { saving, err, setErr, run };
}
