import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";

type Company = { name: string; externalId: string; stockCode: string };
let companyCache: Company[] | null = null;
const parser = new XMLParser();

async function getCompanies(key: string) {
  if (companyCache) return companyCache;
  const response = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${encodeURIComponent(key)}`, {
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("UPSTREAM_ERROR");
  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const entry = zip.file(/CORPCODE\.xml/i)[0];
  if (!entry) throw new Error("INVALID_ARCHIVE");
  const parsed = parser.parse(await entry.async("string")) as { result?: { list?: Array<Record<string, string>> } };
  const rows = parsed.result?.list ?? [];
  companyCache = rows.map((row) => ({ name: row.corp_name, externalId: row.corp_code, stockCode: row.stock_code ?? "" }));
  return companyCache;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const key = process.env.OPEN_DART_API_KEY;
  if (query.length < 2) return NextResponse.json({ configured: Boolean(key), results: [] });
  if (!key) return NextResponse.json({ configured: false, results: [], message: "API 키가 없어 직접 입력 모드로 동작합니다." });
  try {
    const companies = await getCompanies(key);
    const lowered = query.toLocaleLowerCase("ko-KR");
    const results = companies
      .filter((company) => company.name.toLocaleLowerCase("ko-KR").includes(lowered))
      .slice(0, 10)
      .map((company) => ({ provider: "OpenDART", externalId: company.externalId, name: company.name, metadata: { stockCode: company.stockCode } }));
    return NextResponse.json({ configured: true, results });
  } catch {
    return NextResponse.json({ configured: true, results: [], message: "회사 검색에 실패했습니다. 직접 입력을 계속할 수 있습니다." });
  }
}
