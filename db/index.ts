import { drizzle as drizzleNetlify } from "drizzle-orm/netlify-db";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

type BlogDb = ReturnType<typeof createDb>;

let instance: BlogDb | undefined;

function looksLikeNeonUrl(connectionString: string): boolean {
  return /neon\.tech|neondb/i.test(connectionString);
}

function createDb(connectionString?: string) {
  if (!connectionString) {
    return drizzleNetlify();
  }
  // @netlify/database-dev and some local URLs are ordinary Postgres,
  // which the Neon HTTP helper inside drizzle(string) rejects.
  if (looksLikeNeonUrl(connectionString)) {
    return drizzleNetlify(connectionString);
  }
  return drizzlePg(connectionString);
}

/**
 * Lazy database client. Hosted Netlify runtimes resolve the connection
 * automatically. Tests and local engines pass NETLIFY_DB_URL explicitly.
 */
export function getDb(): BlogDb {
  if (!instance) {
    instance = createDb(process.env.NETLIFY_DB_URL);
  }
  return instance;
}

/** Drop the cached client after the harness rotates databases. */
export async function resetDb(): Promise<void> {
  if (instance && "$client" in instance) {
    const client = instance.$client as { end?: () => Promise<void> };
    if (typeof client.end === "function") {
      await client.end().catch(() => undefined);
    }
  }
  instance = undefined;
}
