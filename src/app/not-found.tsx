import Link from "next/link";

export default function NotFound() {
  return <main className="state-panel full-page-state"><h1>페이지를 찾을 수 없습니다.</h1><p>이력서가 삭제되었거나 주소가 올바르지 않습니다.</p><Link className="button button-primary button-md" href="/">내 이력서로 돌아가기</Link></main>;
}
