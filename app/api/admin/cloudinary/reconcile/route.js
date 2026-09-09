import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminUploadError, readSmallJson } from "@/lib/adminCloudinaryUpload";
import { reconcileAdminUploads } from "@/lib/adminUploadReconciliation";
import { reconcileExpiredMemorialUploadReservations } from "@/lib/memorialUpload";

export const runtime = "nodejs";

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  try {
    const body = await readSmallJson(req, 4 * 1024);
    const limit = Number.parseInt(String(body?.limit || "50"), 10);
    const [reconciliation, memorialReconciliation] = await Promise.all([
      reconcileAdminUploads({ limit }),
      reconcileExpiredMemorialUploadReservations({ limit }),
    ]);
    return NextResponse.json({ reconciliation, memorialReconciliation });
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Administrative upload reconciliation failed");
    return NextResponse.json(
      { error: "Upload reconciliation failed" },
      { status: 500 }
    );
  }
}
