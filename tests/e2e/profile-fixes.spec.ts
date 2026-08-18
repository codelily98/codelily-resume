import { expect, test } from "@playwright/test";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/69mQ6QAAAABJRU5ErkJggg==",
  "base64",
);

test("uploads a photo and saves custom gender and searched address", async ({ page, request }) => {
  const created = await request.post("/api/resumes", { data: { title: "프로필 오류 검증" } });
  expect(created.ok()).toBeTruthy();
  const { resume } = await created.json();
  const id = resume.id as string;

  try {
    await page.route("https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js*", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `window.kakao={Postcode:class{constructor(options){this.options=options}embed(element){const button=document.createElement("button");button.type="button";button.textContent="테스트 주소 선택";button.onclick=()=>this.options.oncomplete({userSelectedType:"R",roadAddress:"서울특별시 중구 세종대로 110",jibunAddress:"서울특별시 중구 태평로1가 31"});element.appendChild(button)}}};`,
      });
    });

    await page.goto(`/resumes/${id}/edit`, { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles({ name: "profile.png", mimeType: "image/png", buffer: onePixelPng });
    const photo = page.getByAltText("업로드한 증명사진");
    await expect(photo).toBeVisible();
    await expect(photo).toHaveAttribute("src", new RegExp(`/api/resumes/${id}/photo\\?v=`));
    const photoResponse = await request.get(`/api/resumes/${id}/photo`);
    expect(photoResponse.ok()).toBeTruthy();
    expect(photoResponse.headers()["content-type"]).toContain("image/png");

    await page.getByLabel("성별").selectOption("직접 입력");
    await page.getByLabel("성별 직접 입력").fill("비공개");

    await page.getByRole("button", { name: "주소 검색" }).click();
    await expect(page.getByRole("dialog", { name: "주소 검색" })).toBeVisible();
    await page.getByRole("button", { name: "테스트 주소 선택" }).click();
    await expect(page.getByLabel("주소", { exact: true })).toHaveValue("서울특별시 중구 세종대로 110");

    await expect.poll(async () => {
      const response = await request.get(`/api/resumes/${id}`);
      const payload = await response.json();
      return {
        gender: payload.resume.profile.gender,
        address: payload.resume.profile.address,
        hasPhoto: Boolean(payload.resume.profile.photoPath),
      };
    }, { timeout: 10_000 }).toEqual({ gender: "비공개", address: "서울특별시 중구 세종대로 110", hasPhoto: true });
  } finally {
    await request.delete(`/api/resumes/${id}/photo`);
    await request.delete(`/api/resumes/${id}`);
  }
});

test("uses the expanded editor layout at QHD resolution", async ({ page, request }) => {
  const created = await request.post("/api/resumes", { data: { title: "QHD 레이아웃 검증" } });
  expect(created.ok()).toBeTruthy();
  const { resume } = await created.json();
  const id = resume.id as string;

  try {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto(`/resumes/${id}/edit`, { waitUntil: "networkidle" });
    const metrics = await page.evaluate(() => ({
      formWidth: document.querySelector<HTMLElement>(".editor-form")?.getBoundingClientRect().width ?? 0,
      photoWidth: document.querySelector<HTMLElement>(".photo-preview")?.getBoundingClientRect().width ?? 0,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.formWidth).toBeGreaterThanOrEqual(900);
    expect(metrics.photoWidth).toBeGreaterThanOrEqual(100);
    expect(metrics.documentWidth).toBe(metrics.viewportWidth);
  } finally {
    await request.delete(`/api/resumes/${id}`);
  }
});
