import Link from "next/link";
import { FileText, LogOut } from "lucide-react";

export function AppHeader({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="app-header no-print">
      <Link className="brand" href="/">
        <span className="brand-mark"><FileText aria-hidden="true" size={18} /></span>
        <span>Lilyume</span>
      </Link>
      <nav className="header-actions" aria-label="주요 메뉴">
        <Link className="header-link" href="/settings/integrations">연동 설정</Link>
        {actions}
        <form action="/auth/signout" method="post">
          <button className="header-link logout-button" type="submit"><LogOut aria-hidden="true" size={15} />로그아웃</button>
        </form>
      </nav>
    </header>
  );
}
