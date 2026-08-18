import "server-only";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_BUCKET = "resume-assets";

type StorageError = {
  message?: string;
  status?: number;
  statusCode?: number | string;
};

function getStorageConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) return null;
  return {
    url,
    secretKey,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET,
  };
}

function getStorageClient() {
  const config = getStorageConfig();
  if (!config) return null;
  return {
    bucket: config.bucket,
    client: createClient(config.url, config.secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    }),
  };
}

function isNotFound(error: StorageError) {
  const status = String(error.statusCode ?? error.status ?? "");
  return status === "404" || error.message?.toLowerCase().includes("not found") === true;
}

function storageError(action: string, error: StorageError) {
  return new Error(`Supabase Storage ${action} 실패: ${error.message ?? "알 수 없는 오류"}`);
}

export function usesSupabaseStorage() {
  return getStorageConfig() !== null;
}

export async function uploadSupabaseObject(objectPath: string, data: Buffer, contentType: string) {
  const storage = getStorageClient();
  if (!storage) throw new Error("Supabase Storage 환경 변수가 설정되지 않았습니다.");
  const { error } = await storage.client.storage.from(storage.bucket).upload(objectPath, data, {
    cacheControl: "3600",
    contentType,
    upsert: true,
  });
  if (error) throw storageError("업로드", error);
}

export async function createSupabaseSignedUpload(objectPath: string) {
  const storage = getStorageClient();
  if (!storage) throw new Error("Supabase Storage 환경 변수가 설정되지 않았습니다.");
  const { data, error } = await storage.client.storage.from(storage.bucket).createSignedUploadUrl(objectPath, { upsert: true });
  if (error) throw storageError("업로드 URL 생성", error);
  return { objectPath, signedUrl: data.signedUrl };
}

export async function createSupabaseSignedDownload(objectPath: string, downloadName?: string) {
  const storage = getStorageClient();
  if (!storage) throw new Error("Supabase Storage 환경 변수가 설정되지 않았습니다.");
  const { data, error } = await storage.client.storage.from(storage.bucket).createSignedUrl(
    objectPath,
    60,
    downloadName ? { download: downloadName } : undefined,
  );
  if (error) throw storageError("다운로드 URL 생성", error);
  return data.signedUrl;
}

export async function getSupabaseObjectInfo(objectPath: string) {
  const storage = getStorageClient();
  if (!storage) throw new Error("Supabase Storage 환경 변수가 설정되지 않았습니다.");
  const { data, error } = await storage.client.storage.from(storage.bucket).info(objectPath);
  if (error) {
    if (isNotFound(error)) return null;
    throw storageError("파일 정보 조회", error);
  }
  return data;
}

export async function downloadSupabaseObject(objectPath: string) {
  const storage = getStorageClient();
  if (!storage) throw new Error("Supabase Storage 환경 변수가 설정되지 않았습니다.");
  const { data, error } = await storage.client.storage.from(storage.bucket).download(objectPath);
  if (error) {
    if (isNotFound(error)) return null;
    throw storageError("다운로드", error);
  }
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteSupabaseObjects(objectPaths: string[]) {
  if (objectPaths.length === 0) return;
  const storage = getStorageClient();
  if (!storage) throw new Error("Supabase Storage 환경 변수가 설정되지 않았습니다.");
  const { error } = await storage.client.storage.from(storage.bucket).remove(objectPaths);
  if (error && !isNotFound(error)) throw storageError("삭제", error);
}

async function listSupabaseObjectPaths(prefix: string): Promise<string[]> {
  const storage = getStorageClient();
  if (!storage) throw new Error("Supabase Storage 환경 변수가 설정되지 않았습니다.");
  const { data, error } = await storage.client.storage.from(storage.bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) {
    if (isNotFound(error)) return [];
    throw storageError("목록 조회", error);
  }

  const paths: string[] = [];
  for (const entry of data) {
    const entryPath = `${prefix}/${entry.name}`;
    if (entry.id) paths.push(entryPath);
    else paths.push(...await listSupabaseObjectPaths(entryPath));
  }
  return paths;
}

export async function deleteSupabasePrefix(prefix: string) {
  const objectPaths = await listSupabaseObjectPaths(prefix);
  for (let index = 0; index < objectPaths.length; index += 1000) {
    await deleteSupabaseObjects(objectPaths.slice(index, index + 1000));
  }
}
