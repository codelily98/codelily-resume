import { expect, test } from "@playwright/test";
import path from "node:path";

test("creates, autosaves, previews, and deletes a resume", async ({ page, request }) => {
  let createdId: string | undefined;
  try {
  await page.goto("/");
  await expect(page).toHaveTitle(/Lilyume/);
  await expect(page.getByRole("heading", { name: "내 이력서" })).toBeVisible();

  await page.getByRole("link", { name: "새 이력서 만들기" }).first().click();
  await page.getByLabel("이력서 제목").fill("E2E 검증 이력서");
  await page.getByRole("button", { name: "만들고 편집하기" }).click();
  await expect(page).toHaveURL(/\/resumes\/[^/]+\/edit/);

  createdId = page.url().match(/\/resumes\/([^/]+)\/edit/)?.[1];
  if (!createdId) throw new Error("생성된 이력서 ID를 확인할 수 없습니다.");

  await page.getByLabel("한 줄 소개").fill("자동 저장과 A4 출력을 검증하는 가상 이력서입니다.");
  await page.getByLabel("이름", { exact: true }).fill("테스트 사용자");
  await expect(page.getByText("저장됨", { exact: true })).toBeVisible({ timeout: 10_000 });

  const saved = await request.get(`/api/resumes/${createdId}`);
  expect(saved.ok()).toBeTruthy();
  const payload = await saved.json();
  expect(payload.resume.profile.name).toBe("테스트 사용자");

  await page.getByRole("button", { name: "기술 스택" }).click();
  await page.getByRole("button", { name: "기술 추가" }).click();
  const category = page.getByLabel("분류");
  expect(await category.locator("option").allTextContents()).toEqual(expect.arrayContaining(["라이브러리", "IDE"]));
  await category.selectOption("라이브러리");
  if (process.env.RESUME_EVIDENCE_DIR) {
    await page.screenshot({ path: path.join(process.env.RESUME_EVIDENCE_DIR, "skill-category-options.png"), fullPage: false });
  }
  await page.getByLabel("기술명").fill("Java");
  await page.getByRole("button", { name: "항목 저장" }).click();
  await expect(page.locator(".editable-row").filter({ hasText: "Java" })).toBeVisible();
  await page.getByRole("button", { name: "기술 추가" }).click();
  await page.getByLabel("기술명").fill("TypeScript");
  await page.getByRole("button", { name: "항목 저장" }).click();
  await expect(page.locator(".editable-row").filter({ hasText: "TypeScript" })).toBeVisible();

  const rows = page.locator(".editable-row");
  const firstDragHandle = rows.nth(0).getByRole("button", { name: "드래그하여 순서 변경" });
  await expect(firstDragHandle).toBeEnabled();
  const sourceBox = await firstDragHandle.boundingBox();
  const targetBox = await rows.nth(1).boundingBox();
  if (!sourceBox || !targetBox) throw new Error("드래그 대상 위치를 확인할 수 없습니다.");
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2 + 10, { steps: 3 });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height - 4, { steps: 8 });
  await page.mouse.up();
  await expect(rows.nth(0).locator("strong")).toHaveText("TypeScript");

  await page.getByRole("link", { name: "미리보기" }).first().click();
  await expect(page.getByRole("heading", { name: "자동 저장과 A4 출력을 검증하는 가상 이력서입니다." })).toBeVisible();
  await expect(page.locator(".resume-paper")).toBeVisible();

  } finally {
    if (createdId) await request.delete(`/api/resumes/${createdId}`);
  }
});
