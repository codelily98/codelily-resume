import { NextResponse } from "next/server";
import { apiError, handleApiError } from "@/lib/api";
import { deleteStoredPhoto, readStoredPhoto, storePhoto } from "@/lib/photo-storage";
import { prisma } from "@/lib/prisma";
import {
  createSupabaseSignedDownload,
  createSupabaseSignedUpload,
  downloadSupabaseObject,
  usesSupabaseStorage,
} from "@/lib/supabase-storage";
import { requireUser } from "@/lib/auth";
import { ownsResume } from "@/lib/resume-service";

const MAX_SIZE = 5 * 1024 * 1024;

function detectImage(buffer: Buffer): { extension: "jpg" | "png" | "webp"; contentType: string } | null {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { extension: "jpg", contentType: "image/jpeg" };
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: "png", contentType: "image/png" };
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return { extension: "webp", contentType: "image/webp" };
  return null;
}

function imageFromContentType(contentType: string) {
  if (contentType === "image/jpeg") return { extension: "jpg" as const, contentType };
  if (contentType === "image/png") return { extension: "png" as const, contentType };
  if (contentType === "image/webp") return { extension: "webp" as const, contentType };
  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!await ownsResume(user.id, id)) return apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);

    if (request.headers.get("content-type")?.includes("application/json")) {
      const input = await request.json() as { action?: string; contentType?: string; size?: number };
      if (input.action === "prepare") {
        if (!usesSupabaseStorage()) return NextResponse.json({ mode: "local" });
        const image = imageFromContentType(input.contentType ?? "");
        if (!image) return apiError("JPEG, PNG, WebP 사진만 사용할 수 있습니다.", "INVALID_FILE_TYPE");
        if (!Number.isFinite(input.size) || !input.size || input.size < 1 || input.size > MAX_SIZE) {
          return apiError("사진은 5MB 이하만 업로드할 수 있습니다.", "FILE_TOO_LARGE");
        }
        const objectPath = `${id}/profile.${image.extension}`;
        const upload = await createSupabaseSignedUpload(objectPath);
        return NextResponse.json({ mode: "direct", ...upload, extension: image.extension });
      }
      if (input.action === "complete" && usesSupabaseStorage()) {
        const image = imageFromContentType(input.contentType ?? "");
        if (!image) return apiError("JPEG, PNG, WebP 사진만 사용할 수 있습니다.", "INVALID_FILE_TYPE");
        const objectPath = `${id}/profile.${image.extension}`;
        const data = await downloadSupabaseObject(objectPath);
        const detected = data ? detectImage(data) : null;
        if (!data || data.length > MAX_SIZE || !detected || detected.extension !== image.extension) {
          await deleteStoredPhoto(id);
          return apiError("올바른 JPEG, PNG, WebP 사진인지 확인해 주세요.", "INVALID_FILE_TYPE");
        }
        await deleteStoredPhoto(id, image.extension);
        const photoPath = `/api/resumes/${id}/photo?type=${image.extension}&v=${Date.now()}`;
        await prisma.profile.update({ where: { resumeId: id }, data: { photoPath } });
        return NextResponse.json({ photoPath });
      }
      return apiError("지원하지 않는 업로드 요청입니다.", "INVALID_UPLOAD");
    }

    const formData = await request.formData();
    const file = formData.get("photo");
    if (!(file instanceof File)) return apiError("사진 파일을 선택해 주세요.", "MISSING_FILE");
    if (file.size > MAX_SIZE) return apiError("사진은 5MB 이하만 업로드할 수 있습니다.", "FILE_TOO_LARGE");
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = detectImage(buffer);
    if (!image) return apiError("JPEG, PNG, WebP 사진만 사용할 수 있습니다.", "INVALID_FILE_TYPE");
    await storePhoto(id, image.extension, buffer);
    const photoPath = `/api/resumes/${id}/photo?v=${Date.now()}`;
    await prisma.profile.update({ where: { resumeId: id }, data: { photoPath } });
    return NextResponse.json({ photoPath });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!await ownsResume(user.id, id)) return new NextResponse(null, { status: 404 });
    const profile = await prisma.profile.findUnique({ where: { resumeId: id }, select: { photoPath: true } });
    if (!profile?.photoPath) return new NextResponse(null, { status: 404 });
    const type = new URL(request.url).searchParams.get("type");
    if (usesSupabaseStorage() && (type === "jpg" || type === "png" || type === "webp")) {
      const signedUrl = await createSupabaseSignedDownload(`${id}/profile.${type}`);
      return NextResponse.redirect(signedUrl, 307);
    }
    const photo = await readStoredPhoto(id);
    if (!photo) return new NextResponse(null, { status: 404 });
    return new NextResponse(photo.data, { headers: { "Content-Type": photo.contentType, "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!await ownsResume(user.id, id)) return apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
    await deleteStoredPhoto(id);
    await prisma.profile.update({ where: { resumeId: id }, data: { photoPath: "" } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
