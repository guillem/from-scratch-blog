# Deployment

This project is a reusable starter. Each fork (or clone) needs **its own**
Netlify project, database, and Identity instance. Do not copy another site’s
IDs, tokens, or connection strings into this repository.

## 1. Create or link a Netlify project

1. Push the repository to GitHub.
2. In Netlify: **Add new project → Import from Git**.
3. Confirm the build command `npm run build` and publish directory `dist`
   (already in `netlify.toml`).
4. Set `NODE_VERSION=22` if the UI does not pick up `.nvmrc`.

CLI alternative after `npm install -g netlify-cli`:

```bash
netlify login
netlify init
```

`netlify init` writes local site metadata under `.netlify/`, which is
gitignored. Never commit a site ID.

## 2. Database

The default path is [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-database/),
which requires a **credit-based** Netlify plan.

Installing `@netlify/database` is what allows Netlify to provision the
database on deploy. You should not create tables in the UI.

On first deploy Netlify creates the database and applies
`netlify/database/migrations/`. Deploy Previews get isolated branches.

If the package is missing, provisioning will not happen automatically.

Optional: `npx netlify database init --yes` on a linked site if you need to
opt the project in explicitly.

### Legacy (non-credit) plans

Netlify Database is not available on legacy plans. The build fails before
`npm run build` with `createSiteDatabase` **403** and
`database feature not available for this account`.

To bring your own Postgres (for example [Neon](https://neon.tech)):

1. Remove `@netlify/database` from `package.json`. Leave it out unless you
   later move onto a credit-based plan — that package is the provision trigger.
2. Create a Postgres database and apply `netlify/database/migrations/*/migration.sql`
   in timestamp order (Neon SQL editor or `psql`).
3. Set `NETLIFY_DB_URL` in the Netlify UI to the connection string
   (`sslmode=require`). Scope it to **Builds**, **Functions**, and **Runtime**.
   Builds-only is not enough: SSR functions need the URL at request time.
4. Do not commit the connection string.

On this path, hosted deploys do **not** apply migrations or create preview
database branches. Apply new SQL yourself. Deploy Previews share the same
`NETLIFY_DB_URL`.

Hosted Neon-shaped URLs use `drizzle-orm/neon-http`. Do not point
`drizzle-orm/netlify-db` at a Neon URL: `@neondatabase/serverless` 1.x rejects
`sql("SELECT $1", params)` and every public page will 500.

## 3. Public URL

Set `SITE_URL` in the Netlify UI (scope: **Builds**, **Functions**, and
**Runtime**) to the canonical origin, for example `https://example.netlify.app`
or your custom domain.
This is not a secret. If unset, the app falls back to Netlify’s `URL` /
`DEPLOY_PRIME_URL`. Hosted responses send
`Strict-Transport-Security: max-age=31536000` from middleware (SSR) and
`netlify.toml` (static assets).

Do **not** set `DEV_AUTH_BYPASS` in Netlify.

## 4. Identity

1. Open **Project configuration → Identity → Enable Identity**.
2. Set **Registration** to **Invite only**.
3. Do not enable open signup.
4. Optional: enable external providers; the login page reads `getSettings()`
   and only shows providers that are actually enabled.

Identity settings have no public API. Use the dashboard. Classic Netlify
Identity does **not** require a credit-based plan.

Invite, recovery, confirmation, and OAuth emails send users to the **site
URL** (usually `/`) with a hash such as `#invite_token=…`. A small script on
every page forwards those hashes to `/login`, which is the only place that
runs `handleAuthCallback()`. Without that forward, the email link looks like
a successful page load of the public blog and the token is ignored.

## 5. First admin

1. **Identity → Users → Invite** your email.
2. Open the invite email. You should land on `/login` with **Accept
   invitation** (set a password). If the token expired, send a new invite.
3. In the dashboard, edit the user and set role `admin` under
   `app_metadata.roles` (a string list; the value is exactly `admin`).
4. Sign out and back in, or wait for token refresh, so the JWT carries the
   new role.

Until that role is present, `/admin` stays forbidden even if you can log in.

## 6. GitHub + Netlify deploys

Production deploys from the production branch. Pull requests get Deploy
Previews with their own database branch (seeded from production data at
creation time). Preview URLs can expose production content — treat them as
sensitive.

After Identity or env var changes, redeploy. Netlify injects values at build
and runtime; editing a variable does not patch an already-published deploy.

## 7. Public GitHub repository extras

- Keep the Netlify **sensitive variable policy** on for public repos
  (require approval for untrusted forks).
- Rotate any credential that ever lands in Git history before opening the
  repo. This starter does not commit credentials; do not add them later.
- Production data is not in Git. Forks start empty after migrations.

## Troubleshooting

**Build: `createSiteDatabase` 403 / `database feature not available for this account`.**
The account is not on a credit-based plan. Follow [Legacy (non-credit) plans](#legacy-non-credit-plans). Do not reinstall `@netlify/database` to “fix” it.

**Deployed site: every public page 500, `/login` works.** Function logs mention
`tagged-template function` / `sql.query`. The Neon HTTP helper is being called
as a function. Use `drizzle-orm/neon-http` for Neon URLs (this repo already
does when `NETLIFY_DB_URL` looks like Neon).

**Invite or “forgot password” email opens the public blog, not a password form.**
The token is in the URL hash (`#invite_token=` / `#recovery_token=`). Confirm
you are on a deploy that includes the layout script that forwards hashes to
`/login`. Click the email again after that deploy; send a new invite if the
token expired.

**Signed in but `/admin` is forbidden.** The Identity user exists but does not
have role `admin` in `app_metadata.roles`. Set it in the dashboard, then sign
out and back in.

**SSR still cannot see `NETLIFY_DB_URL`.** Scope the variable to Functions and
Runtime, not only Builds, then redeploy.

## Rollback and operations

- Schema: roll **forward** with a new migration. Do not rewrite applied files.
- Data: restore from a Netlify Database snapshot if you created one; snapshot
  restore is destructive and is not a routine rollback lever. On a bring-your-own
  database, use that provider’s backup or branch restore.
- Identity users are managed in the dashboard, not in this database.
