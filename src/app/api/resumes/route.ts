import { NextResponse } from "next/server";
import { apiError, handleApiError } from "@/lib/api";
import { createResume, listResumes } from "@/lib/resume-service";
import { resumeCreateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ resumes: await listResumes() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = resumeCreateSchema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.", "VALIDATION_ERROR");
    return NextResponse.json({ resume: await createResume(parsed.data.title) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
