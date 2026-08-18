import path from "node:path";
import { expect, test } from "@playwright/test";

test("uses day-level dates, scrolls the editor preview, and keeps print output clean", async ({ page, request }) => {
  const consoleIssues: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") consoleIssues.push(message.text());
  });
  const created = await request.post("/api/resumes", { data: { title: "날짜 및 인쇄 검증" } });
  expect(created.ok()).toBeTruthy();
  const { resume } = await created.json();
  const id = resume.id as string;

  try {
    await page.goto(`/resumes/${id}/edit?section=training`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(new RegExp(`/resumes/${id}/edit\\?section=training`));
    await expect(page.getByRole("heading", { name: "교육", exact: true })).toBeVisible();
    await expect(page.locator("[data-nextjs-dialog-overlay]")).toHaveCount(0);
    await page.getByRole("button", { name: "교육 추가" }).click();
    await expect(page.getByLabel("시작")).toHaveAttribute("type", "date");
    await expect(page.getByLabel("종료")).toHaveAttribute("type", "date");
    await page.getByLabel("교육명").fill("일 단위 교육 과정");
    await page.getByLabel("시작").fill("2026-08-01");
    await page.getByLabel("종료").fill("2026-08-18");
    await page.getByRole("button", { name: "항목 저장" }).click();
    await expect(page.locator(".item-form-panel")).toHaveCount(0);

    await page.getByRole("button", { name: "자격증", exact: true }).click();
    await page.getByRole("button", { name: "자격증 추가" }).click();
    await expect(page.getByLabel("취득일")).toHaveAttribute("type", "date");
    await expect(page.getByLabel("만료일")).toHaveAttribute("type", "date");
    await page.getByLabel("자격증명").fill("일 단위 자격증");
    await page.getByLabel("취득일").fill("2026-08-18");
    await page.getByLabel("만료일").fill("2028-08-17");
    await page.getByRole("button", { name: "항목 저장" }).click();
    await expect(page.locator(".item-form-panel")).toHaveCount(0);

    const saved = await request.get(`/api/resumes/${id}`);
    const savedResume = (await saved.json()).resume;
    expect(savedResume.items.find((item: { section: string }) => item.section === "training").data.startDate).toBe("2026-08-01");
    expect(savedResume.items.find((item: { section: string }) => item.section === "certifications").data.acquiredDate).toBe("2026-08-18");

    const manyTrainingItems = Array.from({ length: 28 }, (_, index) => ({
      isVisible: true,
      data: {
        name: `스크롤 검증 교육 ${index + 1}`,
        organization: "테스트 교육기관",
        startDate: "2026-08-01",
        endDate: "2026-08-18",
        description: "긴 이력서에서도 작성 화면의 미리보기 영역을 독립적으로 스크롤할 수 있어야 합니다.",
      },
    }));
    const replaced = await request.put(`/api/resumes/${id}/sections/training`, { data: { items: manyTrainingItems } });
    expect(replaced.ok()).toBeTruthy();
    await page.goto(`/resumes/${id}/edit?section=training`, { waitUntil: "networkidle" });

    const frame = page.locator(".mini-document-frame");
    const beforeScroll = await frame.evaluate((element) => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight, scrollTop: element.scrollTop }));
    expect(beforeScroll.scrollHeight).toBeGreaterThan(beforeScroll.clientHeight);
    await frame.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect.poll(() => frame.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    if (process.env.RESUME_EVIDENCE_DIR) {
      await page.screenshot({ path: path.join(process.env.RESUME_EVIDENCE_DIR, "scrollable-editor-preview.png"), fullPage: false });
    }

    await page.addInitScript(() => { window.print = () => undefined; });
    await page.goto(`/resumes/${id}/print`, { waitUntil: "networkidle" });
    await expect(page).toHaveTitle("");
    await expect(page.getByText("Lilyume", { exact: true })).toHaveCount(0);
    await expect(page.locator(".tsqd-open-btn-container")).toHaveCount(0);
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".print-toolbar")).toBeHidden();
    if (process.env.RESUME_EVIDENCE_DIR) {
      await page.screenshot({ path: path.join(process.env.RESUME_EVIDENCE_DIR, "clean-print-preview.png"), fullPage: false });
      await page.pdf({
        path: path.join(process.env.RESUME_EVIDENCE_DIR, "resume-print-output.pdf"),
        format: "A4",
        printBackground: true,
        displayHeaderFooter: false,
      });
    }
    expect(consoleIssues).toEqual([]);
  } finally {
    await request.delete(`/api/resumes/${id}`);
  }
});
