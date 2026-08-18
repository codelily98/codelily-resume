"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Circle, Eye, FileDown, Menu, Save, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProfileForm } from "@/components/profile-form";
import { ResumeDocument } from "@/components/resume-document";
import { SectionEditor } from "@/components/section-editor";
import { Button } from "@/components/ui/button";
import { useResumeAutosave } from "@/hooks/use-resume-autosave";
import { apiClient } from "@/lib/api-client";
import { resumeKeys } from "@/lib/query-keys";
import { SECTION_DEFINITIONS, SECTION_ORDER, type EditableSectionKey, type SectionKey } from "@/lib/sections";
import type { ResumeData } from "@/lib/types";

export function ResumeEditor({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const active = (searchParams.get("section") as SectionKey | null) ?? "profile";
  const resumeQuery = useQuery({ queryKey: resumeKeys.detail(id), queryFn: () => apiClient.get(id) });
  const [localDraft, setDraft] = useState<ResumeData | null>(null);
  const draft = localDraft ?? resumeQuery.data ?? null;
  const [mobileMenu, setMobileMenu] = useState(false);
  const { status, errorMessage, queueSave, flush, isSaving } = useResumeAutosave(resumeQuery.data);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (status === "dirty" || status === "saving") event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  const photoMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadPhoto(id, file),
    onSuccess: ({ photoPath }) => {
      queryClient.setQueryData<ResumeData>(resumeKeys.detail(id), (current) => current ? { ...current, profile: { ...current.profile, photoPath } } : current);
      setDraft((current) => {
        const source = current ?? resumeQuery.data;
        return source ? { ...source, profile: { ...source.profile, photoPath } } : current;
      });
    },
  });
  const photoDeleteMutation = useMutation({
    mutationFn: () => apiClient.deletePhoto(id),
    onSuccess: () => {
      queryClient.setQueryData<ResumeData>(resumeKeys.detail(id), (current) => current ? { ...current, profile: { ...current.profile, photoPath: "" } } : current);
      setDraft((current) => {
        const source = current ?? resumeQuery.data;
        return source ? { ...source, profile: { ...source.profile, photoPath: "" } } : current;
      });
    },
  });

  const navigateSection = useCallback((section: SectionKey) => {
    router.replace(`/resumes/${id}/edit?section=${section}`, { scroll: false });
    setMobileMenu(false);
  }, [id, router]);

  const profileChange = useCallback((values: ResumeData["profile"] & { title: string; headline: string; showDeclaration: boolean; declarationText: string }) => {
    if (!draft) return;
    const { title, headline, showDeclaration, declarationText, ...profile } = values;
    const mergedProfile = { ...draft.profile, ...profile, photoPath: draft.profile.photoPath };
    const next = { ...draft, title, headline, showDeclaration, declarationText, profile: mergedProfile };
    setDraft(next);
    queueSave({ title, headline, showDeclaration, declarationText, profile: mergedProfile });
  }, [draft, queueSave]);

  const completedSections = useMemo(() => {
    if (!draft) return new Set<string>();
    const completed = new Set<string>(draft.items.map((item) => item.section));
    if (draft.profile.name || draft.profile.email) completed.add("profile");
    return completed;
  }, [draft]);

  if (resumeQuery.isLoading || !draft) return <EditorLoading />;
  if (resumeQuery.isError) return <div className="state-panel full-page-state"><h1>이력서를 불러오지 못했습니다.</h1><p>{resumeQuery.error.message}</p><Link className="button button-secondary button-md" href="/">목록으로 돌아가기</Link></div>;

  function toggleSectionVisibility(section: SectionKey) {
    if (!draft) return;
    const sectionVisibility = { ...draft.sectionVisibility, [section]: draft.sectionVisibility[section] === false };
    setDraft({ ...draft, sectionVisibility });
    queueSave({ sectionVisibility }, true);
  }

  return (
    <div className="editor-shell">
      <header className="editor-header no-print">
        <div className="editor-brand-zone"><Link href="/" className="brand compact">Lilyume</Link><span className="header-divider" /><button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="섹션 메뉴"><Menu size={20} /></button><strong>{draft.title}</strong></div>
        <SaveIndicator status={status} error={errorMessage} />
        <div className="editor-header-actions">
          <Button onClick={flush} loading={isSaving}><Save size={16} />저장</Button>
          <Link className="button button-secondary button-md" href={`/resumes/${id}/preview`}><Eye size={16} />미리보기</Link>
          <Link className="button button-primary button-md" href={`/resumes/${id}/print`}><FileDown size={16} />PDF로 저장</Link>
        </div>
      </header>

      <nav className={`section-rail no-print ${mobileMenu ? "is-open" : ""}`} aria-label="이력서 섹션">
        <Link className="rail-back" href="/"><ArrowLeft size={16} />내 이력서</Link>
        <div className="section-nav-list">
          {SECTION_ORDER.map((section) => (
            <button className={active === section ? "active" : ""} key={section} onClick={() => navigateSection(section)}>
              <span>{SECTION_DEFINITIONS[section].label}</span>
              {completedSections.has(section) ? <Check className="complete" size={16} /> : <Circle size={15} />}
            </button>
          ))}
        </div>
        <div className="rail-tip"><Settings2 size={18} /><strong>작성 팁</strong><p>항목을 저장하면 오른쪽 미리보기에 바로 반영됩니다.</p></div>
      </nav>

      <div className="mobile-section-tabs no-print" aria-label="이력서 섹션">
        {SECTION_ORDER.map((section) => <button className={active === section ? "active" : ""} key={section} onClick={() => navigateSection(section)}>{SECTION_DEFINITIONS[section].label}</button>)}
      </div>

      <main className="editor-workspace no-print">
        <div className="section-output-control">
          <span>{SECTION_DEFINITIONS[active].label} 섹션</span>
          <label className="switch-row"><span>출력에 포함</span><input type="checkbox" checked={draft.sectionVisibility[active] !== false} onChange={() => toggleSectionVisibility(active)} /></label>
        </div>
        {active === "profile" ? (
          <ProfileForm
            resume={draft}
            onChange={profileChange}
            onSave={(values) => { profileChange(values); flush(); }}
            onUploadPhoto={(file) => photoMutation.mutate(file)}
            onDeletePhoto={() => photoDeleteMutation.mutate()}
            photoError={photoMutation.error?.message ?? photoDeleteMutation.error?.message}
            saving={isSaving || photoMutation.isPending || photoDeleteMutation.isPending}
          />
        ) : <SectionEditor resume={draft} section={active as EditableSectionKey} onDraftChange={setDraft} />}
      </main>

      <aside className="preview-rail no-print">
        <div className="preview-rail-heading"><strong>미리보기</strong><span>A4 · 자동 저장 기준</span></div>
        <div className="mini-document-frame"><ResumeDocument resume={draft} compact /></div>
      </aside>

      <div className="mobile-action-bar no-print">
        <Link className="button button-secondary button-md" href={`/resumes/${id}/preview`}>미리보기</Link>
        <Button variant="primary" onClick={flush} loading={isSaving}>저장</Button>
      </div>
    </div>
  );
}

function SaveIndicator({ status, error }: { status: "saved" | "dirty" | "saving" | "error"; error: string }) {
  const label = status === "saved" ? "저장됨" : status === "dirty" ? "변경 사항 있음" : status === "saving" ? "저장 중" : "저장 실패";
  return <div className={`save-indicator ${status}`} aria-live="polite" title={error}><span />{label}</div>;
}

function EditorLoading() {
  return <div className="editor-loading"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-line" /></div>;
}
