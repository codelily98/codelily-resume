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
    const data = new FormData();
    data.set("photo", file);
    return requestJson<{ photoPath: string }>(`/api/resumes/${id}/photo`, { method: "POST", body: data });
  },
  deletePhoto: (id: string) => requestJson<void>(`/api/resumes/${id}/photo`, { method: "DELETE" }),
  uploadProofs: (id: string, section: "training" | "certifications", itemId: string, files: File[]) => {
    const data = new FormData();
    files.forEach((file) => data.append("files", file));
    return requestJson<{ resume: ResumeData }>(`/api/resumes/${id}/sections/${section}/${itemId}/proofs`, { method: "POST", body: data }).then((result) => result.resume);
  },
  deleteProof: (id: string, section: "training" | "certifications", itemId: string, fileId: string) =>
    requestJson<{ resume: ResumeData }>(`/api/resumes/${id}/sections/${section}/${itemId}/proofs/${fileId}`, { method: "DELETE" }).then((result) => result.resume),
};
