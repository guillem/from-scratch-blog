# Agent instructions

This repository is a reusable Netlify blogging engine. Forks should remain
safe to publish: no secrets, no site IDs, no personal posts in Git.

## Architecture in one paragraph

Astro (`output: "server"`) with `@astrojs/netlify` renders public pages from
PostgreSQL via Drizzle and `@netlify/database`. Admin writes go through Astro
server routes, CSRF origin checks, and `requireAdmin()` / `*AsAdmin()` helpers.
Auth is `@netlify/identity` (not the legacy widget). Schema changes ship as
SQL files under `netlify/database/migrations/`.

## Important paths

| Path                           | Role                                          |
| ------------------------------ | --------------------------------------------- |
| `src/pages/`                   | Public, admin, and API routes                 |
| `src/lib/`                     | Auth, validation, Markdown, queries           |
| `src/config/site.ts`           | Public branding (safe to commit)              |
| `db/schema.ts`                 | Drizzle schema                                |
| `db/index.ts`                  | Database client                               |
| `netlify/database/migrations/` | Applied by Netlify on deploy; locally via CLI |
| `tests/unit/`                  | Pure tests, no database                       |
| `tests/db/`                    | Database tests via `@netlify/database-dev`    |
| `tests/e2e/`                   | Playwright against an ephemeral DB            |

## Commands

Use `npm run ci` before claiming work is done. See the README for the rest.

## Conventions

- TypeScript strict; do not disable checking or ignore lint to go green.
- Prefer simple Astro pages and server-side form POSTs over extra frameworks.
- Validate with Zod on the server. Parameterize all SQL through Drizzle.
- Public queries must filter `status = 'published'`.
- Do not auto-assign the `admin` Identity role in code.
- Do not add comments, analytics, or extra SaaS services unless asked.

## Migrations

1. Edit `db/schema.ts`.
2. `npm run db:generate`.
3. Review the SQL. Do not edit an already-applied migration.
4. `npm run db:migrate` against the local database only.
5. Commit schema and migration together.

Never run `drizzle-kit push` or `drizzle-kit migrate` against `NETLIFY_DB_URL`.
Hosted production and Deploy Preview databases are migrated by the deploy.

Install **current** `drizzle-orm` / `drizzle-kit` from the dist-tag that still
exports `drizzle-orm/netlify-db` (today that is `@rc`; `@latest` does not).

## Security constraints

- No secrets in the repo, client bundles, or `PUBLIC_` / `VITE_` variables.
- `DEV_AUTH_BYPASS` is local/CI only and is ignored on hosted Netlify contexts.
- Every write requires an authenticated user with the `admin` role.
- Markdown is sanitized; raw HTML is not trusted.
- Identity registration must stay **invite only** in the Netlify dashboard.

## Definition of done

App works locally from migrations; public and admin flows work; `npm run ci`
passes; docs match the code; no secrets committed; production Netlify deploy
is documented but not performed unless the operator asks.
