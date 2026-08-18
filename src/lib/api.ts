import { NextResponse } from "next/server";

export function apiError(message: string, code: string, status = 400) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof Error && error.message === "VERSION_CONFLICT") {
    return apiError("다른 저장이 먼저 완료되었습니다. 최신 내용을 불러온 뒤 다시 시도해 주세요.", "VERSION_CONFLICT", 409);
  }
  return apiError("요청을 처리하지 못했습니다.", "INTERNAL_ERROR", 500);
}
