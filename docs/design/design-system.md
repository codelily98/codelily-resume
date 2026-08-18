# Lilyume 디자인 시스템

## 기준 화면

- `concept-dashboard.png`: 이력서 목록과 첫 진입 화면
- `concept-editor-desktop.png`: 데스크톱 편집기
- `concept-editor-mobile.png`: 모바일 편집기
- `concept-print-preview.png`: A4 미리보기와 인쇄 화면

## 시각 원칙

- 제품 UI의 배경은 순백색이며, 미리보기 작업 영역만 차가운 밝은 회색을 사용한다.
- 문서 편집 도구답게 얇은 선, 정돈된 열, 날짜 축을 주된 시각 언어로 사용한다.
- 코발트 파랑은 선택, 포커스, 링크, 주요 버튼에만 제한적으로 사용한다.
- 장식용 그라데이션, 글래스모피즘, 대형 라운드 컨테이너, 반복 카드 그리드를 사용하지 않는다.
- A4 문서는 그림자나 색보다 타이포그래피와 정렬로 위계를 만든다.

## 디자인 토큰

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--background` | `#ffffff` | 앱과 문서 배경 |
| `--workspace` | `#f4f6f8` | A4 주변 작업 영역 |
| `--surface-subtle` | `#f8fafc` | 선택 행, 보조 영역 |
| `--text` | `#111827` | 기본 텍스트 |
| `--muted` | `#667085` | 보조 설명 |
| `--border` | `#d8dee7` | 입력과 구분선 |
| `--border-strong` | `#aeb8c6` | 문서 주요 구분선 |
| `--accent` | `#0b5fff` | 주요 버튼과 선택 상태 |
| `--accent-hover` | `#0048d8` | 버튼 hover |
| `--success` | `#168b50` | 저장 완료 |
| `--danger` | `#c9362b` | 삭제와 오류 |
| `--focus` | `0 0 0 3px rgba(11, 95, 255, .18)` | 포커스 링 |

반경은 입력/버튼 `8px`, 보조 패널 `10px`, A4 문서 `0px`를 기본으로 한다. 그림자는 A4 문서와 팝오버에만 사용한다.

## 타이포그래피

- 글꼴: Pretendard를 우선하고 `Noto Sans KR`, `Malgun Gothic`, sans-serif로 폴백한다.
- 앱 H1: 36px/1.2, 700
- 편집 섹션 제목: 24px/1.3, 700
- 앱 본문: 14px/1.55, 400
- 필드 라벨: 13px/1.4, 600
- 컨트롤: 13px/1, 600
- A4 제목: 25px/1.3, 700
- A4 섹션 제목: 14px/1.3, 700
- A4 본문: 10pt/1.5, 400
- A4 보조 텍스트: 8.5pt/1.45, 400

## 레이아웃

- 데스크톱 헤더: 64px 높이, 하단 1px 선.
- 편집기: 좌측 208px, 중앙 최소 520px, 우측 미리보기 40% 이내.
- 대시보드: 최대 폭 1240px, 카드 대신 헤더가 있는 문서 행 목록.
- 모바일: 상단 헤더와 가로 섹션 탭, 단일 열 폼, 하단 고정 작업 막대.
- A4: `210mm x 297mm`, 화면 미리보기는 실제 비율 유지, 인쇄 여백 12mm 14mm.

## 컴포넌트 패밀리

- 버튼: primary, secondary, ghost, danger
- 입력: text, textarea, select, checkbox, switch
- 앱 셸: header, section rail, form workspace, preview rail
- 반복 항목: 편집 가능한 list row, visibility control, duplicate/delete, reorder
- 상태: save status, inline error, empty state, loading skeleton
- 문서: profile header, summary strip, skill tags, dated section row, narrative block

## 아이콘

Lucide outline 아이콘을 16px 또는 18px, `stroke-width: 1.8`로 사용한다. 버튼 레이블이 분명하면 아이콘을 생략한다. 화살표, 더보기, 인쇄, 저장, 복제, 삭제, 위/아래 이동에만 제한한다.

## 허용된 첫 화면 문구

- 대시보드: `Lilyume`, `내 이력서`, `작성 중인 이력서를 관리하고 이어서 편집할 수 있습니다.`, `새 이력서 만들기`, `연동 설정`, `백업 가져오기`
- 편집기: 현재 이력서 제목, `저장됨/저장 중/저장 실패`, `미리보기`, `PDF로 저장`, 섹션 이름, 현재 폼 레이블
- 인쇄 미리보기: `편집으로 돌아가기`, `A4 미리보기`, `PDF로 저장`

## 반응형 원칙

- `1280px` 이상에서 3열 편집기를 사용한다.
- `768px`~`1279px`에서는 오른쪽 실시간 미리보기를 숨기고 별도 미리보기 버튼을 사용한다.
- `767px` 이하에서는 좌측 레일을 가로 탭으로 바꾸고 하단 작업 막대를 고정한다.
- 모든 터치 대상은 최소 40px, 주요 모바일 버튼은 48px 높이를 유지한다.

## 모션

- 저장 상태, 선택 행, 팝오버는 120~180ms의 짧은 opacity/transform 전환만 사용한다.
- 문서 미리보기에는 애니메이션을 사용하지 않는다.
- `prefers-reduced-motion`에서는 전환을 제거한다.
