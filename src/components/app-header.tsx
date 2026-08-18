import Link from "next/link";
import { FileText } from "lucide-react";

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
      </nav>
    </header>
  );
}
