import { expect, test } from "@playwright/test";
import path from "node:path";

function proofFile(name: string) {
  return { name, mimeType: "application/pdf", buffer: Buffer.from(`%PDF-1.4\n${name}\n%%EOF`) };
}

test("attaches up to five proof files to training and certifications", async ({ page, request }) => {
  const created = await request.post("/api/resumes", { data: { title: "증빙 파일 검증" } });
  expect(created.ok()).toBeTruthy();
  const { resume } = await created.json();
  const id = resume.id as string;
  let importedId: string | undefined;

  try {
    await page.goto(`/resumes/${id}/edit`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "교육", exact: true }).click();
    await page.getByRole("button", { name: "교육 추가" }).click();
    await page.getByLabel("교육명").fill("Next.js 실무 과정");

    const fiveFiles = Array.from({ length: 5 }, (_, index) => proofFile(`교육증빙-${index + 1}.pdf`));
    await page.locator(".proof-file-picker input").setInputFiles(fiveFiles);
    await expect(page.locator(".proof-file-row.is-pending")).toHaveCount(5);
    await page.getByRole("button", { name: "항목 저장" }).click();

    const trainingRow = page.locator(".editable-row").filter({ hasText: "Next.js 실무 과정" });
    await expect(trainingRow).toBeVisible();
    await expect(page.locator(".item-form-panel")).toHaveCount(0, { timeout: 10_000 });
    await trainingRow.getByRole("button", { name: "수정" }).click();
    await expect(page.locator(".proof-file-row")).toHaveCount(5);
    await expect(page.locator(".proof-file-picker input")).toBeDisabled();
    if (process.env.RESUME_EVIDENCE_DIR) {
      await page.screenshot({ path: path.join(process.env.RESUME_EVIDENCE_DIR, "training-proof-files.png"), fullPage: true });
    }

    const trainingPayload = await request.get(`/api/resumes/${id}`);
    const trainingResume = (await trainingPayload.json()).resume;
    const trainingItem = trainingResume.items.find((item: { section: string }) => item.section === "training");
    expect(trainingItem.data.proofFiles).toHaveLength(5);

    const firstProof = trainingItem.data.proofFiles[0];
    const download = await request.get(`/api/resumes/${id}/sections/training/${trainingItem.id}/proofs/${firstProof.id}`);
    expect(download.ok()).toBeTruthy();
    expect(download.headers()["content-disposition"]).toContain("attachment");

    const sixth = await request.post(`/api/resumes/${id}/sections/training/${trainingItem.id}/proofs`, {
      multipart: { files: proofFile("여섯번째.pdf") },
    });
    expect(sixth.status()).toBe(400);
    expect((await sixth.json()).error.message).toContain("최대 5개");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "교육증빙-1.pdf 삭제" }).click();
    await expect(page.locator(".proof-file-row")).toHaveCount(4);
    await page.getByRole("button", { name: "닫기" }).click();

    await page.getByRole("button", { name: "자격증", exact: true }).click();
    await page.getByRole("button", { name: "자격증 추가" }).click();
    await page.getByLabel("자격증명").fill("정보처리기사");
    await page.locator(".proof-file-picker input").setInputFiles(proofFile("자격증명서.pdf"));
    await page.getByRole("button", { name: "항목 저장" }).click();
    const certificationRow = page.locator(".editable-row").filter({ hasText: "정보처리기사" });
    await expect(certificationRow).toBeVisible();

    await expect.poll(async () => {
      const response = await request.get(`/api/resumes/${id}`);
      const payload = await response.json();
      return payload.resume.items.find((item: { section: string }) => item.section === "certifications")?.data.proofFiles?.length;
    }).toBe(1);

    const backupResponse = await request.get(`/api/resumes/${id}/export`);
    expect(backupResponse.ok()).toBeTruthy();
    const backup = await backupResponse.json();
    expect(backup.assets.proofs).toHaveLength(5);
    const imported = await request.post("/api/resumes/import", { data: backup });
    expect(imported.ok()).toBeTruthy();
    const importedResume = (await imported.json()).resume;
    importedId = importedResume.id;
    const importedTraining = importedResume.items.find((item: { section: string }) => item.section === "training");
    const importedProof = importedTraining.data.proofFiles[0];
    const importedDownload = await request.get(`/api/resumes/${importedId}/sections/training/${importedTraining.id}/proofs/${importedProof.id}`);
    expect(importedDownload.ok()).toBeTruthy();

    if (process.env.RESUME_EVIDENCE_DIR) {
      await expect(page.locator(".item-form-panel")).toHaveCount(0, { timeout: 10_000 });
      await certificationRow.getByRole("button", { name: "수정" }).click();
      await expect(page.locator(".proof-file-row")).toHaveCount(1);
      await page.screenshot({ path: path.join(process.env.RESUME_EVIDENCE_DIR, "certification-proof-file.png"), fullPage: true });
    }
  } finally {
    if (importedId) await request.delete(`/api/resumes/${importedId}`);
    await request.delete(`/api/resumes/${id}`);
  }
});
