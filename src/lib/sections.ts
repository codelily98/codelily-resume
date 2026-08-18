export const SECTION_ORDER = [
  "profile",
  "skills",
  "education",
  "experience",
  "career-details",
  "training",
  "certifications",
  "portfolio",
  "military",
  "work-preferences",
] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];
export type EditableSectionKey = Exclude<SectionKey, "profile">;

export type FieldDefinition = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "month" | "date" | "number" | "url" | "select" | "checkbox";
  placeholder?: string;
  options?: string[];
  span?: 1 | 2;
  sensitive?: boolean;
};

export type SectionDefinition = {
  key: SectionKey;
  label: string;
  description: string;
  itemLabel: string;
  titleField: string;
  fields: FieldDefinition[];
};

export const SECTION_DEFINITIONS: Record<SectionKey, SectionDefinition> = {
  profile: {
    key: "profile",
    label: "기본 정보",
    description: "채용 담당자가 가장 먼저 확인하는 프로필입니다.",
    itemLabel: "기본 정보",
    titleField: "name",
    fields: [],
  },
  skills: {
    key: "skills",
    label: "기술 스택",
    description: "보유 기술과 숙련도를 간결하게 정리합니다.",
    itemLabel: "기술",
    titleField: "name",
    fields: [
      { key: "category", label: "분류", type: "select", options: ["언어", "프레임워크", "라이브러리", "데이터베이스", "클라우드", "DevOps", "IDE", "도구", "기타"] },
      { key: "name", label: "기술명", placeholder: "예: Spring Boot" },
      { key: "proficiency", label: "숙련도", type: "select", options: ["선택 안 함", "입문", "초급", "중급", "고급"] },
      { key: "monthsUsed", label: "사용 기간(개월)", type: "number" },
      { key: "description", label: "설명", type: "textarea", span: 2 },
    ],
  },
  education: {
    key: "education",
    label: "학력",
    description: "학교와 전공, 재학 상태를 입력합니다. 검색 없이 직접 입력할 수 있습니다.",
    itemLabel: "학력",
    titleField: "schoolName",
    fields: [
      { key: "schoolName", label: "학교명", placeholder: "학교명을 직접 입력" },
      { key: "schoolType", label: "학교 구분", type: "select", options: ["고등학교", "전문대학", "대학교", "대학원", "기타"] },
      { key: "startDate", label: "입학", type: "month" },
      { key: "endDate", label: "졸업/종료", type: "month" },
      { key: "status", label: "재학 상태", type: "select", options: ["졸업", "졸업 예정", "재학", "휴학", "중퇴", "수료", "기타"] },
      { key: "major", label: "전공" },
      { key: "secondaryMajor", label: "복수/부전공" },
      { key: "degree", label: "학위" },
      { key: "grade", label: "학점", type: "number" },
      { key: "gradeScale", label: "만점", type: "number" },
      { key: "location", label: "소재지" },
      { key: "thesisTitle", label: "졸업 논문/작품" },
      { key: "thesisDescription", label: "논문/작품 설명", type: "textarea", span: 2 },
    ],
  },
  experience: {
    key: "experience",
    label: "경력",
    description: "회사, 역할, 주요 업무와 성과를 기록합니다.",
    itemLabel: "경력",
    titleField: "companyName",
    fields: [
      { key: "companyName", label: "회사명", placeholder: "회사명을 직접 입력" },
      { key: "displayName", label: "출력용 회사명" },
      { key: "startDate", label: "입사", type: "month" },
      { key: "endDate", label: "퇴사", type: "month" },
      { key: "isCurrent", label: "재직 중", type: "checkbox" },
      { key: "department", label: "부서" },
      { key: "position", label: "직급/직책" },
      { key: "employmentType", label: "고용 형태", type: "select", options: ["정규직", "계약직", "인턴", "프리랜서", "파견", "기타"] },
      { key: "jobTitle", label: "주요 직무" },
      { key: "location", label: "근무지" },
      { key: "companyUrl", label: "회사 홈페이지", type: "url" },
      { key: "description", label: "회사/업무 설명", type: "textarea", span: 2 },
      { key: "achievements", label: "주요 성과 (줄바꿈으로 구분)", type: "textarea", span: 2 },
      { key: "technologies", label: "사용 기술", placeholder: "쉼표로 구분", span: 2 },
    ],
  },
  "career-details": {
    key: "career-details",
    label: "경력기술서",
    description: "프로젝트의 배경, 수행 과정, 문제 해결과 성과를 설명합니다.",
    itemLabel: "경력기술",
    titleField: "title",
    fields: [
      { key: "title", label: "제목" },
      { key: "role", label: "역할" },
      { key: "startDate", label: "시작", type: "month" },
      { key: "endDate", label: "종료", type: "month" },
      { key: "background", label: "프로젝트/업무 배경", type: "textarea", span: 2 },
      { key: "process", label: "수행 업무와 과정", type: "textarea", span: 2 },
      { key: "problemSolution", label: "문제와 해결 방법", type: "textarea", span: 2 },
      { key: "outcome", label: "성과", type: "textarea", span: 2 },
      { key: "technologies", label: "사용 기술", span: 2 },
      { key: "url", label: "관련 링크", type: "url", span: 2 },
    ],
  },
  training: {
    key: "training",
    label: "교육",
    description: "수료한 교육과 학습 내용을 기록합니다.",
    itemLabel: "교육",
    titleField: "name",
    fields: [
      { key: "name", label: "교육명" },
      { key: "organization", label: "교육 기관" },
      { key: "startDate", label: "시작", type: "date" },
      { key: "endDate", label: "종료", type: "date" },
      { key: "completionStatus", label: "수료 여부", type: "select", options: ["수료", "수료 예정", "진행 중", "중단"] },
      { key: "hours", label: "교육 시간", type: "number" },
      { key: "description", label: "교육 내용", type: "textarea", span: 2 },
      { key: "technologies", label: "습득 기술", span: 2 },
    ],
  },
  certifications: {
    key: "certifications",
    label: "자격증",
    description: "자격과 인증 정보를 입력합니다.",
    itemLabel: "자격증",
    titleField: "name",
    fields: [
      { key: "name", label: "자격증명" },
      { key: "issuer", label: "발급 기관" },
      { key: "acquiredDate", label: "취득일", type: "date" },
      { key: "expiresDate", label: "만료일", type: "date" },
      { key: "credentialId", label: "자격 번호", sensitive: true },
      { key: "grade", label: "점수/등급" },
    ],
  },
  portfolio: {
    key: "portfolio",
    label: "포트폴리오",
    description: "프로젝트와 외부 링크를 정리합니다.",
    itemLabel: "포트폴리오",
    titleField: "title",
    fields: [
      { key: "title", label: "제목" },
      { key: "url", label: "URL", type: "url" },
      { key: "role", label: "역할" },
      { key: "featured", label: "대표 포트폴리오", type: "checkbox" },
      { key: "startDate", label: "시작", type: "month" },
      { key: "endDate", label: "종료", type: "month" },
      { key: "description", label: "설명", type: "textarea", span: 2 },
      { key: "technologies", label: "사용 기술", span: 2 },
    ],
  },
  military: {
    key: "military",
    label: "병역·우대",
    description: "민감 정보는 기본적으로 출력에서 제외할 수 있습니다.",
    itemLabel: "병역·우대사항",
    titleField: "militaryStatus",
    fields: [
      { key: "militaryStatus", label: "복무 상태", type: "select", options: ["군필", "미필", "면제", "해당 없음", "기타"], sensitive: true },
      { key: "branch", label: "군별", sensitive: true },
      { key: "rank", label: "계급", sensitive: true },
      { key: "specialty", label: "병과", sensitive: true },
      { key: "startDate", label: "입대일", type: "month", sensitive: true },
      { key: "endDate", label: "전역일", type: "month", sensitive: true },
      { key: "exemptionReason", label: "면제 사유", sensitive: true },
      { key: "veterans", label: "보훈 대상", type: "checkbox", sensitive: true },
      { key: "employmentProtection", label: "취업보호 대상", type: "checkbox", sensitive: true },
      { key: "employmentSubsidy", label: "고용지원금 대상", type: "checkbox", sensitive: true },
      { key: "disability", label: "장애 여부", type: "checkbox", sensitive: true },
      { key: "notes", label: "기타 우대사항", type: "textarea", span: 2, sensitive: true },
    ],
  },
  "work-preferences": {
    key: "work-preferences",
    label: "희망근무",
    description: "희망하는 직무와 근무 조건을 정리합니다.",
    itemLabel: "희망근무조건",
    titleField: "roles",
    fields: [
      { key: "employmentTypes", label: "고용 형태" },
      { key: "locations", label: "희망 근무지" },
      { key: "salaryType", label: "희망 연봉", type: "select", options: ["면접 후 결정", "금액 입력"] },
      { key: "salaryAmount", label: "희망 연봉 금액", type: "number" },
      { key: "roles", label: "희망 직무" },
      { key: "industries", label: "희망 산업" },
      { key: "availableDate", label: "입사 가능일", type: "date" },
      { key: "notes", label: "기타 조건", type: "textarea", span: 2 },
    ],
  },
};

export const DEFAULT_SECTION_VISIBILITY = Object.fromEntries(
  SECTION_ORDER.map((key) => [key, true]),
) as Record<SectionKey, boolean>;

export function getEmptyItem(section: EditableSectionKey) {
  return Object.fromEntries(
    SECTION_DEFINITIONS[section].fields.map((field) => [field.key, field.type === "checkbox" ? false : ""]),
  );
}
