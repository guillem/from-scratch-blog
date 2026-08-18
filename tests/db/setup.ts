import { afterAll, beforeAll, beforeEach } from "vitest";
import { NetlifyDB } from "@netlify/database-dev";
import { resetDb } from "../../db";

let database: NetlifyDB;

export async function startTestDatabase(): Promise<string> {
  database = new NetlifyDB({ logger: () => undefined });
  const url = await database.start();
  process.env.NETLIFY_DB_URL = url;
  await database.applyMigrations("./netlify/database/migrations");
  await resetDb();
  return url;
}

export async function resetTestDatabase(): Promise<void> {
  await resetDb();
  await database.reset();
  await database.applyMigrations("./netlify/database/migrations");
}

export async function stopTestDatabase(): Promise<void> {
  await resetDb();
  await database.stop();
}

beforeAll(async () => {
  await startTestDatabase();
});

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
});
