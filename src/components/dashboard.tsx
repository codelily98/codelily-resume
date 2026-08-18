"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FilePlus2, FileText, MoreVertical, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { resumeKeys } from "@/lib/query-keys";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resumesQuery = useQuery({ queryKey: resumeKeys.lists(), queryFn: apiClient.list });

  const duplicateMutation = useMutation({
    mutationFn: apiClient.duplicate,
    onSuccess: (resume) => {
      void queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });
      router.push(`/resumes/${resume.id}/edit`);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: apiClient.remove,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: resumeKeys.lists() }),
  });
  const importMutation = useMutation({
    mutationFn: apiClient.import,
    onSuccess: (resume) => {
      void queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });
      router.push(`/resumes/${resume.id}/edit`);
    },
  });

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR");
    if (!normalized) return resumesQuery.data ?? [];
    return (resumesQuery.data ?? []).filter((resume) => `${resume.title} ${resume.headline}`.toLocaleLowerCase("ko-KR").includes(normalized));
  }, [query, resumesQuery.data]);

  async function handleImport(file?: File) {
    if (!file || file.size > 10 * 1024 * 1024) return;
    try {
      importMutation.mutate(JSON.parse(await file.text()));
    } catch {
      window.alert("유효한 이력서 JSON 백업 파일을 선택해 주세요.");
    }
  }

  return (
    <div className="app-page">
      <AppHeader actions={<Link className="button button-primary button-md" href="/resumes/new"><FilePlus2 size={17} />새 이력서 만들기</Link>} />
      <main className="dashboard-shell">
        <div className="dashboard-heading">
          <div>
            <h1>내 이력서</h1>
            <p>작성 중인 이력서를 관리하고 이어서 편집할 수 있습니다.</p>
          </div>
        </div>

        <div className="dashboard-tools">
          <label className="search-field">
            <Search aria-hidden="true" size={20} />
            <span className="sr-only">이력서 검색</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이력서 제목으로 검색" />
          </label>
          <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => void handleImport(event.target.files?.[0])} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} loading={importMutation.isPending}><Upload size={17} />백업 가져오기</Button>
        </div>

        {resumesQuery.isLoading ? <DashboardSkeleton /> : resumesQuery.isError ? (
          <div className="state-panel"><h2>데이터베이스에 연결하지 못했습니다.</h2><p>PostgreSQL 컨테이너와 환경 변수를 확인한 뒤 다시 시도해 주세요.</p><Button onClick={() => void resumesQuery.refetch()}>다시 시도</Button></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><FileText aria-hidden="true" size={28} /></span>
            <h2>{query ? "검색 결과가 없습니다." : "첫 이력서를 만들어 보세요."}</h2>
            <p>{query ? "다른 제목으로 검색해 보세요." : "입력한 정보는 내 Lilyume 계정에 안전하게 저장됩니다."}</p>
            {!query ? <Link className="button button-primary button-md" href="/resumes/new"><FilePlus2 size={17} />새 이력서 만들기</Link> : null}
          </div>
        ) : (
          <div className="resume-table" role="table" aria-label="이력서 목록">
            <div className="resume-table-head" role="row">
              <span>이력서 제목</span><span>완성도</span><span>마지막 수정</span><span>작업</span>
            </div>
            {filtered.map((resume) => (
              <div className="resume-row" role="row" key={resume.id}>
                <div className="resume-title-cell">
                  <Link href={`/resumes/${resume.id}/edit`}>{resume.title}</Link>
                  <span>{resume.headline || "한 줄 소개가 아직 없습니다."}</span>
                </div>
                <div className="completion-cell">
                  <span>{resume.completedSections}/{resume.totalSections} 섹션 완료</span>
                  <span className="completion-track"><i style={{ width: `${(resume.completedSections / resume.totalSections) * 100}%` }} /></span>
                </div>
                <time dateTime={resume.updatedAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(resume.updatedAt))}</time>
                <div className="row-actions">
                  <Link href={`/resumes/${resume.id}/edit`}>편집</Link>
                  <Link href={`/resumes/${resume.id}/preview`}>미리보기</Link>
                  <button className="icon-button" aria-label={`${resume.title} 메뉴`} onClick={() => setOpenMenu(openMenu === resume.id ? null : resume.id)}><MoreVertical size={18} /></button>
                  {openMenu === resume.id ? (
                    <div className="row-menu">
                      <a href={`/api/resumes/${resume.id}/export`}><Download size={15} />백업 다운로드</a>
                      <button onClick={() => duplicateMutation.mutate(resume.id)}>복제</button>
                      <button className="danger-text" onClick={() => { if (window.confirm("이 이력서를 삭제할까요?")) deleteMutation.mutate(resume.id); }}>삭제</button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="resume-table"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-line" /></div>;
}
