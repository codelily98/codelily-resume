import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiError, handleApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  deleteProof,
  deleteProofDirectory,
  isProofSection,
  MAX_PROOFS,
  storeProof,
  validateProof,
} from "@/lib/proof-storage";
import { getResume } from "@/lib/resume-service";
import { proofFileSchema } from "@/lib/schemas";
import type { ProofFile, ResumeItemData } from "@/lib/types";

type Context = { params: Promise<{ id: string; section: string; itemId: string }> };

function getStoredProofs(data: ResumeItemData["data"]): ProofFile[] {
  const parsed = proofFileSchema.array().max(MAX_PROOFS).safeParse(data.proofFiles);
  return parsed.success ? parsed.data : [];
}

export async function POST(request: Request, context: Context) {
  const storedFileIds: string[] = [];
  let resumeId = "";
  let itemId = "";
  let proofSection: "training" | "certifications" | null = null;

  try {
    const { id, section, itemId: routeItemId } = await context.params;
    if (!isProofSection(section)) return apiError("증빙 파일을 지원하지 않는 섹션입니다.", "INVALID_SECTION");
    resumeId = id;
    itemId = routeItemId;
    proofSection = section;

    const item = await prisma.resumeItem.findFirst({ where: { id: itemId, resumeId, section } });
    if (!item) return apiError("항목을 찾을 수 없습니다.", "NOT_FOUND", 404);

    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);
    if (files.length === 0) return apiError("첨부할 증빙 파일을 선택해 주세요.", "MISSING_FILE");

    const currentProofs = getStoredProofs(item.data as ResumeItemData["data"]);
    if (currentProofs.length + files.length > MAX_PROOFS) {
      return apiError("증빙 파일은 항목마다 최대 5개까지 첨부할 수 있습니다.", "TOO_MANY_FILES");
    }

    for (const file of files) {
      const validationMessage = validateProof(file);
      if (validationMessage) return apiError(validationMessage, "INVALID_FILE");
    }

    const addedProofs: ProofFile[] = [];
    for (const file of files) {
      const fileId = randomUUID();
      await storeProof(resumeId, section, itemId, fileId, Buffer.from(await file.arrayBuffer()));
      storedFileIds.push(fileId);
      addedProofs.push({
        id: fileId,
        name: file.name.slice(0, 255),
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    }

    const nextData = { ...(item.data as ResumeItemData["data"]), proofFiles: [...currentProofs, ...addedProofs] };
    await prisma.$transaction([
      prisma.resumeItem.update({ where: { id: itemId }, data: { data: nextData as Prisma.InputJsonValue } }),
      prisma.resume.update({ where: { id: resumeId }, data: { version: { increment: 1 } } }),
    ]);
    const resume = await getResume(resumeId);
    return NextResponse.json({ resume });
  } catch (error) {
    if (proofSection) {
      const sectionToClean = proofSection;
      await Promise.all(storedFileIds.map((fileId) => deleteProof(resumeId, sectionToClean, itemId, fileId)));
    }
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id, section, itemId } = await context.params;
    if (!isProofSection(section)) return apiError("증빙 파일을 지원하지 않는 섹션입니다.", "INVALID_SECTION");
    const item = await prisma.resumeItem.findFirst({ where: { id: itemId, resumeId: id, section } });
    if (!item) return apiError("항목을 찾을 수 없습니다.", "NOT_FOUND", 404);
    await deleteProofDirectory(id, section, itemId);
    const nextData = { ...(item.data as ResumeItemData["data"]), proofFiles: [] };
    await prisma.$transaction([
      prisma.resumeItem.update({ where: { id: itemId }, data: { data: nextData as Prisma.InputJsonValue } }),
      prisma.resume.update({ where: { id }, data: { version: { increment: 1 } } }),
    ]);
    const resume = await getResume(id);
    return NextResponse.json({ resume });
  } catch (error) {
    return handleApiError(error);
  }
}
