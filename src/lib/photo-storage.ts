import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const formats = [
  { extension: "jpg", contentType: "image/jpeg" },
  { extension: "png", contentType: "image/png" },
  { extension: "webp", contentType: "image/webp" },
] as const;

export function photoDirectory(id: string) {
  return path.join(process.cwd(), "data", "uploads", id);
}

export async function deleteStoredPhoto(id: string) {
  await Promise.all(formats.map((format) => rm(path.join(photoDirectory(id), `profile.${format.extension}`), { force: true })));
}

export async function readStoredPhoto(id: string) {
  for (const format of formats) {
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
  const directory = photoDirectory(id);
  await mkdir(directory, { recursive: true });
  await deleteStoredPhoto(id);
  await writeFile(path.join(directory, `profile.${extension}`), data);
}
