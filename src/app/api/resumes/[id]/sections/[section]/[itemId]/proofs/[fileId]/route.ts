import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiError, handleApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deleteProof, isProofSection, readProof } from "@/lib/proof-storage";
import { getResume } from "@/lib/resume-service";
import { proofFileSchema } from "@/lib/schemas";
import type { ProofFile, ResumeItemData } from "@/lib/types";
import { createSupabaseSignedDownload, usesSupabaseStorage } from "@/lib/supabase-storage";
import { requireUser } from "@/lib/auth";
import { ownsResume } from "@/lib/resume-service";

type Context = { params: Promise<{ id: string; section: string; itemId: string; fileId: string }> };

async function findProof(resumeId: string, section: string, itemId: string, fileId: string) {
  if (!isProofSection(section)) return null;
  const item = await prisma.resumeItem.findFirst({ where: { id: itemId, resumeId, section } });
  if (!item) return null;
  const parsed = proofFileSchema.array().max(5).safeParse((item.data as ResumeItemData["data"]).proofFiles);
  const proofs: ProofFile[] = parsed.success ? parsed.data : [];
  const proof = proofs.find((candidate) => candidate.id === fileId);
  return proof ? { item, proof, proofs, section } : null;
}

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id, section, itemId, fileId } = await context.params;
    if (!isProofSection(section)) return apiError("증빙 파일을 지원하지 않는 섹션입니다.", "INVALID_SECTION");
    if (!await ownsResume(user.id, id)) return apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
    const found = await findProof(id, section, itemId, fileId);
    if (!found) return apiError("증빙 파일을 찾을 수 없습니다.", "NOT_FOUND", 404);
    if (usesSupabaseStorage()) {
      const signedUrl = await createSupabaseSignedDownload(`${id}/${section}/${itemId}/${fileId}`, found.proof.name);
      return NextResponse.redirect(signedUrl, 307);
    }
    const data = await readProof(id, section, itemId, fileId);
    return new NextResponse(data, {
      headers: {
        "Content-Type": found.proof.contentType,
        "Content-Length": String(data.length),
        "Content-Disposition": `attachment; filename="proof"; filename*=UTF-8''${encodeURIComponent(found.proof.name)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id, section, itemId, fileId } = await context.params;
    if (!isProofSection(section)) return apiError("증빙 파일을 지원하지 않는 섹션입니다.", "INVALID_SECTION");
    if (!await ownsResume(user.id, id)) return apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
    const found = await findProof(id, section, itemId, fileId);
    if (!found) return apiError("증빙 파일을 찾을 수 없습니다.", "NOT_FOUND", 404);

    const nextData = {
      ...(found.item.data as ResumeItemData["data"]),
      proofFiles: found.proofs.filter((proof) => proof.id !== fileId),
    };
    await prisma.$transaction([
      prisma.resumeItem.update({ where: { id: itemId }, data: { data: nextData as Prisma.InputJsonValue } }),
      prisma.resume.update({ where: { id }, data: { version: { increment: 1 } } }),
    ]);
    await deleteProof(id, section, itemId, fileId);
    const resume = await getResume(user.id, id);
    return NextResponse.json({ resume });
  } catch (error) {
    return handleApiError(error);
  }
}
