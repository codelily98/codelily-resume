"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { resumeKeys } from "@/lib/query-keys";
import type { ResumeData } from "@/lib/types";

type SavePayload = Partial<Pick<ResumeData, "title" | "headline" | "accentColor" | "sectionOrder" | "sectionVisibility" | "showDeclaration" | "declarationText">> & {
  profile?: ResumeData["profile"];
};

export type SaveStatus = "saved" | "dirty" | "saving" | "error";

export function useResumeAutosave(resume: ResumeData | undefined) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [errorMessage, setErrorMessage] = useState("");
  const versionRef = useRef(resume?.version ?? 1);
  const pendingRef = useRef<SavePayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chainRef = useRef(Promise.resolve());

  useEffect(() => {
    if (resume && resume.version > versionRef.current) versionRef.current = resume.version;
  }, [resume]);

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SavePayload }) => apiClient.update(id, { ...payload, version: versionRef.current }),
  });

  const execute = useCallback((payload: SavePayload) => {
    if (!resume) return;
    chainRef.current = chainRef.current
      .catch(() => undefined)
      .then(async () => {
        setStatus("saving");
        setErrorMessage("");
        try {
          const saved = await mutation.mutateAsync({ id: resume.id, payload });
          versionRef.current = saved.version;
          queryClient.setQueryData(resumeKeys.detail(resume.id), saved);
          setStatus(pendingRef.current ? "dirty" : "saved");
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
          setStatus("error");
          throw error;
        }
      });
  }, [mutation, queryClient, resume]);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const payload = pendingRef.current;
    pendingRef.current = null;
    if (payload) execute(payload);
  }, [execute]);

  const queueSave = useCallback((payload: SavePayload, immediate = false) => {
    pendingRef.current = { ...pendingRef.current, ...payload };
    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    if (immediate) flush();
    else timerRef.current = setTimeout(flush, 1000);
  }, [flush]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { status, errorMessage, queueSave, flush, isSaving: mutation.isPending };
}
