# Lilyume

로컬 PostgreSQL 또는 Supabase에 이력서를 저장하고, A4 미리보기와 브라우저 인쇄 기능으로 회사 제출용 PDF를 만드는 개인 이력서 애플리케이션입니다.

## 주요 기능

- 여러 이력서 생성, 편집, 복제, 삭제
- 개인정보, 기술 스택, 학력, 경력, 경력기술서, 교육, 자격증, 포트폴리오, 병역·우대사항, 희망근무조건 입력
- 반복 항목 추가, 수정, 복제, 삭제, 위/아래 이동, 출력 포함 여부 설정
- TanStack Query 기반 조회, mutation, 자동 저장 상태 표시
- PostgreSQL/Supabase Postgres + Prisma 영구 저장
- Supabase Auth 이메일·비밀번호 로그인과 사용자별 데이터 분리
- 로컬 파일 시스템과 Supabase Storage 자동 전환
- 증명사진 업로드(JPEG/PNG/WebP, 최대 5MB)
- 교육·자격증 증빙 파일 첨부(항목당 최대 5개, 파일당 10MB)와 다운로드·삭제
- 키 발급이 필요 없는 카카오 우편번호 서비스 주소 검색과 직접 입력 폴백
- 이력서 JSON 백업/복원과 사진·증빙 파일 자산 포함
- 대학알리미/OpenDART 연동이 설정된 경우 학교·회사 검색
- 외부 API가 없거나 실패해도 항상 직접 입력 가능
- 데스크톱 3열 편집기, 태블릿·모바일 반응형 편집기
- 작성 화면의 독립 스크롤 A4 미리보기
- A4 미리보기와 브라우저 `PDF로 저장`
- 민감 정보와 섹션별 출력 제외

## 요구 환경

- Node.js 22 이상
- pnpm 11 이상
- Docker Desktop 또는 로컬 PostgreSQL 16 이상

## 빠른 실행

PowerShell에서 프로젝트 폴더로 이동한 뒤 실행합니다.

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d db
pnpm db:generate
pnpm db:deploy
pnpm dev
```

브라우저에서 <http://localhost:3000>을 엽니다.

가상 데이터로 전체 화면을 확인하려면 다음 명령을 한 번 실행합니다.

```powershell
pnpm db:seed
```

seed에는 실제 개인정보가 아닌 명백한 가상 정보만 포함되어 있습니다.

## 환경 변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `DATABASE_URL` | 예 | 로컬 PostgreSQL 연결 문자열 |
| `SUPABASE_URL` | 배포 시 | Supabase 프로젝트 URL |
| `SUPABASE_SECRET_KEY` | 배포 시 | 서버 전용 Supabase Secret key |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth 사용 시 | 브라우저 세션용 Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Auth 사용 시 | 브라우저에 공개 가능한 Supabase Publishable key |
| `SUPABASE_STORAGE_BUCKET` | 배포 시 | 비공개 파일 버킷 이름, 기본값 `resume-assets` |
| `PUBLIC_DATA_SERVICE_KEY` | 아니요 | 대학알리미 공공데이터 API 인증키 |
| `OPEN_DART_API_KEY` | 아니요 | OpenDART API 인증키 |

외부 API 키가 없어도 이력서 작성, 저장, 백업, 미리보기, 인쇄 기능은 모두 동작합니다. 실제 키는 `.env`에만 저장하며 Git에 커밋하지 않습니다.

주소 검색은 카카오 우편번호 서비스를 사용하며 별도 키가 필요하지 않습니다. 인터넷이 연결되지 않았거나 서비스를 불러오지 못한 경우에도 주소 칸에 직접 입력할 수 있습니다.

`SUPABASE_URL`과 `SUPABASE_SECRET_KEY`를 함께 설정하면 사진과 증빙 파일은 Supabase Storage에 저장됩니다. 둘 중 하나라도 없으면 기존처럼 `data/uploads/`를 사용하므로 로컬 개발 흐름은 유지됩니다. Secret key는 브라우저 코드나 `NEXT_PUBLIC_` 환경 변수에 절대 넣지 않습니다.

## Vercel + Supabase 배포

1. Supabase 프로젝트를 만들고 Prisma 마이그레이션을 적용합니다.
2. `resume-assets`라는 비공개 Storage 버킷을 만들고 파일 크기 제한을 10MB로 설정합니다.
3. Vercel 프로젝트를 GitHub 저장소와 연결합니다.
4. Vercel의 Production과 Preview 환경에 `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_STORAGE_BUCKET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정합니다.
5. `DATABASE_URL`은 Vercel용 Supavisor Transaction pooler 주소를 사용하고 쿼리 문자열에 `pgbouncer=true&connection_limit=1`을 포함합니다.
6. 첫 접속 시 사용할 이메일과 8자 이상의 비밀번호로 Lilyume 계정을 만듭니다. 첫 계정 생성 후 공개 가입은 자동으로 닫힙니다.

