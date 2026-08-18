import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  deleteSupabaseObjects,
  downloadSupabaseObject,
  uploadSupabaseObject,
  usesSupabaseStorage,
} from "@/lib/supabase-storage";

const formats = [
  { extension: "jpg", contentType: "image/jpeg" },
  { extension: "png", contentType: "image/png" },
  { extension: "webp", contentType: "image/webp" },
] as const;

export function photoDirectory(id: string) {
  return path.join(process.cwd(), "data", "uploads", id);
}

export async function deleteStoredPhoto(id: string, exceptExtension?: "jpg" | "png" | "webp") {
  const formatsToDelete = formats.filter((format) => format.extension !== exceptExtension);
  if (usesSupabaseStorage()) {
    await deleteSupabaseObjects(formatsToDelete.map((format) => `${id}/profile.${format.extension}`));
    return;
  }
  await Promise.all(formatsToDelete.map((format) => rm(path.join(photoDirectory(id), `profile.${format.extension}`), { force: true })));
}

export async function readStoredPhoto(id: string) {
  for (const format of formats) {
    if (usesSupabaseStorage()) {
      const data = await downloadSupabaseObject(`${id}/profile.${format.extension}`);
      if (data) return { ...format, data };
      continue;
    }
    try {
      const data = await readFile(path.join(photoDirectory(id), `profile.${format.extension}`));
      return { ...format, data };
    } catch {
      // Try the next supported format.
    }
  }
  return null;
}

export async function storePhoto(id: string, extension: "jpg" | "png" | "webp", data: Buffer) {
  if (usesSupabaseStorage()) {
    await deleteStoredPhoto(id);
    const contentType = formats.find((format) => format.extension === extension)?.contentType ?? "application/octet-stream";
    await uploadSupabaseObject(`${id}/profile.${extension}`, data, contentType);
    return;
  }
  const directory = photoDirectory(id);
  await mkdir(directory, { recursive: true });
  await deleteStoredPhoto(id);
  await writeFile(path.join(directory, `profile.${extension}`), data);
}
