# Local development

## Install

```bash
npm install
cp .env.example .env
```

`.env` is gitignored. Put only local values there.

Suggested local `.env` for admin UI work without Identity:

```
SITE_URL=http://localhost:8888
DEV_AUTH_BYPASS=true
DEV_ADMIN_EMAIL=admin@localhost
```

Use port `8888` if you start with `netlify dev`; Astro’s default is `4321`.

## Database

The local database is started by `npx netlify dev` (or the Netlify Vite
plugin path). It is **not** production. Data lives under `.netlify/`.

```bash
npx netlify dev
npm run db:migrate
npm run db:seed
```

`db:migrate` is `netlify database migrations apply` and targets the
database in `NETLIFY_DB_URL`. Hosted databases migrate during deploy.
Seeding a hosted Netlify context (`CONTEXT=production`, `deploy-preview`,
or `branch-deploy`) exits unless `ALLOW_PROD_SEED=true`. Both `db:seed`
and `db:migrate` warn when `NETLIFY_DB_URL` is not localhost.

Useful CLI:

```bash
npx netlify database status
npx netlify database connect
npx netlify database reset   # local only; destroys local data
```

## Quality checks

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run ci
```

Playwright needs a Chromium install once: `npx playwright install chromium`.

## Schema changes

1. Change `db/schema.ts`.
2. `npm run db:generate`.
3. Read the new file in `netlify/database/migrations/`.
4. Apply locally with `npm run db:migrate`.
5. Commit the schema and migration together.

If a generated migration is wrong and has **not** been applied anywhere,
delete the unapplied files with `npx netlify database migrations reset`,
fix the schema, and generate again. Do not edit applied SQL.

## Identity

Local login against real Netlify Identity is not supported. Use the bypass
for UI work. Exercise invite, OAuth, and role assignment on a Deploy Preview
after Identity is enabled on the Netlify project. Invite and recovery emails
open the site URL with a hash; the layout forwards those hashes to `/login`.
