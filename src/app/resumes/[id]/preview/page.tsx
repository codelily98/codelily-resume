import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/print-toolbar";
import { ResumeDocument } from "@/components/resume-document";
import { getResume } from "@/lib/resume-service";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resume = await getResume(id);
  if (!resume) notFound();
  return <main className="print-workspace"><PrintToolbar resumeId={id} /><ResumeDocument resume={resume} /></main>;
}
