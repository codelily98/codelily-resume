import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function hasValidDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) return false;
  try {
    const url = new URL(value);
    return ["postgres:", "postgresql:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function safeErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "UNKNOWN";
  const details = error as Error & { code?: unknown; errorCode?: unknown };
  if (typeof details.code === "string") return details.code;
  if (typeof details.errorCode === "string") return details.errorCode;
  return error.name || "UNKNOWN";
}

export async function GET() {
  const database = {
    configured: Boolean(process.env.DATABASE_URL),
    valid: hasValidDatabaseUrl(),
    connected: false,
    errorCode: null as string | null,
  };

  if (database.valid) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database.connected = true;
    } catch (error) {
      database.errorCode = safeErrorCode(error);
    }
  } else if (database.configured) {
    database.errorCode = "DATABASE_URL_INVALID";
  }

  return NextResponse.json({
    database,
    storage: {
      configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY),
      bucketConfigured: process.env.SUPABASE_STORAGE_BUCKET === "resume-assets",
    },
    integrations: {
      schools: { configured: Boolean(process.env.PUBLIC_DATA_SERVICE_KEY), provider: "대학알리미" },
      companies: { configured: Boolean(process.env.OPEN_DART_API_KEY), provider: "OpenDART" },
    },
  }, { status: database.connected ? 200 : 503 });
}
