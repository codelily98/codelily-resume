import { describe, expect, it } from "vitest";
import { validateSectionData } from "@/lib/validation";

describe("section validation", () => {
  it("requires the section title field", () => {
    expect(validateSectionData("education", { schoolName: "" })[0]).toContain("학교명");
  });

  it("rejects an end date before a start date", () => {
    expect(validateSectionData("experience", { companyName: "예시", startDate: "2025-02", endDate: "2024-12" })).toContain("종료일은 시작일보다 빠를 수 없습니다.");
  });

  it("rejects a certification expiry date before its acquired date", () => {
    expect(validateSectionData("certifications", { name: "예시 자격증", acquiredDate: "2026-08-18", expiresDate: "2026-08-17" })).toContain("종료일은 시작일보다 빠를 수 없습니다.");
  });

  it("rejects a grade larger than its scale", () => {
    expect(validateSectionData("education", { schoolName: "예시대학교", grade: "4.6", gradeScale: "4.5" })).toContain("취득 학점은 만점을 초과할 수 없습니다.");
  });

  it("allows empty optional links but rejects unsafe protocols", () => {
    expect(validateSectionData("portfolio", { title: "작품", url: "" })).toHaveLength(0);
    expect(validateSectionData("portfolio", { title: "작품", url: "javascript:alert(1)" })).toContain("링크는 http:// 또는 https://로 시작해야 합니다.");
  });
});
