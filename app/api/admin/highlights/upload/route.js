import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  AdminUploadError,
  issueAdminUploadGrant,
} from "@/lib/adminCloudinaryUpload";

export const runtime = "nodejs";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  try {
    return NextResponse.json(await issueAdminUploadGrant("highlight-video"));
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Highlight upload authorization failed");
    return NextResponse.json(
      { error: "Upload authorization failed" },
      { status: 500 }
    );
  }
}
