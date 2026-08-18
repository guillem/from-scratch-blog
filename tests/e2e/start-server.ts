import { spawn } from "node:child_process";
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

// The Netlify adapter does not support `astro preview`. E2E runs against
// `astro dev` with the same database URL the production server would use.
const server = spawn("npx", ["astro", "dev", "--host", host, "--port", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    NETLIFY_DB_URL: url,
    NETLIFY_DEV: "true",
    DEV_AUTH_BYPASS: "true",
    DEV_ADMIN_EMAIL: "admin@localhost",
    SITE_URL: `http://${host}:${port}`,
  },
});

const shutdown = async () => {
  server.kill("SIGTERM");
  await resetDb();
  await database.stop();
};

process.on("SIGINT", () => {
  void shutdown().then(() => process.exit(0));
});
process.on("SIGTERM", () => {
  void shutdown().then(() => process.exit(0));
});

server.on("exit", (code) => {
  void database.stop().finally(() => process.exit(code ?? 0));
});
