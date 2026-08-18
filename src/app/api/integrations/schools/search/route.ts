import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";

const parser = new XMLParser({ ignoreAttributes: false });

function collectNamedObjects(value: unknown, results: Array<{ name: string; externalId: string; metadata: Record<string, string> }>) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectNamedObjects(item, results));
    return;
  }
  const record = value as Record<string, unknown>;
  const name = record.univName ?? record.schoolName ?? record.univ_nm ?? record.name;
  if (typeof name === "string") {
    results.push({
      name,
      externalId: String(record.univCode ?? record.schoolCode ?? record.univ_cd ?? name),
      metadata: Object.fromEntries(Object.entries(record).filter(([, item]) => typeof item === "string")) as Record<string, string>,
    });
  }
  Object.values(record).forEach((item) => collectNamedObjects(item, results));
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const key = process.env.PUBLIC_DATA_SERVICE_KEY;
  if (query.length < 2) return NextResponse.json({ configured: Boolean(key), results: [] });
  if (!key) return NextResponse.json({ configured: false, results: [], message: "API 키가 없어 직접 입력 모드로 동작합니다." });
  try {
    const url = new URL("https://apis.data.go.kr/B340014/BasicInformationService_2/getNoticeUniversitySearchList");
    url.searchParams.set("serviceKey", key);
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("numOfRows", "10");
    url.searchParams.set("univName", query);
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!response.ok) throw new Error("UPSTREAM_ERROR");
    const results: Array<{ name: string; externalId: string; metadata: Record<string, string> }> = [];
    collectNamedObjects(parser.parse(await response.text()), results);
    const unique = Array.from(new Map(results.map((item) => [item.externalId, item])).values()).slice(0, 10);
    return NextResponse.json({ configured: true, results: unique.map((item) => ({ provider: "대학알리미", ...item })) });
  } catch {
    return NextResponse.json({ configured: true, results: [], message: "학교 검색에 실패했습니다. 직접 입력을 계속할 수 있습니다." });
  }
}
