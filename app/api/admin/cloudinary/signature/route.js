import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  AdminUploadError,
  issueAdminUploadGrant,
  readSmallJson,
} from "@/lib/adminCloudinaryUpload";

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
    const { purpose, scope } = await readSmallJson(req, 4 * 1024);
    return NextResponse.json(await issueAdminUploadGrant(purpose, scope));
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Cloudinary upload authorization failed");
    return NextResponse.json(
      { error: "Upload authorization failed" },
      { status: 500 }
    );
  }
}
