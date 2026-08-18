import { NextResponse } from "next/server";

export function apiError(message: string, code: string, status = 400) {
  return NextResponse.json({ error: { message, code } }, { status });
}

function logServerError(error: unknown) {
  if (!(error instanceof Error)) {
    console.error("API request failed", { type: typeof error });
    return;
  }

  const details = error as Error & { code?: unknown; errorCode?: unknown };
  const message = error.message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[REDACTED_SUPABASE_KEY]");

  console.error("API request failed", {
    name: error.name,
    code: typeof details.code === "string" ? details.code : undefined,
    errorCode: typeof details.errorCode === "string" ? details.errorCode : undefined,
    message,
  });
}

export function handleApiError(error: unknown) {
  if (error instanceof Error && error.message === "VERSION_CONFLICT") {
    return apiError("다른 저장이 먼저 완료되었습니다. 최신 내용을 불러온 뒤 다시 시도해 주세요.", "VERSION_CONFLICT", 409);
  }
  logServerError(error);
  return apiError("요청을 처리하지 못했습니다.", "INTERNAL_ERROR", 500);
}
