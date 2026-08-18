import { AtSign, GitBranch, Globe2, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { type EditableSectionKey, type SectionKey } from "@/lib/sections";
import type { ResumeData, ResumeItemData } from "@/lib/types";
import { calculateUniqueCareerMonths, durationLabel, formatMonth, itemsFor, monthsToLabel, splitLines } from "@/lib/resume-utils";

function text(data: ResumeItemData["data"], key: string) {
  const value = data[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function safeUrl(value: string) {
  if (!/^https?:\/\//i.test(value)) return undefined;
  return value;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="document-section">
      <h2 className="document-section-title">{title}</h2>
      {children}
    </section>
  );
}

function DateRange({ item }: { item: ResumeItemData }) {
  const start = text(item.data, "startDate") || text(item.data, "acquiredDate");
  const end = text(item.data, "endDate") || text(item.data, "expiresDate");
  return <span>{formatMonth(start)}{start && (end || item.data.isCurrent) ? " ~ " : ""}{item.data.isCurrent ? "현재" : formatMonth(end)}</span>;
}

function TimelineRow({ item, title, meta, children }: { item: ResumeItemData; title: string; meta?: string; children?: ReactNode }) {
  return (
    <article className="document-timeline-row resume-item">
      <div className="document-date"><DateRange item={item} />{item.section === "experience" ? <small>{durationLabel(item.data.startDate, item.data.endDate, item.data.isCurrent)}</small> : null}</div>
      <div className="document-timeline-marker" aria-hidden="true"><i /></div>
      <div className="document-item-content">
        <h3>{title || "제목 없음"}</h3>
        {meta ? <p className="document-meta">{meta}</p> : null}
        {children}
      </div>
    </article>
  );
}

export function ResumeDocument({ resume, compact = false }: { resume: ResumeData; compact?: boolean }) {
  const profile = resume.profile;
  const visible = (section: SectionKey) => resume.sectionVisibility[section] !== false;
  const skills = itemsFor(resume, "skills");
  const education = itemsFor(resume, "education");
  const experience = itemsFor(resume, "experience");
  const training = itemsFor(resume, "training");
  const certifications = itemsFor(resume, "certifications");
  const portfolio = itemsFor(resume, "portfolio");
  const careerDetails = itemsFor(resume, "career-details");
  const military = itemsFor(resume, "military");
  const workPreferences = itemsFor(resume, "work-preferences");
  const careerMonths = calculateUniqueCareerMonths(experience);
  const summary = [
    ["학력", education[0] ? text(education[0].data, "schoolName") : "입력 전"],
    ["경력", careerMonths ? `총 ${monthsToLabel(careerMonths)}` : "입력 전"],
    ["교육", training.length ? `${training.length}건` : "입력 전"],
    ["자격증", certifications.length ? `${certifications.length}건` : "입력 전"],
  ];
  const contactRows = [
    profile.visibility.email !== false && profile.email ? [AtSign, profile.email, `mailto:${profile.email}`] : null,
    profile.visibility.phone !== false && profile.phone ? [Phone, profile.phone, undefined] : null,
    profile.visibility.address !== false && profile.address ? [MapPin, profile.address, undefined] : null,
    profile.visibility.github !== false && profile.github ? [GitBranch, profile.github, safeUrl(profile.github)] : null,
    profile.visibility.website !== false && profile.website ? [Globe2, profile.website, safeUrl(profile.website)] : null,
  ].filter(Boolean) as Array<[typeof AtSign, string, string | undefined]>;

  const sectionRenderers: Partial<Record<EditableSectionKey, ReactNode>> = {
    education: education.length ? <Section title="학력"><div className="document-timeline">{education.map((item) => <TimelineRow key={item.id} item={item} title={`${text(item.data, "schoolName")} ${text(item.data, "major")}`} meta={[text(item.data, "status"), text(item.data, "grade") && `${text(item.data, "grade")} / ${text(item.data, "gradeScale")}`].filter(Boolean).join(" · ")}>{text(item.data, "thesisTitle") ? <p>{text(item.data, "thesisTitle")}</p> : null}{text(item.data, "thesisDescription") ? <p className="document-detail">{text(item.data, "thesisDescription")}</p> : null}</TimelineRow>)}</div></Section> : null,
    experience: experience.length ? <Section title="경력"><div className="document-timeline">{experience.map((item) => <TimelineRow key={item.id} item={item} title={text(item.data, "displayName") || text(item.data, "companyName")} meta={[text(item.data, "department"), text(item.data, "position"), text(item.data, "jobTitle")].filter(Boolean).join(" · ")}>{text(item.data, "description") ? <p>{text(item.data, "description")}</p> : null}{splitLines(item.data.achievements).length ? <ul>{splitLines(item.data.achievements).map((line) => <li key={line}>{line}</li>)}</ul> : null}{text(item.data, "technologies") ? <p className="document-tech">{text(item.data, "technologies")}</p> : null}</TimelineRow>)}</div></Section> : null,
    "career-details": careerDetails.length ? <Section title="경력기술서"><div className="document-narratives">{careerDetails.map((item) => <article className="document-narrative" key={item.id}><div className="narrative-heading"><h3>{text(item.data, "title")}</h3><DateRange item={item} /></div>{text(item.data, "role") ? <p className="document-meta">역할 · {text(item.data, "role")}</p> : null}{[["배경", "background"], ["수행", "process"], ["해결", "problemSolution"], ["성과", "outcome"]].map(([label, key]) => text(item.data, key) ? <div className="narrative-row" key={key}><strong>{label}</strong><p>{text(item.data, key)}</p></div> : null)}</article>)}</div></Section> : null,
    training: training.length ? <Section title="교육"><div className="document-timeline">{training.map((item) => <TimelineRow key={item.id} item={item} title={text(item.data, "name")} meta={[text(item.data, "organization"), text(item.data, "completionStatus")].filter(Boolean).join(" · ")}>{text(item.data, "description") ? <p>{text(item.data, "description")}</p> : null}{text(item.data, "technologies") ? <p className="document-tech">{text(item.data, "technologies")}</p> : null}</TimelineRow>)}</div></Section> : null,
    certifications: certifications.length ? <Section title="자격증"><div className="document-simple-list">{certifications.map((item) => <article key={item.id}><DateRange item={item} /><div><h3>{text(item.data, "name")}</h3><p>{[text(item.data, "issuer"), text(item.data, "grade")].filter(Boolean).join(" · ")}</p></div></article>)}</div></Section> : null,
    portfolio: portfolio.length ? <Section title="포트폴리오"><div className="document-simple-list">{portfolio.map((item) => <article key={item.id}><span>{text(item.data, "role")}</span><div><h3>{text(item.data, "title")}</h3>{safeUrl(text(item.data, "url")) ? <a href={safeUrl(text(item.data, "url"))}>{text(item.data, "url")}</a> : null}<p>{text(item.data, "description")}</p></div></article>)}</div></Section> : null,
    military: military.length ? <Section title="병역 및 취업 우대사항"><div className="document-data-grid">{military.map((item) => [["복무 상태", "militaryStatus"], ["군별", "branch"], ["계급", "rank"], ["병과", "specialty"], ["기타", "notes"]].map(([label, key]) => text(item.data, key) ? <div key={`${item.id}-${key}`}><strong>{label}</strong><span>{text(item.data, key)}</span></div> : null))}</div></Section> : null,
    "work-preferences": workPreferences.length ? <Section title="희망 근무조건"><div className="document-data-grid">{workPreferences.map((item) => [["고용 형태", "employmentTypes"], ["희망 근무지", "locations"], ["희망 연봉", "salaryType"], ["희망 직무", "roles"], ["희망 산업", "industries"], ["입사 가능일", "availableDate"], ["기타", "notes"]].map(([label, key]) => text(item.data, key) ? <div key={`${item.id}-${key}`}><strong>{label}</strong><span>{text(item.data, key)}</span></div> : null))}</div></Section> : null,
  };

  return (
    <article className={`resume-paper ${compact ? "resume-paper-compact" : ""}`} style={{ "--document-accent": resume.accentColor } as React.CSSProperties}>
      <header className="document-header">
        <h1>{resume.headline || "한 줄 소개를 입력해 주세요."}</h1>
        <div className="document-profile">
          <div className="document-photo">{profile.photoPath ? <img src={profile.photoPath} alt={`${profile.name || "지원자"} 증명사진`} /> : <span>PHOTO</span>}</div>
          <div className="document-profile-main">
            <h2>{profile.name || "이름"}</h2>
            {profile.englishName ? <p className="english-name">{profile.englishName}</p> : null}
            {profile.summary ? <p className="profile-summary">{profile.summary}</p> : null}
            <div className="document-contacts">{contactRows.map(([Icon, value, href]) => <div key={value}><Icon aria-hidden="true" size={12} />{href ? <a href={href}>{value}</a> : <span>{value}</span>}</div>)}</div>
          </div>
        </div>
        <div className="document-summary">{summary.map(([label, value]) => <div className="summary-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </header>

      {visible("skills") && skills.length ? <Section title="기술 스택"><div className="document-skills">{skills.map((item) => <span key={item.id}>{text(item.data, "name")}</span>)}</div></Section> : null}
      {resume.sectionOrder.map((section) => section !== "profile" && section !== "skills" && visible(section) ? <div key={section}>{sectionRenderers[section as EditableSectionKey]}</div> : null)}
      {resume.showDeclaration ? <footer className="document-declaration"><strong>위의 모든 기재사항은 사실과 다름없음을 확인합니다.</strong>{resume.declarationText ? <p>{resume.declarationText}</p> : null}<span>작성자: {profile.name || "지원자"}</span></footer> : null}
    </article>
  );
}
