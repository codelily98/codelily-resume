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

export function classifyDatabaseError(error: unknown) {
  if (!(error instanceof Error)) return null;
  const details = error as Error & { code?: unknown; errorCode?: unknown };
  const code = typeof details.code === "string"
    ? details.code
    : typeof details.errorCode === "string"
      ? details.errorCode
      : "";

  const codes: Record<string, string> = {
    P1000: "DATABASE_CREDENTIALS_INVALID",
    P1001: "DATABASE_UNREACHABLE",
    P1002: "DATABASE_TIMEOUT",
    P1003: "DATABASE_NOT_FOUND",
    P1013: "DATABASE_URL_INVALID",
    P2021: "DATABASE_SCHEMA_MISSING",
    P2022: "DATABASE_SCHEMA_MISSING",
  };
  if (codes[code]) return codes[code];

  const message = error.message.toLowerCase();
  if (/(authentication failed|password authentication failed|credentials.*not valid)/.test(message)) {
    return "DATABASE_CREDENTIALS_INVALID";
  }
  if (/(tenant or user not found|invalid user|unknown user)/.test(message)) return "DATABASE_POOLER_USER_INVALID";
  if (/(can't reach database server|econnrefused|enotfound|network is unreachable)/.test(message)) {
    return "DATABASE_UNREACHABLE";
  }
  if (/(timed out|timeout)/.test(message)) return "DATABASE_TIMEOUT";
  if (/(database .* does not exist|database .* not found)/.test(message)) return "DATABASE_NOT_FOUND";
  if (/(invalid.*(url|connection string)|empty host|invalid port)/.test(message)) return "DATABASE_URL_INVALID";
  if (/(prepared statement .* already exists|pgbouncer)/.test(message)) return "DATABASE_POOLER_MODE_INVALID";
  if (/(table .* does not exist|column .* does not exist)/.test(message)) return "DATABASE_SCHEMA_MISSING";
  return null;
}

function databaseErrorResponse(error: unknown) {
  const code = classifyDatabaseError(error);
  if (!code) return null;

  const messages: Record<string, string> = {
    DATABASE_CREDENTIALS_INVALID: "데이터베이스 계정 정보가 올바르지 않습니다.",
    DATABASE_POOLER_USER_INVALID: "데이터베이스 Pooler 사용자 정보가 올바르지 않습니다.",
    DATABASE_UNREACHABLE: "데이터베이스 서버에 연결할 수 없습니다.",
    DATABASE_TIMEOUT: "데이터베이스 연결 시간이 초과되었습니다.",
    DATABASE_NOT_FOUND: "설정된 데이터베이스를 찾을 수 없습니다.",
    DATABASE_URL_INVALID: "데이터베이스 연결 문자열 형식이 올바르지 않습니다.",
    DATABASE_POOLER_MODE_INVALID: "서버리스용 데이터베이스 Pooler 설정이 필요합니다.",
    DATABASE_SCHEMA_MISSING: "데이터베이스 스키마가 준비되지 않았습니다.",
  };

  return apiError(messages[code] ?? "데이터베이스 연결을 확인해 주세요.", code, 503);
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
