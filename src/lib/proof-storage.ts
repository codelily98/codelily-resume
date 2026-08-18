import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  deleteSupabaseObjects,
  deleteSupabasePrefix,
  downloadSupabaseObject,
  uploadSupabaseObject,
  usesSupabaseStorage,
} from "@/lib/supabase-storage";

export const PROOF_SECTIONS = ["training", "certifications"] as const;
export type ProofSection = (typeof PROOF_SECTIONS)[number];
export const MAX_PROOFS = 5;
export const MAX_PROOF_SIZE = 10 * 1024 * 1024;

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx", ".hwp", ".hwpx"]);

export function isProofSection(value: string): value is ProofSection {
  return PROOF_SECTIONS.includes(value as ProofSection);
}

export function validateProof(file: File) {
  return validateProofMetadata(file.name, file.size);
}

export function validateProofMetadata(name: string, size: number) {
  const extension = path.extname(name).toLowerCase();
  if (!allowedExtensions.has(extension)) return "PDF, 이미지, Word, 한글 문서만 첨부할 수 있습니다.";
  if (!Number.isFinite(size) || size <= 0) return "내용이 없는 파일은 첨부할 수 없습니다.";
  if (size > MAX_PROOF_SIZE) return "증빙 파일은 개당 10MB 이하만 첨부할 수 있습니다.";
  return null;
}

function proofDirectory(resumeId: string, section: ProofSection, itemId: string) {
  return path.join(process.cwd(), "data", "uploads", resumeId, section, itemId);
}

function proofObjectPath(resumeId: string, section: ProofSection, itemId: string, fileId?: string) {
  return [resumeId, section, itemId, fileId].filter(Boolean).join("/");
}

export async function storeProof(
  resumeId: string,
  section: ProofSection,
  itemId: string,
  fileId: string,
  data: Buffer,
  contentType = "application/octet-stream",
) {
  if (usesSupabaseStorage()) {
    await uploadSupabaseObject(proofObjectPath(resumeId, section, itemId, fileId), data, contentType);
    return;
  }
  const directory = proofDirectory(resumeId, section, itemId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileId), data);
}

export async function readProof(resumeId: string, section: ProofSection, itemId: string, fileId: string) {
  if (usesSupabaseStorage()) {
    const data = await downloadSupabaseObject(proofObjectPath(resumeId, section, itemId, fileId));
    if (!data) throw new Error("증빙 파일을 찾을 수 없습니다.");
    return data;
  }
  return readFile(path.join(proofDirectory(resumeId, section, itemId), fileId));
}

export async function deleteProof(resumeId: string, section: ProofSection, itemId: string, fileId: string) {
  if (usesSupabaseStorage()) {
    await deleteSupabaseObjects([proofObjectPath(resumeId, section, itemId, fileId)]);
    return;
  }
  return rm(path.join(proofDirectory(resumeId, section, itemId), fileId), { force: true });
}

export async function deleteProofDirectory(resumeId: string, section: ProofSection, itemId: string) {
  if (usesSupabaseStorage()) {
    await deleteSupabasePrefix(proofObjectPath(resumeId, section, itemId));
    return;
  }
  return rm(proofDirectory(resumeId, section, itemId), { recursive: true, force: true });
}
