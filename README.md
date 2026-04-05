# Stylora

Stylora is a self-hosted browser workspace for PostgreSQL projects.

It is designed as a cleaner, browser-first alternative to desktop database clients, with organizations, projects, and database connections as the core workspace model.

## Current Status

Stylora is currently in early MVP development.

The repository already includes:

- an Angular web app
- a Hono API
- Better Auth with personal organization creation
- a shared Drizzle/PostgreSQL data layer
- schemas for projects and PostgreSQL connections

The broader product direction includes project management, PostgreSQL connection management, schema browsing, and SQL query execution from the browser.

## Monorepo Structure

```text
apps/
  web/        Angular frontend
  api/        Hono backend
packages/
  auth/       Better Auth setup and org logic
  db/         Drizzle schema, migrations, DB bootstrap
  contracts/  Shared contracts and types
```

## Tech Stack

- `pnpm`
- `turbo`
- `Angular`
- `Hono`
- `Better Auth`
- `Drizzle ORM`
- `PostgreSQL`

## Getting Started

### Requirements

- `Node.js`
- `pnpm`
- `Docker` or a local PostgreSQL instance

### Setup

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm dev
```

Default local services:

- web app: `http://localhost:4200`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Useful Commands

```bash
pnpm dev           # run the workspace in development
pnpm build         # build all packages and apps
pnpm test          # run tests across the monorepo
pnpm lint          # run Biome checks
pnpm format        # format files with Biome
pnpm db:up         # start the local PostgreSQL container
pnpm db:down       # stop local services
pnpm db:migrate    # run database migrations
pnpm db:studio     # open Drizzle Studio
```

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the lightweight contribution guide.
