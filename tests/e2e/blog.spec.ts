import { expect, test } from "@playwright/test";
import { siteConfig } from "../../src/config/site";

test("lists published posts and hides drafts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: siteConfig.title })).toBeVisible();
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

  const atom = await request.get("/atom.xml");
  expect(atom.ok()).toBeTruthy();
  expect(atom.headers()["content-type"]).toMatch(/atom/i);
  expect(await atom.text()).toContain("Hello from a reusable blog");
  expect(await atom.text()).not.toContain("secret-draft");

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Disallow: /admin");
  expect(await robots.text()).toContain("Sitemap:");
});

test("identity hashes on the homepage redirect to login", async ({ page }) => {
  await page.goto("/#invite_token=e2e-invite");
  await expect(page).toHaveURL(/\/login/);
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

  const origin = new URL(baseURL ?? "http://127.0.0.1:4321").origin;
  const preview = await request.post("/api/admin/preview", {
    headers: { Origin: origin },
    data: { markdown: "**hello**" },
  });
  expect(preview.ok()).toBeTruthy();
  expect(preview.headers()["cache-control"]).toMatch(/private/);
  const previewBody = (await preview.json()) as { html: string };
  expect(previewBody.html).toContain("<strong>hello</strong>");

  const csrf = await request.post("/api/admin/preview", {
    headers: { Origin: "https://evil.example" },
    data: { markdown: "hello" },
  });
  expect(csrf.status()).toBe(403);
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

test("admin can preview a draft, publish an edit, and delete the post", async ({
  page,
}) => {
  await page.goto("/admin/posts/new");
  await page.getByLabel("Title").fill("Lifecycle draft");
  await page.getByLabel("Slug").fill("lifecycle-draft");
  await page.getByLabel("Body (Markdown)").fill("Only visible as a draft preview.");
  await page.getByLabel("Status").selectOption("draft");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Edit post" })).toBeVisible();

  await page.getByRole("link", { name: "Preview draft" }).click();
  await expect(page.getByRole("status")).toContainText("Draft preview");
  await expect(page.getByRole("heading", { name: "Lifecycle draft" })).toBeVisible();
  const publicDraft = await page.goto("/posts/lifecycle-draft");
  expect(publicDraft?.status()).toBe(404);

  await page.goto("/admin");
  await page.getByRole("link", { name: "Lifecycle draft" }).click();
  await page.getByLabel("Title").fill("Lifecycle published");
  await page.getByLabel("Status").selectOption("published");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Edit post" })).toBeVisible();

  await page.goto("/posts/lifecycle-draft");
  await expect(
    page.getByRole("heading", { name: "Lifecycle published" }),
  ).toBeVisible();

  await page.goto("/admin");
  await page.getByRole("link", { name: "Lifecycle published" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete post" }).click();
  await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lifecycle published" })).toHaveCount(0);

  const deleted = await page.goto("/posts/lifecycle-draft");
  expect(deleted?.status()).toBe(404);
});

test("admin can create and delete a tag", async ({ page }) => {
  await page.goto("/admin/tags");
  await page.getByLabel("Name").fill("E2E Topic");
  await page.getByRole("button", { name: "Add tag" }).click();
  await expect(page.getByRole("cell", { name: "E2E Topic" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("row", { name: /E2E Topic/ })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByRole("cell", { name: "E2E Topic" })).toHaveCount(0);
});
