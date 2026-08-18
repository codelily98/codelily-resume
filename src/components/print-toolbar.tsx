"use client";

import { ArrowLeft, FileDown } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function PrintToolbar({ resumeId, autoPrint = false }: { resumeId: string; autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(() => window.print(), 350);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  return (
    <div className="print-toolbar no-print">
      <Link className="button button-secondary button-md" href={`/resumes/${resumeId}/edit`}><ArrowLeft size={16} />편집으로 돌아가기</Link>
      <strong>A4 미리보기</strong>
      <Button variant="primary" onClick={() => window.print()}><FileDown size={16} />PDF로 저장</Button>
    </div>
  );
}
