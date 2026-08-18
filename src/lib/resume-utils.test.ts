import { describe, expect, it } from "vitest";
import { calculateUniqueCareerMonths, durationLabel, formatMonth, monthsToLabel } from "@/lib/resume-utils";
import type { ResumeItemData } from "@/lib/types";

function experience(id: string, startDate: string, endDate: string): ResumeItemData {
  return { id, section: "experience", sortOrder: 0, isVisible: true, data: { startDate, endDate, isCurrent: false } };
}

describe("career duration", () => {
  it("prints day-level dates when they are available", () => {
    expect(formatMonth("2026-08-18")).toBe("2026.08.18");
    expect(formatMonth("2026-08")).toBe("2026.08");
  });

  it("formats a month range inclusively", () => {
    expect(durationLabel("2024-01", "2024-12", false)).toBe("1년");
    expect(durationLabel("2024-01", "2025-03", false)).toBe("1년 3개월");
  });

  it("removes overlapping months from total career", () => {
    const months = calculateUniqueCareerMonths([
      experience("a", "2024-01", "2024-12"),
      experience("b", "2024-07", "2025-06"),
    ]);
    expect(months).toBe(18);
    expect(monthsToLabel(months)).toBe("1년 6개월");
  });
});
