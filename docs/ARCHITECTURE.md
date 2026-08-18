# Architecture

## System

```
Browser
  ├─ public HTML (Astro SSR)
  │    └─ Drizzle → Netlify Database (published rows only)
  ├─ /login (Identity in the browser)
  └─ /admin forms (SSR + POST)
       ├─ CSRF origin check
       ├─ getUser() / local bypass (non-hosted only)
       ├─ admin role check
       └─ Drizzle writes
```

Netlify serves the Astro adapter as Functions. Hosted deploys apply SQL from
`netlify/database/migrations/` before publish. Each Deploy Preview gets an
isolated database branch copied from production at preview creation.

## Runtime choices

| Piece        | Choice                                 |
| ------------ | -------------------------------------- |
| UI/framework | Astro 7, `output: "server"`            |
| Host adapter | `@astrojs/netlify`                     |
| Database     | Netlify Database (Postgres)            |
| Data access  | Drizzle ORM (`drizzle-orm/netlify-db`) |
| Auth         | `@netlify/identity`                    |
| Markdown     | `marked` + `sanitize-html`             |

There is no separate API server, container, or third-party database.

## Request flows

**Public read.** `src/middleware.ts` attaches cache/security headers. Pages
call `listPublishedPosts`, `getPublishedPostBySlug`, or
`listPublishedPostsByTagSlug`. Drafts never enter those queries.

**Admin write.** Middleware requires a current user with the `admin` role
(or the local bypass). The page then parses the form with Zod, calls
`createPostAsAdmin` / `updatePostAsAdmin` / `deletePostAsAdmin`, and redirects.
CDN `Role=admin` redirects in `netlify.toml` are a coarse extra gate only.

**Login.** Browser calls `login()`, `handleAuthCallback()`, `acceptInvite()`,
and `oauthLogin()` from `@netlify/identity`. The server reads `nf_jwt` via
`getUser()` on later requests.

## Data model

- `posts`: content, slug, status (`draft` \| `published`), timestamps.
  Publishing requires `published_at`. Slugs are unique and constrained to
  `[a-z0-9]+(-[a-z0-9]+)*`.
- `tags`: unique name and slug.
- `post_tags`: composite primary key. Deleting a post or tag cascades to join
  rows only; posts are not deleted when a tag is removed.

No user table is stored here. Administrators are Netlify Identity users.

## Boundaries

- Browser code never receives `NETLIFY_DB_URL` or Identity admin tokens.
- `src/config/site.ts` and `.env.example` are the only committed configuration
  surfaces. Real env files stay local.
- Seed data is opt-in via `npm run db:seed` and refuses hosted production.
