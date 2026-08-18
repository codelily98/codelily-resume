import path from "node:path";
import { expect, test } from "@playwright/test";

test("shows the Lilyume brand across dashboard and editor", async ({ page, request }) => {
  const consoleIssues: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") consoleIssues.push(message.text());
  });

  const created = await request.post("/api/resumes", { data: { title: "브랜드 검증 이력서" } });
  expect(created.ok()).toBeTruthy();
  const { resume } = await created.json();
  const id = resume.id as string;

  try {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle("Lilyume");
    await expect(page.getByRole("link", { name: "Lilyume" })).toBeVisible();
    await expect(page.getByText("이력서 공방", { exact: true })).toHaveCount(0);
    await expect(page.locator("[data-nextjs-dialog-overlay]")).toHaveCount(0);

    await page.goto(`/resumes/${id}/edit?section=training`, { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "Lilyume" })).toBeVisible();
    await expect(page.getByText("이력서 공방", { exact: true })).toHaveCount(0);
    if (process.env.RESUME_EVIDENCE_DIR) {
      await page.screenshot({ path: path.join(process.env.RESUME_EVIDENCE_DIR, "lilyume-editor-desktop.png"), fullPage: false });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "Lilyume" })).toBeVisible();
    await expect(page.getByText("이력서 공방", { exact: true })).toHaveCount(0);
    if (process.env.RESUME_EVIDENCE_DIR) {
      await page.screenshot({ path: path.join(process.env.RESUME_EVIDENCE_DIR, "lilyume-dashboard-mobile.png"), fullPage: false });
    }

    expect(consoleIssues).toEqual([]);
  } finally {
    await request.delete(`/api/resumes/${id}`);
  }
});
