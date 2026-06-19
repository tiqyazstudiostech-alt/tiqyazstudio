import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.user.count();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[health] db ping failed:", error);
    return NextResponse.json(
      { status: "error", message: "database unreachable" },
      { status: 503 },
    );
  }
}
