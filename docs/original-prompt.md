We are building a new lightweight blogging engine from scratch.

The repository is currently empty. Your job is to design, implement, test,
document, and leave it in a production-ready state suitable for GitHub and
deployment on Netlify.

Before implementing:

1. Inspect the environment and available tools.
2. Fetch https://netlify.ai and use the current Netlify agent guidance/skills
   relevant to this project, rather than relying on assumptions about Netlify.
3. Produce a concise implementation plan.
4. Then proceed autonomously through the implementation unless you encounter
   a genuinely blocking decision.

Do not overengineer this. Prefer the simplest architecture that provides a
clean, maintainable, secure application.

# Product

Build a lightweight personal blogging engine.

Public functionality:

- Home page listing published posts, newest first.
- Individual post pages at `/posts/<slug>`.
- Posts have:
  - title
  - unique slug
  - optional summary
  - Markdown body
  - draft/published state
  - publication date
  - created/updated timestamps
- Tag support.
- Filter/list posts by tag.
- RSS/Atom feed.
- sitemap.xml.
- sensible OpenGraph/SEO metadata.
- responsive, accessible design.
- good typography and minimal visual clutter.
- useful 404 and error pages.

Administration:

- `/admin` area.
- Authentication using the current recommended Netlify Identity integration.
- Registration must NOT be publicly open by default.
- Authenticated admin can:
  - create posts
  - edit posts
  - delete posts
  - save drafts
  - publish/unpublish posts
  - manage tags
  - preview drafts
- All privileged operations must be authorized server-side. Never rely on
  client-side route protection alone.

Markdown:

- Render standard Markdown.
- Support fenced code blocks.
- Sanitize rendered user-controlled content appropriately.
- Do not allow arbitrary unsanitized HTML by default.

# Architecture

Use a modern, boring TypeScript stack optimized for Netlify.

Preferred starting point:

- Astro
- TypeScript with strict type checking
- official/current Netlify Astro integration
- Netlify Database (managed PostgreSQL)
- Drizzle ORM unless current Netlify guidance gives a compelling reason
  to use something else
- Netlify Identity for admin authentication
- Netlify Functions/framework server endpoints where server-side behavior is
  needed

You may adjust these choices if current official Netlify documentation shows
a materially better supported architecture. If you do, document the reason.

Do not introduce a separate backend server, container, VPS, Supabase,
Firebase, external database, or other infrastructure unless Netlify cannot
reasonably provide the required functionality.

Keep frontend and backend in one repository.

# Database

Use Netlify Database.

Schema should be migration-driven and stored in Git.

At minimum model:

posts

- id
- slug
- title
- summary
- body_markdown
- status
- published_at
- created_at
- updated_at

tags

- id
- slug
- name

post_tags

- post_id
- tag_id

Add sensible constraints and indexes.

Requirements:

- slugs unique
- referential integrity enforced
- deletion behavior explicit
- publication state validated
- timestamps handled consistently
- no schema mutation outside migrations

Use Netlify's standard migration location/workflow so migrations are applied
correctly to local development, Deploy Previews, and production.

Create some optional development seed data, but do not automatically populate
production with demo content.

# API/backend design

Do not create unnecessary CRUD endpoints merely because this is a web app.

Use server-side framework actions/routes or Netlify Functions where they make
architectural sense.

Public unauthenticated operations must be read-only and expose only published
content.

Every write operation must:

- require authentication
- validate input server-side
- enforce authorization server-side
- return useful errors
- avoid leaking internal details

Use parameterized ORM/database operations.

Do not expose database credentials or secrets to browser code.

# Security

Treat this as an Internet-facing application.

At minimum address:

- authentication
- authorization
- CSRF where applicable
- XSS from Markdown/content
- input validation
- SQL injection
- secure session handling
- secrets management
- safe HTTP/security headers
- dependency vulnerabilities

Use the current recommended Netlify Identity patterns rather than legacy
Identity widget examples.

Document important security decisions.

# UX

Aim for a polished but intentionally minimal application.

Public side:

- pleasant reading layout
- dark/light mode following system preference
- responsive
- keyboard accessible
- semantic HTML
- accessible contrast
- fast initial load

Admin side:

- post list
- clear draft/published states
- simple editor
- Markdown preview
- validation messages
- confirmation before destructive deletion

Do not add a large component library unless it clearly improves the result.
Prefer modest amounts of maintainable CSS.

