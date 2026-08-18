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

function databaseErrorResponse(error: unknown) {
  if (!(error instanceof Error)) return null;
  const details = error as Error & { code?: unknown; errorCode?: unknown };
  const code = typeof details.code === "string"
    ? details.code
    : typeof details.errorCode === "string"
      ? details.errorCode
      : "";

  const errors: Record<string, { message: string; code: string }> = {
    P1000: { message: "데이터베이스 계정 정보가 올바르지 않습니다.", code: "DATABASE_CREDENTIALS_INVALID" },
    P1001: { message: "데이터베이스 서버에 연결할 수 없습니다.", code: "DATABASE_UNREACHABLE" },
    P1002: { message: "데이터베이스 연결 시간이 초과되었습니다.", code: "DATABASE_TIMEOUT" },
    P1003: { message: "설정된 데이터베이스를 찾을 수 없습니다.", code: "DATABASE_NOT_FOUND" },
    P1013: { message: "데이터베이스 연결 문자열 형식이 올바르지 않습니다.", code: "DATABASE_URL_INVALID" },
    P2021: { message: "데이터베이스 테이블이 준비되지 않았습니다.", code: "DATABASE_SCHEMA_MISSING" },
    P2022: { message: "데이터베이스 컬럼이 준비되지 않았습니다.", code: "DATABASE_SCHEMA_MISSING" },
  };

  const mapped = errors[code];
  return mapped ? apiError(mapped.message, mapped.code, 503) : null;
}

export function handleApiError(error: unknown) {
  if (error instanceof Error && error.message === "VERSION_CONFLICT") {
    return apiError("다른 저장이 먼저 완료되었습니다. 최신 내용을 불러온 뒤 다시 시도해 주세요.", "VERSION_CONFLICT", 409);
  }
  logServerError(error);
  const databaseResponse = databaseErrorResponse(error);
  if (databaseResponse) return databaseResponse;
  return apiError("요청을 처리하지 못했습니다.", "INTERNAL_ERROR", 500);
}
