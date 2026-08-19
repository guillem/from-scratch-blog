import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NetlifyDB } from "@netlify/database-dev";
import { resetDb } from "../../db";
import { seedDemoContent } from "../../src/lib/seed";

const functionRoot = resolve(".netlify/v1/functions/ssr");
const handlerPath = resolve(functionRoot, "ssr.mjs");
const sanitizeHtmlPath = resolve(functionRoot, "node_modules/sanitize-html");
const chunkDir = resolve(functionRoot, ".netlify/build/chunks");

type Handler = (request: Request, context: { ip: string }) => Promise<Response>;

let database: NetlifyDB;
let handler: Handler;

function markdownChunkPath(): string {
  const name = readdirSync(chunkDir).find((file) => file.startsWith("markdown_"));
  if (!name) {
    throw new Error("Built markdown chunk not found. Run npm run build first.");
  }
  return resolve(chunkDir, name);
}

async function get(path: string): Promise<Response> {
  return handler(new Request(new URL(path, "https://ssr.test")), { ip: "127.0.0.1" });
}

beforeAll(async () => {
  if (!existsSync(handlerPath)) {
    throw new Error("Missing SSR function. Run npm run build before test:ssr.");
  }

  database = new NetlifyDB({
    directory: ".test-db-ssr",
    logger: () => undefined,
  });
  process.env.NETLIFY_DB_URL = await database.start();
  process.env.SITE_URL = "https://ssr.test";
  try {
    await database.reset();
  } catch {
    // First run has nothing to reset.
  }
  await database.applyMigrations("./netlify/database/migrations");
  await resetDb();
  await seedDemoContent();

  const mod = await import(pathToFileURL(handlerPath).href);
  handler = mod.default;
});

afterAll(async () => {
  await resetDb();
  // Stopping the ephemeral engine drops the function's pool; ignore that.
  process.once("uncaughtException", (error) => {
    if (error instanceof Error && /Connection terminated/.test(error.message)) {
      return;
    }
    throw error;
  });
  await database?.stop();
});

describe("built function module graph", () => {
  it("can require the packaged sanitize-html from Node", () => {
    const output = execFileSync(
      process.execPath,
      [
        "-e",
        `const sanitize = require(${JSON.stringify(sanitizeHtmlPath)}); process.stdout.write(sanitize("<b>ok</b><script>x</script>"));`,
      ],
      { encoding: "utf8" },
    );
    expect(output).toContain("<b>ok</b>");
    expect(output.toLowerCase()).not.toContain("<script");
  });

  it("loads the built markdown chunk without Vite", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `await import(${JSON.stringify(pathToFileURL(markdownChunkPath()).href)}); process.stdout.write("loaded");`,
      ],
      { encoding: "utf8" },
    );
    expect(output).toBe("loaded");
  });
});

describe("built Netlify SSR function", () => {
  it("renders a published permalink", async () => {
    const response = await get("/posts/hello");
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(body).toContain("Hello from a reusable blog");
    expect(body).toContain('const greeting = "hello"');
  });

  it("hides drafts and missing slugs with 404, not 500", async () => {
    const draft = await get("/posts/secret-draft");
    const missing = await get("/posts/does-not-exist");
    expect(draft.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await draft.text()).toContain("Page not found");
  });

  it("serves RSS and Atom from the built handler", async () => {
    const home = await get("/");
    const rss = await get("/rss.xml");
    const atom = await get("/atom.xml");
    expect(home.status).toBe(200);
    expect(rss.status).toBe(200);
    const rssBody = await rss.text();
    expect(rssBody).toContain("Hello from a reusable blog");
    expect(rssBody).not.toContain("secret-draft");
    expect(atom.status).toBe(200);
    expect(await atom.text()).toContain("Hello from a reusable blog");
  });
});
