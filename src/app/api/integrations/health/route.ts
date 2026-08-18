import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    integrations: {
      schools: { configured: Boolean(process.env.PUBLIC_DATA_SERVICE_KEY), provider: "대학알리미" },
      companies: { configured: Boolean(process.env.OPEN_DART_API_KEY), provider: "OpenDART" },
    },
  });
}
