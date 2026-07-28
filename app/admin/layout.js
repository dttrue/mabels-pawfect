// app/admin1313/layout.js

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";

export default async function Admin1313Layout({ children }) {
  const admin = await requireAdmin();

  if (admin.reason === "SIGNED_OUT") {
    redirect("/sign-in?redirect_url=/admin1313");
  }

  if (!admin.authorized) {
    redirect("/not-authorized");
  }

  return children;
}
