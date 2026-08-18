import { NextResponse } from "next/server";
import { apiError, handleApiError } from "@/lib/api";
import { duplicateResume } from "@/lib/resume-service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resume = await duplicateResume(id);
    return resume ? NextResponse.json({ resume }, { status: 201 }) : apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
  } catch (error) {
    return handleApiError(error);
  }
}
