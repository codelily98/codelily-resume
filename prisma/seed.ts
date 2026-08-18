import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sectionOrder = [
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
];

async function main() {
  const existing = await prisma.resume.findFirst({ where: { title: "백엔드 개발자 이력서 (예시)" } });
  if (existing) return;

  await prisma.resume.create({
    data: {
      title: "백엔드 개발자 이력서 (예시)",
      headline: "서비스의 흐름을 고민하며 함께 성장하는 개발자 김하늘입니다.",
      sectionOrder,
      sectionVisibility: Object.fromEntries(sectionOrder.map((section) => [section, true])),
      profile: {
        create: {
          name: "김하늘",
          email: "haneul.kim@example.com",
          phone: "010-1234-5678",
          address: "서울특별시 마포구 예시로 12",
          github: "https://github.com/example",
          summary: "사용자 경험을 고려해 안정적인 서비스를 만드는 백엔드 개발자입니다.",
          visibility: { birthDate: false, phone: true, email: true, address: true, website: true, github: true, linkedin: true },
        },
      },
      items: {
        create: [
          { section: "skills", sortOrder: 0, data: { name: "Java", category: "언어", proficiency: "중급", monthsUsed: "36", description: "" } },
          { section: "skills", sortOrder: 1, data: { name: "Spring Boot", category: "프레임워크", proficiency: "중급", monthsUsed: "30", description: "" } },
          { section: "skills", sortOrder: 2, data: { name: "PostgreSQL", category: "데이터베이스", proficiency: "중급", monthsUsed: "24", description: "" } },
          { section: "education", sortOrder: 0, data: { schoolName: "한국대학교", schoolType: "대학교", startDate: "2017-03", endDate: "2021-02", status: "졸업", major: "컴퓨터공학", grade: "3.8", gradeScale: "4.5", location: "서울" } },
          { section: "experience", sortOrder: 0, data: { companyName: "예시테크", startDate: "2023-03", endDate: "", isCurrent: true, department: "플랫폼팀", position: "백엔드 개발자", employmentType: "정규직", jobTitle: "웹 서비스 개발", location: "서울", description: "API 설계와 서비스 운영을 담당했습니다.", achievements: "응답 시간 35% 개선\n배포 자동화 구축", technologies: "Java, Spring Boot, PostgreSQL" } },
          { section: "career-details", sortOrder: 0, data: { title: "서비스 성능 개선", role: "백엔드 개발", background: "트래픽 증가로 주요 API 응답 시간이 느려지는 문제가 있었습니다.", process: "쿼리 실행 계획과 애플리케이션 지표를 분석했습니다.", problemSolution: "복합 인덱스와 캐시 전략을 적용했습니다.", outcome: "평균 응답 시간을 35% 개선했습니다.", technologies: "Spring Boot, PostgreSQL, Redis", startDate: "2024-01", endDate: "2024-06", url: "" } },
          { section: "training", sortOrder: 0, data: { name: "클라우드 기반 웹 개발 과정", organization: "예시 교육원", startDate: "2022-06", endDate: "2022-12", completionStatus: "수료", hours: "720", description: "백엔드, 프런트엔드, CI/CD 실습", technologies: "Java, React, Docker", proofUrl: "" } },
          { section: "certifications", sortOrder: 0, data: { name: "정보처리기사", issuer: "한국산업인력공단", acquiredDate: "2023-06", expiresDate: "", credentialId: "", grade: "", proofUrl: "" } },
          { section: "portfolio", sortOrder: 0, data: { title: "개발 포트폴리오", url: "https://example.com", description: "프로젝트와 기술 기록을 정리한 포트폴리오입니다.", role: "개인 프로젝트", startDate: "2024-01", endDate: "", technologies: "Next.js, TypeScript", featured: true } },
          { section: "military", sortOrder: 0, data: { militaryStatus: "해당 없음", branch: "", rank: "", specialty: "", startDate: "", endDate: "", exemptionReason: "", veterans: false, employmentProtection: false, employmentSubsidy: false, disability: false, notes: "" } },
          { section: "work-preferences", sortOrder: 0, data: { employmentTypes: "정규직", locations: "서울, 경기", salaryType: "면접 후 결정", salaryAmount: "", roles: "백엔드 개발자", industries: "IT 서비스", availableDate: "", notes: "" } },
        ],
      },
    },
  });
}

main()
  .finally(async () => prisma.$disconnect());
