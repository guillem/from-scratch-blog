# Status

## What exists

- Astro SSR blog on the official Netlify adapter
- Netlify Database schema and committed SQL migrations
- Public post list, permalinks, tags, RSS, Atom, sitemap, robots.txt
- Sanitized Markdown with fenced code blocks
- Invite-oriented `/admin` for posts and tags, including draft preview
- Server-side admin authorization and CSRF origin checks
- Local/CI admin bypass that is disabled on hosted Netlify contexts
- Unit, database, and Playwright tests
- GitHub Actions (`npm run ci`)
- MIT license and operator/agent documentation

## Known limitations

- Netlify Identity cannot be fully tested with `netlify dev`. Real login,
  invites, and OAuth need a Deploy Preview or production deploy.
- CDN role redirects apply on Netlify-hosted requests only.
- `DEV_AUTH_BYPASS` is a development hatch. It must never be set in the
  Netlify UI.
- There are no comments, media uploads, or multiple authors.
- Admin Markdown preview allows `'unsafe-inline'` in CSP because Astro emits
  small inline scripts. Tighten later if you add a nonce-based CSP.
- Database and Identity require a Netlify credit-based plan.

## Technical debt

- Drizzle is on the `1.0.0-rc` line until `netlify-db` ships in `@latest`.
- `post_tags` foreign-key columns are not-null in practice (composite PK)
  but the generated `CREATE TABLE` omits explicit `NOT NULL`.
- Playwright covers critical paths only; Identity UI is not e2e-tested.
  End-to-end tests run against `astro dev` because `@astrojs/netlify` does
  not support `astro preview`. They set `NETLIFY_DEV=true` so the Netlify Vite
  plugin does not start a second local database. The production build is still
  verified in CI.

## Next milestones

1. Enable Identity on a real Netlify project and walk the invite + admin role
   path on a Deploy Preview.
2. Add optional custom domain and `SITE_URL`.
3. If comments are wanted, design them as a separate moderated subsystem.
4. Consider tightening CSP once admin client scripts are hashed or nonced.
