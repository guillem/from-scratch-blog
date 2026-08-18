import { expect, test } from "@playwright/test";

test("lists published posts and hides drafts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "From Scratch" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Hello from a reusable blog" }),
  ).toBeVisible();
  await expect(page.getByText("A draft that must stay private")).toHaveCount(0);

  await page.getByRole("link", { name: "Hello from a reusable blog" }).click();
  await expect(
    page.getByRole("heading", { name: "Hello from a reusable blog" }),
  ).toBeVisible();
  await expect(page.locator("pre")).toContainText('const greeting = "hello"');

  const draft = await page.goto("/posts/secret-draft");
  expect(draft?.status()).toBe(404);
});

test("filters posts by tag and exposes feeds", async ({ page, request }) => {
  await page.goto("/tags/writing");
  await expect(
    page.getByRole("link", { name: "Hello from a reusable blog" }),
  ).toBeVisible();

  const rss = await request.get("/rss.xml");
  expect(rss.ok()).toBeTruthy();
  expect(await rss.text()).toContain("Hello from a reusable blog");
  expect(await rss.text()).not.toContain("secret-draft");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("/posts/hello");
});

test("login next param only accepts same-origin relative paths", async ({ page }) => {
  await page.goto("/login?next=https://evil.example");
  await expect(page.locator('input[name="next"]')).toHaveValue("/admin");

  await page.goto("/login?next=//evil.example");
  await expect(page.locator('input[name="next"]')).toHaveValue("/admin");

  await page.goto("/login?next=/admin/posts/new");
  await expect(page.locator('input[name="next"]')).toHaveValue("/admin/posts/new");
});

test("security headers restrict scripts and keep admin APIs private", async ({
  request,
  baseURL,
}) => {
  const home = await request.get("/");
  const scriptSrc = (home.headers()["content-security-policy"] ?? "")
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith("script-src"));
  expect(scriptSrc).toBe("script-src 'self'");

  const preview = await request.post("/api/admin/preview", {
    headers: { Origin: new URL(baseURL ?? "http://127.0.0.1:4321").origin },
    data: { markdown: "hello" },
  });
  expect(preview.headers()["cache-control"]).toMatch(/private/);
});

test("draft-only tags are not listed publicly", async ({ page }) => {
  await page.goto("/admin/posts/new");
  await page.getByLabel("Title").fill("Draft tagged post");
  await page.getByLabel("Slug").fill("draft-tagged-e2e");
  await page.getByLabel("Body (Markdown)").fill("Still a draft.");
  await page.getByLabel("Tags").fill("draft-only-tag");
  await page.getByLabel("Status").selectOption("draft");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Edit post" })).toBeVisible();

  const response = await page.goto("/tags/draft-only-tag");
  expect(response?.status()).toBe(404);
});

test("authenticated admin can create a post", async ({ page }) => {
  await page.goto("/admin/posts/new");
  await page.getByLabel("Title").fill("E2E created post");
  await page.getByLabel("Slug").fill("e2e-created-post");
  await page.getByLabel("Body (Markdown)").fill("Written by the end-to-end test.");
  await page.getByLabel("Status").selectOption("published");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Edit post" })).toBeVisible();

  await page.goto("/posts/e2e-created-post");
  await expect(page.getByRole("heading", { name: "E2E created post" })).toBeVisible();
});
