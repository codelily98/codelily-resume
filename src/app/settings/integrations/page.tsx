"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, CheckCircle2, GraduationCap, Unplug } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";

type Health = { integrations: { schools: { configured: boolean; provider: string }; companies: { configured: boolean; provider: string } } };

export default function IntegrationsPage() {
  const health = useQuery({ queryKey: ["integrations", "health"], queryFn: () => fetch("/api/integrations/health").then((response) => response.json() as Promise<Health>) });
  return (
    <div className="app-page">
      <AppHeader />
      <main className="settings-shell">
        <Link className="back-link" href="/"><ArrowLeft size={17} />내 이력서로 돌아가기</Link>
        <div className="settings-heading"><h1>외부 데이터 연동</h1><p>연동은 학교와 회사명을 찾기 쉽게 해주는 보조 기능입니다. 설정하지 않아도 모든 항목을 직접 입력할 수 있습니다.</p></div>
        <div className="integration-list">
          <IntegrationRow icon={<GraduationCap />} title="대학알리미" description="국내 대학명과 대학 코드를 검색합니다." configured={health.data?.integrations.schools.configured} env="PUBLIC_DATA_SERVICE_KEY" />
          <IntegrationRow icon={<Building2 />} title="OpenDART" description="공시대상 회사의 회사명을 검색합니다." configured={health.data?.integrations.companies.configured} env="OPEN_DART_API_KEY" />
        </div>
        <aside className="privacy-note"><strong>개인정보 전송 원칙</strong><p>검색 버튼을 눌렀을 때 입력한 학교명 또는 회사명만 각 제공자에게 전송합니다. 이름, 연락처, 경력 기간과 같은 다른 이력서 데이터는 전송하지 않습니다.</p></aside>
      </main>
    </div>
  );
}

function IntegrationRow({ icon, title, description, configured, env }: { icon: React.ReactNode; title: string; description: string; configured?: boolean; env: string }) {
  return <article className="integration-row"><span className="integration-icon">{icon}</span><div><h2>{title}</h2><p>{description}</p><code>{env}</code></div><span className={`integration-status ${configured ? "connected" : ""}`}>{configured ? <CheckCircle2 size={16} /> : <Unplug size={16} />}{configured ? "설정됨" : "직접 입력 모드"}</span></article>;
}
