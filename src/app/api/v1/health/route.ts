import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    apiVersion: "v1",
    time: new Date().toISOString(),
  });
}
