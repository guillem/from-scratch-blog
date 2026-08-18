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

Installing `@netlify/database` is what allows Netlify to provision the
database on deploy. You should not create tables in the UI.

On first deploy Netlify creates the database and applies
`netlify/database/migrations/`. Deploy Previews get isolated branches.

If the package is missing, provisioning will not happen automatically.

Optional: `npx netlify database init --yes` on a linked site if you need to
opt the project in explicitly.

## 3. Public URL

Set `SITE_URL` in the Netlify UI (scope: Builds + Functions) to the canonical
origin, for example `https://example.netlify.app` or your custom domain.
This is not a secret. If unset, the app falls back to Netlify’s `URL` /
`DEPLOY_PRIME_URL`.

Do **not** set `DEV_AUTH_BYPASS` in Netlify.

## 4. Identity

1. Open **Project configuration → Identity → Enable Identity**.
2. Set **Registration** to **Invite only**.
3. Do not enable open signup.
4. Optional: enable external providers; the login page reads `getSettings()`
   and only shows providers that are actually enabled.

Identity settings have no public API. Use the dashboard.

## 5. First admin

1. **Identity → Users → Invite** your email.
2. Open the invite email on the deployed site (the login page runs
   `handleAuthCallback()` / `acceptInvite()`).
3. Edit the user and set role `admin` (`app_metadata.roles`).
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

## Rollback and operations

- Schema: roll **forward** with a new migration. Do not rewrite applied files.
- Data: restore from a Netlify Database snapshot if you created one; snapshot
  restore is destructive and is not a routine rollback lever.
- Identity users are managed in the dashboard, not in this database.
