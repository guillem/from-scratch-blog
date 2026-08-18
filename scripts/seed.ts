import { shouldRefuseHostedSeed, warnIfRemoteDatabaseUrl } from "../src/lib/env";
import { resetDb } from "../db";
import { seedDemoContent } from "../src/lib/seed";

if (shouldRefuseHostedSeed()) {
  console.error(
    "Refusing to seed a hosted Netlify database. Set ALLOW_PROD_SEED=true to override.",
  );
  process.exit(1);
}

warnIfRemoteDatabaseUrl();

if (!process.env.NETLIFY_DB_URL && process.env.NETLIFY !== "true") {
  console.error(
    "NETLIFY_DB_URL is not set. Run this via `netlify dev` or after `netlify database` is running.",
  );
  process.exit(1);
}

await resetDb();
await seedDemoContent();
console.log("Development fixtures written to the current database.");
