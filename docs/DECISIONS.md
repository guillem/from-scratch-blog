# Decisions

## Reusable public starter

The repository is meant to be public and forked. Posts, drafts, and future
comment-like data belong in each operator’s database. Git holds schema,
application code, and non-secret branding (`src/config/site.ts`).

## Astro SSR on Netlify

Posts are dynamic, so the app is not a static content collection. Official
guidance is `@astrojs/netlify` with `output: "server"`. Public pages still
emit little client JavaScript.

## Netlify Database + Drizzle

Required by the product brief and current Netlify database skill: migrations
in `netlify/database/migrations/`, client from `drizzle-orm/netlify-db`,
`@netlify/database` installed so deploys provision a database.

**Deviation:** Netlify’s skill currently pins `drizzle-orm@beta`. npm marks
that line deprecated in favor of `@rc`, and `@rc` still exports
`drizzle-orm/netlify-db`. `@latest` (0.45.x) does not. This repo uses `@rc`.

Local tests use `drizzle-orm/node-postgres` when `NETLIFY_DB_URL` is a
plain Postgres URL from `@netlify/database-dev`. Hosted Neon-shaped URLs
use `drizzle-orm/neon-http` because `drizzle-orm/netlify-db` still calls
`sql("SELECT $1", params)`, which `@neondatabase/serverless` 1.x rejects
(every public page 500s; `/login` still works). Zero-config Netlify Database
(`drizzle()` with no URL) remains the credit-based default.

`@netlify/database` stays a dependency so credit-based deploys provision a
database. On a legacy plan that package makes the build call
`createSiteDatabase` and fail with 403; operators remove it and set
`NETLIFY_DB_URL` themselves (see `docs/DEPLOYMENT.md`).

## `@netlify/identity` instead of the Identity widget

Current Netlify docs recommend `@netlify/identity` for new work. Login,
invite acceptance, recovery, and OAuth run in the browser; `getUser()` runs
on the server. Registration stays invite-only in the dashboard. The `admin`
role is assigned in the dashboard, never granted automatically on signup.

GoTrue emails open the **site URL** with a hash (`#invite_token=`,
`#recovery_token=`, and similar). Only `/login` runs `handleAuthCallback()`,
so `BaseLayout` forwards matching hashes there. Classic Identity works on
legacy Netlify plans; Netlify Database does not.

## Defense in depth for `/admin`

CDN role redirects are a perimeter. They are not sufficient (and they do not
run on client-side navigation). Middleware plus `*AsAdmin()` helpers enforce
authentication and the `admin` role on the server for every write.

## Local Identity gap

Identity is not fully available under `netlify dev`. A
`DEV_AUTH_BYPASS=true` switch impersonates an admin locally and in CI. It is
ignored when `CONTEXT` is `production`, `deploy-preview`, or `branch-deploy`.

## Markdown sanitization

`marked` renders GitHub-flavored Markdown. `sanitize-html` then allows a
tight tag set. Raw HTML, `javascript:` URLs, and event handlers are stripped.
Admin preview reuses the same server function.

## No comments in v1

Comments need spam controls, moderation, and a privacy story. They are out of
scope so the reusable release stays small.

## CI without Netlify credentials

Unit tests need no database. Database and e2e tests use
`@netlify/database-dev`, which starts an ephemeral Postgres-compatible engine
and applies the committed migrations.
