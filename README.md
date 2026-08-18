# From Scratch Blog

A lightweight personal blogging engine designed to be **forked and reused**.
Each deployment owns its own posts, tags, and admin users. The Git repository
contains only application code, schema migrations, and public site branding.

Public visitors get a small reading site: published posts, tags, RSS/Atom, a
sitemap, and sensible SEO. Operators get an invite-only `/admin` area backed by
Netlify Identity and Netlify Database (managed PostgreSQL).

## Features

- Published post list and permalinks at `/posts/<slug>`
- Drafts that never appear on public pages, feeds, or the sitemap
- Tags and tag archives
- Markdown with fenced code blocks; rendered HTML is sanitized
- RSS, Atom, `sitemap.xml`, Open Graph metadata
- Responsive, accessible layout with system light/dark mode
- Invite-only administration: create, edit, delete, publish, unpublish, tags, draft preview
- Server-side authorization on every write

## Requirements

- Node.js 22.12 or newer
- npm
- A Netlify account on a [credit-based plan](https://docs.netlify.com/build/data-and-storage/netlify-database/) (required for Netlify Database and Identity)

## Quick start (local)

```bash
npm install
cp .env.example .env
```

Set `DEV_AUTH_BYPASS=true` in `.env` if you want the admin UI without Identity.
Identity itself cannot be fully exercised under local development; test login
on a Deploy Preview.

Start the app and the local Netlify Database together:

```bash
npx netlify dev
```

In another terminal, apply migrations and optionally load **local-only** fixtures:

```bash
npm run db:migrate
npm run db:seed
```

Then open the printed local URL. `npm run dev` also works for Astro-only work,
but `netlify dev` is the supported way to get a local database.

## Common commands

| Command               | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Astro dev server                                           |
| `npx netlify dev`     | Local Netlify runtime + local database                     |
| `npm run db:generate` | Create a migration from `db/schema.ts`                     |
| `npm run db:migrate`  | Apply pending migrations to the **local** database         |
| `npm run db:seed`     | Insert optional local fixtures (refuses hosted production) |
| `npm test`            | Unit and database tests                                    |
| `npm run test:e2e`    | Playwright flows against an ephemeral database             |
| `npm run build`       | Production build                                           |
| `npm run ci`          | Format, lint, types, tests, build, and e2e                 |

## Customize a fork

1. Edit `src/config/site.ts` (title, description, author, locale).
2. Replace `public/favicon.svg` if you want.
3. Leave `.env` and `.netlify/` uncommitted.
4. Create your own Netlify project, database, and Identity instance.
5. Invite the first user and assign the `admin` role in the Netlify UI.

Content never belongs in Git. Migrations recreate the empty schema; posts live
in that deployment’s database.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Local development](docs/DEVELOPMENT.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Status](docs/STATUS.md)
- [Agent instructions](AGENTS.md)

## License

MIT. See [LICENSE](LICENSE).
