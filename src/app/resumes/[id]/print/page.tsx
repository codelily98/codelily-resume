import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PrintToolbar } from "@/components/print-toolbar";
import { ResumeDocument } from "@/components/resume-document";
import { getResume } from "@/lib/resume-service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "" } };

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resume = await getResume(id);
  if (!resume) notFound();
  return <main className="print-workspace print-route"><PrintToolbar resumeId={id} autoPrint /><ResumeDocument resume={resume} /></main>;
}
