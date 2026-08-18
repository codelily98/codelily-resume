import { NextResponse } from "next/server";
import { rm } from "node:fs/promises";
import { apiError, handleApiError } from "@/lib/api";
import { deleteResume, getResume, updateResume } from "@/lib/resume-service";
import { resumePatchSchema } from "@/lib/schemas";
import { photoDirectory } from "@/lib/photo-storage";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const resume = await getResume(id);
    return resume ? NextResponse.json({ resume }) : apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const parsed = resumePatchSchema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.", "VALIDATION_ERROR");
    const resume = await updateResume(id, parsed.data);
    return resume ? NextResponse.json({ resume }) : apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const deleted = await deleteResume(id);
    if (deleted) await rm(photoDirectory(id), { recursive: true, force: true });
    return deleted ? new NextResponse(null, { status: 204 }) : apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
  } catch (error) {
    return handleApiError(error);
  }
}
