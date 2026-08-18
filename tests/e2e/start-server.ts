import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { NetlifyDB } from "@netlify/database-dev";
import { resetDb } from "../../db";
import { seedDemoContent } from "../../src/lib/seed";

const port = process.env.PORT || "4321";
const host = process.env.HOST || "127.0.0.1";

const database = new NetlifyDB({
  directory: ".test-db",
  logger: () => undefined,
});
const url = await database.start();
process.env.NETLIFY_DB_URL = url;
try {
  await database.reset();
} catch {
  // First run has nothing to reset.
}
await database.applyMigrations("./netlify/database/migrations");
await resetDb();
await seedDemoContent();

if (!existsSync("dist")) {
  await new Promise<void>((resolve, reject) => {
    const build = spawn("npx", ["astro", "build"], {
      stdio: "inherit",
      env: process.env,
    });
    build.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`astro build exited ${code}`));
    });
  });
}

const preview = spawn("npx", ["astro", "preview", "--host", host, "--port", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    NETLIFY_DB_URL: url,
    DEV_AUTH_BYPASS: "true",
    DEV_ADMIN_EMAIL: "admin@localhost",
    SITE_URL: `http://${host}:${port}`,
  },
});

const shutdown = async () => {
  preview.kill("SIGTERM");
  await resetDb();
  await database.stop();
};

process.on("SIGINT", () => {
  void shutdown().then(() => process.exit(0));
});
process.on("SIGTERM", () => {
  void shutdown().then(() => process.exit(0));
});

preview.on("exit", (code) => {
  void database.stop().finally(() => process.exit(code ?? 0));
});
