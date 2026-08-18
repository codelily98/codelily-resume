import { ResumeEditor } from "@/components/resume-editor";

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResumeEditor id={id} />;
}
