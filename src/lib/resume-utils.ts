import type { ResumeData, ResumeItemData } from "@/lib/types";

export function formatMonth(value?: unknown) {
  if (typeof value !== "string" || !value) return "";
  const [year, month, day] = value.split("-");
  return [year, month, day].filter(Boolean).join(".");
}

export function splitLines(value?: unknown) {
  if (typeof value !== "string") return [];
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function splitComma(value?: unknown) {
  if (typeof value !== "string") return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function itemsFor(resume: ResumeData, section: ResumeItemData["section"], includeHidden = false) {
  return resume.items
    .filter((item) => item.section === section && (includeHidden || item.isVisible))
    .toSorted((a, b) => a.sortOrder - b.sortOrder);
}

export function durationLabel(startValue?: unknown, endValue?: unknown, isCurrent?: unknown) {
  if (typeof startValue !== "string" || !/^\d{4}-\d{2}$/.test(startValue)) return "";
  const end = typeof endValue === "string" && /^\d{4}-\d{2}$/.test(endValue)
    ? endValue
    : isCurrent
      ? new Date().toISOString().slice(0, 7)
      : "";
  if (!end) return "";
  const [sy, sm] = startValue.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const months = Math.max(0, (ey - sy) * 12 + (em - sm) + 1);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years}년` : "", rest ? `${rest}개월` : ""].filter(Boolean).join(" ");
}

export function calculateUniqueCareerMonths(items: ResumeItemData[], today = new Date()) {
  const months = new Set<string>();
  for (const item of items.filter((candidate) => candidate.section === "experience")) {
    const start = String(item.data.startDate ?? "");
    const rawEnd = item.data.isCurrent ? today.toISOString().slice(0, 7) : String(item.data.endDate ?? "");
    if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(rawEnd)) continue;
    const [sy, sm] = start.split("-").map(Number);
    const [ey, em] = rawEnd.split("-").map(Number);
    let cursor = sy * 12 + sm - 1;
    const end = ey * 12 + em - 1;
    while (cursor <= end) {
      months.add(`${Math.floor(cursor / 12)}-${String((cursor % 12) + 1).padStart(2, "0")}`);
      cursor += 1;
    }
  }
  return months.size;
}

export function monthsToLabel(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years}년` : "", rest ? `${rest}개월` : ""].filter(Boolean).join(" ") || "0개월";
}
