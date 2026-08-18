import { SECTION_DEFINITIONS, type EditableSectionKey } from "@/lib/sections";

export function validateSectionData(section: EditableSectionKey, data: Record<string, unknown>) {
  const errors: string[] = [];
  const titleField = SECTION_DEFINITIONS[section].titleField;
  if (!String(data[titleField] ?? "").trim()) errors.push(`${SECTION_DEFINITIONS[section].fields.find((field) => field.key === titleField)?.label ?? "제목"}을 입력해 주세요.`);

  const start = String(section === "certifications" ? data.acquiredDate ?? "" : data.startDate ?? "");
  const end = String(section === "certifications" ? data.expiresDate ?? "" : data.endDate ?? "");
  if (start && end && start > end) errors.push("종료일은 시작일보다 빠를 수 없습니다.");

  if (section === "education") {
    const grade = Number(data.grade || 0);
    const scale = Number(data.gradeScale || 0);
    if (grade < 0 || scale < 0) errors.push("학점은 양수여야 합니다.");
    if (grade && scale && grade > scale) errors.push("취득 학점은 만점을 초과할 수 없습니다.");
  }

  for (const [key, value] of Object.entries(data)) {
    if (!value || typeof value !== "string") continue;
    if (/url$/i.test(key) && !/^https?:\/\/[^\s]+$/i.test(value)) errors.push("링크는 http:// 또는 https://로 시작해야 합니다.");
  }
  return errors;
}
