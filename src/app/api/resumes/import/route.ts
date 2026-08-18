import { NextResponse } from "next/server";
import { apiError, handleApiError } from "@/lib/api";
import { importResume } from "@/lib/resume-service";
import { importSchema } from "@/lib/schemas";
import type { ResumeData } from "@/lib/types";
import { storePhoto } from "@/lib/photo-storage";
import { prisma } from "@/lib/prisma";
import { isProofSection, storeProof } from "@/lib/proof-storage";

export async function POST(request: Request) {
  try {
    const parsed = importSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("지원하지 않거나 손상된 백업 파일입니다.", "INVALID_BACKUP");
    const resume = await importResume(parsed.data.resume as unknown as Omit<ResumeData, "id" | "createdAt" | "updatedAt" | "version" | "lastPrintedAt">);
    const photo = parsed.data.assets?.photo;
    if (photo) {
      const extension = photo.contentType === "image/jpeg" ? "jpg" : photo.contentType === "image/png" ? "png" : "webp";
      await storePhoto(resume.id, extension, Buffer.from(photo.data, "base64"));
      await prisma.profile.update({ where: { resumeId: resume.id }, data: { photoPath: `/api/resumes/${resume.id}/photo?v=${Date.now()}` } });
      resume.profile.photoPath = `/api/resumes/${resume.id}/photo`;
    }
    for (const proof of parsed.data.assets?.proofs ?? []) {
      const item = resume.items.find((candidate) => candidate.section === proof.section && candidate.sortOrder === proof.sortOrder);
      if (!item || !isProofSection(item.section)) continue;
      const hasMetadata = Array.isArray(item.data.proofFiles) && item.data.proofFiles.some((file) => file.id === proof.fileId);
      if (!hasMetadata) continue;
      await storeProof(resume.id, item.section, item.id, proof.fileId, Buffer.from(proof.data, "base64"));
    }
    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
