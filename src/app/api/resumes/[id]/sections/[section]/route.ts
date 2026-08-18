import { NextResponse } from "next/server";
import { apiError, handleApiError } from "@/lib/api";
import { replaceSection } from "@/lib/resume-service";
import { SECTION_ORDER, type EditableSectionKey } from "@/lib/sections";
import { sectionReplaceSchema } from "@/lib/schemas";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; section: string }> }) {
  try {
    const { id, section } = await params;
    if (section === "profile" || !SECTION_ORDER.includes(section as never)) {
      return apiError("지원하지 않는 섹션입니다.", "INVALID_SECTION");
    }
    const parsed = sectionReplaceSchema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.", "VALIDATION_ERROR");
    const resume = await replaceSection(id, section as EditableSectionKey, parsed.data.items);
    return resume ? NextResponse.json({ resume }) : apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
  } catch (error) {
    return handleApiError(error);
  }
}
