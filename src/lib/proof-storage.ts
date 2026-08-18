import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const PROOF_SECTIONS = ["training", "certifications"] as const;
export type ProofSection = (typeof PROOF_SECTIONS)[number];
export const MAX_PROOFS = 5;
export const MAX_PROOF_SIZE = 10 * 1024 * 1024;

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx", ".hwp", ".hwpx"]);

export function isProofSection(value: string): value is ProofSection {
  return PROOF_SECTIONS.includes(value as ProofSection);
}

export function validateProof(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.has(extension)) return "PDF, 이미지, Word, 한글 문서만 첨부할 수 있습니다.";
  if (file.size === 0) return "내용이 없는 파일은 첨부할 수 없습니다.";
  if (file.size > MAX_PROOF_SIZE) return "증빙 파일은 개당 10MB 이하만 첨부할 수 있습니다.";
  return null;
}

function proofDirectory(resumeId: string, section: ProofSection, itemId: string) {
  return path.join(process.cwd(), "data", "uploads", resumeId, section, itemId);
}

export async function storeProof(resumeId: string, section: ProofSection, itemId: string, fileId: string, data: Buffer) {
  const directory = proofDirectory(resumeId, section, itemId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileId), data);
}

export function readProof(resumeId: string, section: ProofSection, itemId: string, fileId: string) {
  return readFile(path.join(proofDirectory(resumeId, section, itemId), fileId));
}

export function deleteProof(resumeId: string, section: ProofSection, itemId: string, fileId: string) {
  return rm(path.join(proofDirectory(resumeId, section, itemId), fileId), { force: true });
}

export function deleteProofDirectory(resumeId: string, section: ProofSection, itemId: string) {
  return rm(proofDirectory(resumeId, section, itemId), { recursive: true, force: true });
}
