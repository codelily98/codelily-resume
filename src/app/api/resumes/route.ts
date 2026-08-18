import { NextResponse } from "next/server";
import { apiError, handleApiError } from "@/lib/api";
import { createResume, listResumes } from "@/lib/resume-service";
import { resumeCreateSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ resumes: await listResumes(user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = resumeCreateSchema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.", "VALIDATION_ERROR");
    return NextResponse.json({ resume: await createResume(user.id, parsed.data.title) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
