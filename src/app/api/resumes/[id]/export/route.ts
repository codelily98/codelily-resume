import { apiError, handleApiError } from "@/lib/api";
import { getResume } from "@/lib/resume-service";
import { readStoredPhoto } from "@/lib/photo-storage";
import { isProofSection, readProof } from "@/lib/proof-storage";
import { proofFileSchema } from "@/lib/schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resume = await getResume(id);
    if (!resume) return apiError("이력서를 찾을 수 없습니다.", "NOT_FOUND", 404);
    const photo = await readStoredPhoto(id);
    const proofs: Array<{ section: "training" | "certifications"; sortOrder: number; fileId: string; data: string }> = [];
    for (const item of resume.items) {
      if (!isProofSection(item.section)) continue;
      const parsed = proofFileSchema.array().max(5).safeParse(item.data.proofFiles);
      if (!parsed.success) continue;
      for (const file of parsed.data) {
        try {
          const data = await readProof(id, item.section, item.id, file.id);
          proofs.push({ section: item.section, sortOrder: item.sortOrder, fileId: file.id, data: data.toString("base64") });
        } catch {
          // Keep the rest of the backup usable if a local asset is already missing.
        }
      }
    }
    const safeTitle = resume.title.replace(/[^0-9A-Za-z가-힣_-]+/g, "-").slice(0, 60) || "resume";
    return new Response(JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      resume,
      assets: photo || proofs.length ? {
        ...(photo ? { photo: { contentType: photo.contentType, data: photo.data.toString("base64") } } : {}),
        ...(proofs.length ? { proofs } : {}),
      } : undefined,
    }, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${safeTitle}.json`)}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
