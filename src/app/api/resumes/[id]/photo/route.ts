import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { apiError, handleApiError } from "@/lib/api";
import { deleteStoredPhoto } from "@/lib/photo-storage";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 5 * 1024 * 1024;

function detectImage(buffer: Buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { extension: "jpg", contentType: "image/jpeg" };
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: "png", contentType: "image/png" };
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return { extension: "webp", contentType: "image/webp" };
  return null;
}

function uploadDirectory(id: string) {
  return path.join(process.cwd(), "data", "uploads", id);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const exists = await prisma.resume.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
    const formData = await request.formData();
    const file = formData.get("photo");
    if (!(file instanceof File)) return apiError("사진 파일을 선택해 주세요.", "MISSING_FILE");
    if (file.size > MAX_SIZE) return apiError("사진은 5MB 이하만 업로드할 수 있습니다.", "FILE_TOO_LARGE");
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = detectImage(buffer);
    if (!image) return apiError("JPEG, PNG, WebP 사진만 사용할 수 있습니다.", "INVALID_FILE_TYPE");
    const directory = uploadDirectory(id);
    await mkdir(directory, { recursive: true });
    await Promise.all(["jpg", "png", "webp"].map((extension) => rm(path.join(directory, `profile.${extension}`), { force: true })));
    await writeFile(path.join(directory, `profile.${image.extension}`), buffer);
    const photoPath = `/api/resumes/${id}/photo?v=${Date.now()}`;
    await prisma.profile.update({ where: { resumeId: id }, data: { photoPath } });
    return NextResponse.json({ photoPath });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await prisma.profile.findUnique({ where: { resumeId: id }, select: { photoPath: true } });
    if (!profile?.photoPath) return new NextResponse(null, { status: 404 });
    for (const candidate of [
      { extension: "jpg", contentType: "image/jpeg" },
      { extension: "png", contentType: "image/png" },
      { extension: "webp", contentType: "image/webp" },
    ]) {
      try {
        const data = await readFile(path.join(uploadDirectory(id), `profile.${candidate.extension}`));
        return new NextResponse(data, { headers: { "Content-Type": candidate.contentType, "Cache-Control": "private, max-age=3600" } });
      } catch {
        // Try the next supported format.
      }
    }
    return new NextResponse(null, { status: 404 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteStoredPhoto(id);
    await prisma.profile.update({ where: { resumeId: id }, data: { photoPath: "" } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