# Testing and quality

Set up automated:

- formatting
- linting
- TypeScript checking
- unit tests
- relevant backend/database tests
- a small number of end-to-end tests for critical flows

Critical behavior to test includes:

- published posts visible publicly
- drafts not visible publicly
- slug uniqueness
- Markdown rendering/sanitization
- unauthorized writes rejected
- authenticated post creation/editing
- tag relationships
- invalid input rejected

Use realistic testing rather than tests that merely duplicate implementation
details.

All checks must run with a single documented command suitable for CI.

# GitHub

Make this a clean Git repository intended for GitHub.

Create:

- .gitignore
- README.md
- LICENSE (MIT)
- AGENTS.md
- .editorconfig
- GitHub Actions CI workflow
- pull request template if useful

CI should run on pushes and pull requests and verify:

- dependency installation
- formatting/linting
- type checking
- tests
- production build

Do not require production Netlify credentials just to run ordinary CI tests.

# Netlify

The repository must be directly deployable to Netlify.

Include whatever current Netlify configuration is appropriate, such as
`netlify.toml`, without duplicating framework defaults unnecessarily.

Verify:

- production build works
- Netlify Functions/server routes are discovered correctly
- database integration follows current Netlify Database conventions
- migrations work with Netlify's deployment lifecycle
- Deploy Previews work correctly
- preview deployments use isolated database branches where supported
- required environment/configuration settings are documented
- no secret values are committed

The README must contain exact instructions for:

1. installing dependencies
2. local development
3. initializing the local Netlify database
4. applying migrations
5. running tests
6. building locally
7. creating/linking a Netlify project
8. enabling/configuring Netlify Identity
9. making the first admin account
10. deploying through GitHub + Netlify

Prefer `netlify dev` for reproducing the Netlify runtime locally where useful.

Do NOT require users to manually create database tables through a web UI.
The repository and its migrations must be sufficient to recreate the schema.

# Repository documentation

The repository itself must contain enough information for another coding agent
with no conversation history to continue development safely.

Create:

AGENTS.md
Concise operational instructions for coding agents:
architecture, important paths, commands, conventions, testing requirements,
migration rules, security constraints, and definition of done.

docs/ARCHITECTURE.md
Overall system architecture, request/data flows, deployment architecture,
database design, and major boundaries.

docs/DECISIONS.md
Important architectural decisions and their rationale.

docs/DEVELOPMENT.md
Detailed local development and testing workflow.

docs/DEPLOYMENT.md
GitHub + Netlify deployment and operational notes.

docs/STATUS.md
What exists today, known limitations, technical debt, and sensible next
milestones.

Keep documentation synchronized with the implementation.

# Engineering constraints

- Prefer simplicity over abstraction.
- Avoid speculative extensibility.
- Avoid unnecessary dependencies.
- No placeholder implementations or TODO-driven fake completeness.
- No hard-coded secrets.
- No disabled type checking.
- No ignored lint errors to make CI green.
- No generated files committed unless they belong in source control.
- Keep dependency versions current and supported.
- Follow official current framework and Netlify documentation.
- Where current documentation conflicts with assumptions in this prompt,
  follow current documentation and record the deviation.

# Definition of done

The task is complete when:

- the application works locally
- the database can be created from migrations
- public blog functionality works
- authenticated administration works
- tests pass
- lint/type checks pass
- production build succeeds
- Netlify configuration is valid
- the repository is ready to push to GitHub
- a GitHub-connected Netlify deployment can be performed using documented
  steps
- no secrets are committed
- documentation accurately describes the implemented system

Before declaring completion:

1. Run the complete verification suite.
2. Run a production build.
3. Exercise the major application flows.
4. Review the diff/codebase for security problems, dead code, unfinished work,
   unnecessary complexity, and documentation drift.
5. Fix any issues you find.
6. Update docs/STATUS.md with the actual final state.
7. Give me a concise final report containing:
   - architecture implemented
   - important files/directories
   - tests/checks run and their results
   - anything requiring manual Netlify/GitHub configuration
   - known limitations
   - recommended next steps

Initialize and commit the repository logically as you work. Use small,
meaningful commits rather than one giant generated commit.

Do not create a GitHub repository, push to a remote, create billable cloud
resources, or publish to production unless I explicitly authorize those
external actions. The local repository should nevertheless be completely
ready for them.
