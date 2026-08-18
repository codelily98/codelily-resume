import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/print-toolbar";
import { ResumeDocument } from "@/components/resume-document";
import { getResume } from "@/lib/resume-service";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const resume = await getResume(user.id, id);
  if (!resume) notFound();
  return <main className="print-workspace"><PrintToolbar resumeId={id} /><ResumeDocument resume={resume} /></main>;
}
