import type { ResumeData, ResumeItemData, ResumeListItem } from "@/lib/types";

type ApiErrorPayload = { error?: { message?: string } };

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = await response.json();
    } catch {
      // Keep the fallback message for non-JSON errors.
    }
    throw new Error(payload.error?.message ?? "요청을 처리하지 못했습니다.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function uploadToSignedUrl(signedUrl: string, file: File) {
  const body = new FormData();
  body.set("cacheControl", "3600");
  body.set("", file);
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: { "x-upsert": "true" },
    body,
  });
  if (!response.ok) throw new Error("Supabase Storage에 파일을 업로드하지 못했습니다.");
}

export const apiClient = {
  list: () => requestJson<{ resumes: ResumeListItem[] }>("/api/resumes").then((data) => data.resumes),
  get: (id: string) => requestJson<{ resume: ResumeData }>(`/api/resumes/${id}`).then((data) => data.resume),
  create: (title: string) => requestJson<{ resume: ResumeData }>("/api/resumes", { method: "POST", body: JSON.stringify({ title }) }).then((data) => data.resume),
  update: (id: string, data: Partial<ResumeData> & { profile?: ResumeData["profile"] }) =>
    requestJson<{ resume: ResumeData }>(`/api/resumes/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((result) => result.resume),
  replaceSection: (id: string, section: string, items: Array<{ id?: string; isVisible: boolean; data: ResumeItemData["data"] }>) =>
    requestJson<{ resume: ResumeData }>(`/api/resumes/${id}/sections/${section}`, { method: "PUT", body: JSON.stringify({ items }) }).then((result) => result.resume),
  duplicate: (id: string) => requestJson<{ resume: ResumeData }>(`/api/resumes/${id}/duplicate`, { method: "POST" }).then((data) => data.resume),
  remove: (id: string) => requestJson<void>(`/api/resumes/${id}`, { method: "DELETE" }),
  import: (payload: unknown) => requestJson<{ resume: ResumeData }>("/api/resumes/import", { method: "POST", body: JSON.stringify(payload) }).then((data) => data.resume),
  uploadPhoto: async (id: string, file: File) => {
    const url = `/api/resumes/${id}/photo`;
    const prepared = await requestJson<
      | { mode: "local" }
      | { mode: "direct"; signedUrl: string; extension: "jpg" | "png" | "webp" }
    >(url, {
      method: "POST",
      body: JSON.stringify({ action: "prepare", contentType: file.type, size: file.size }),
    });
    if (prepared.mode === "direct") {
      await uploadToSignedUrl(prepared.signedUrl, file);
      return requestJson<{ photoPath: string }>(url, {
        method: "POST",
        body: JSON.stringify({ action: "complete", contentType: file.type, size: file.size }),
      });
    }
    const data = new FormData();
    data.set("photo", file);
    return requestJson<{ photoPath: string }>(url, { method: "POST", body: data });
  },
  deletePhoto: (id: string) => requestJson<void>(`/api/resumes/${id}/photo`, { method: "DELETE" }),
  uploadProofs: async (id: string, section: "training" | "certifications", itemId: string, files: File[]) => {
    const url = `/api/resumes/${id}/sections/${section}/${itemId}/proofs`;
    const metadata = files.map((file) => ({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }));
    const prepared = await requestJson<
      | { mode: "local" }
      | { mode: "direct"; files: Array<(typeof metadata)[number] & { id: string; signedUrl: string }> }
    >(url, { method: "POST", body: JSON.stringify({ action: "prepare", files: metadata }) });
    if (prepared.mode === "direct") {
      try {
        await Promise.all(prepared.files.map((upload, index) => uploadToSignedUrl(upload.signedUrl, files[index])));
      } catch (error) {
        await requestJson<void>(url, {
          method: "POST",
          body: JSON.stringify({ action: "cancel", fileIds: prepared.files.map((file) => file.id) }),
        }).catch(() => undefined);
        throw error;
      }
      return requestJson<{ resume: ResumeData }>(url, {
        method: "POST",
        body: JSON.stringify({
          action: "complete",
          files: prepared.files.map(({ id, name, size, contentType }) => ({ id, name, size, contentType })),
        }),
      }).then((result) => result.resume);
    }
    const data = new FormData();
    files.forEach((file) => data.append("files", file));
    return requestJson<{ resume: ResumeData }>(url, { method: "POST", body: data }).then((result) => result.resume);
  },
  deleteProof: (id: string, section: "training" | "certifications", itemId: string, fileId: string) =>
    requestJson<{ resume: ResumeData }>(`/api/resumes/${id}/sections/${section}/${itemId}/proofs/${fileId}`, { method: "DELETE" }).then((result) => result.resume),
};
