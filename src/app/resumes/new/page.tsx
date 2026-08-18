"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { apiClient } from "@/lib/api-client";
import { resumeKeys } from "@/lib/query-keys";

export default function NewResumePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("새 이력서");
  const mutation = useMutation({
    mutationFn: apiClient.create,
    onSuccess: (resume) => {
      void queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });
      router.push(`/resumes/${resume.id}/edit`);
    },
  });
  return (
    <div className="app-page">
      <AppHeader />
      <main className="centered-form-page">
        <Link className="back-link" href="/"><ArrowLeft size={17} />내 이력서로 돌아가기</Link>
        <div className="create-panel">
          <h1>새 이력서 만들기</h1>
          <p>이 제목은 관리 화면에서만 사용하며 나중에 언제든 바꿀 수 있습니다.</p>
          <form onSubmit={(event) => { event.preventDefault(); if (title.trim()) mutation.mutate(title.trim()); }}>
            <Field label="이력서 제목" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus maxLength={120} />
            {mutation.error ? <p className="form-error">{mutation.error.message}</p> : null}
            <Button variant="primary" type="submit" loading={mutation.isPending}>만들고 편집하기</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
