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