업로드는 Vercel 함수의 4.5MB 본문 제한을 통과하도록 서버에서 짧게 유효한 서명 URL을 발급하고 브라우저가 비공개 Supabase Storage로 직접 전송합니다. 다운로드도 짧게 유효한 서명 URL로 이동하므로 최대 10MB 증빙 파일을 그대로 사용할 수 있습니다.

## PDF 저장

1. 편집 화면에서 `미리보기`로 출력 정보를 확인합니다.
2. `PDF로 저장`을 누릅니다.
3. 브라우저 인쇄 창의 프린터에서 `PDF로 저장`을 선택합니다.
4. 용지는 A4, 배율은 100%, 브라우저 머리글/바닥글은 끄는 것을 권장합니다.

인쇄 전용 화면에서는 서비스 제목과 개발 도구 버튼을 렌더링하지 않습니다.

인쇄 화면은 편집 버튼과 내비게이션을 자동으로 제외하며, A4 `210mm x 297mm` 기준으로 렌더링됩니다.

## 데이터와 백업

- PostgreSQL 데이터는 Docker 볼륨 `resume_pg_data`에 저장됩니다.
- 로컬에서는 사진과 증빙 파일이 `data/uploads/<resumeId>/`에, 배포 환경에서는 비공개 Supabase Storage에 저장됩니다.
- `백업 다운로드`는 이력서 JSON과 사진·증빙 파일의 Base64 데이터를 함께 내보냅니다.
- `백업 가져오기`는 기존 이력서를 덮어쓰지 않고 새 이력서로 복원합니다.
- API 키와 DB 연결 문자열은 백업에 포함되지 않습니다.

## 개발 명령

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Playwright를 처음 사용할 때 브라우저가 없다면 다음 명령으로 Chromium을 설치합니다.

```powershell
pnpm exec playwright install chromium
```

## 구조

```text
src/app/                 Next.js 화면과 Route Handler
src/components/          편집기, 폼, A4 문서 컴포넌트
src/hooks/               자동 저장 로직
src/lib/                 Prisma 서비스, 검증, 섹션 정의, 계산 유틸리티
prisma/                  스키마, 마이그레이션, 가상 seed
docs/design/             구현 기준이 된 화면 콘셉트와 디자인 시스템
data/uploads/            로컬 사진 저장소(Git 제외)
```

## 설계 메모

- Next.js App Router가 전체 URL을 단독으로 관리합니다.
- TanStack Query는 브라우저의 서버 상태와 mutation만 관리합니다.
- 폼의 입력 중 상태는 React Hook Form이 소유합니다.
- TanStack Router는 Next.js 라우터와 역할이 겹치므로 1차 버전에 중복 설치하지 않았습니다.
- 서버 측 PDF 파일 생성은 범위에서 제외하고 브라우저 인쇄를 사용합니다.

## 인증과 데이터 보호

- 페이지와 모든 이력서·첨부파일 API는 Supabase Auth 세션을 확인합니다.
- 이력서는 Auth 사용자 ID로 구분하며 다른 계정의 URL을 알아도 조회하거나 수정할 수 없습니다.
- Auth 도입 전에 저장된 이력서는 첫 로그인 계정에 자동 귀속됩니다.
- Supabase Secret key와 데이터베이스 연결 문자열은 서버에서만 사용합니다.

## 현재 제한 사항

- 회사 검색은 OpenDART 공시대상 회사만 포함합니다.
- 대학알리미는 국내 고등교육 기관 중심이며, 결과가 없는 학교는 직접 입력해야 합니다.
- 브라우저별 인쇄 결과 차이를 줄이기 위해 Chromium 또는 Edge 사용을 권장합니다.
