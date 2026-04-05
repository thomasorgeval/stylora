# Stylora MVP Technical Design

## Product Scope

Stylora is a self-hosted web workspace for accessing databases from the browser.

The MVP focuses on PostgreSQL only and uses a simple multi-tenant hierarchy:

- one user owns one personal organization by default
- one organization contains multiple projects
- one project contains multiple PostgreSQL connections

Redis support, collaboration, billing, and advanced permission models are intentionally out of scope for the first version.

## Product Goals

- provide a clean browser-first alternative to desktop database clients
- support a project-based organization model from day one
- keep the first version technically simple enough to ship quickly
- build the right foundations for later team collaboration and additional engines

## Core Functional Scope

The MVP should support the following flows:

- sign up and sign in
- create a personal organization automatically on first onboarding
- create, rename, and delete projects
- add, test, edit, and remove PostgreSQL connections inside a project
- browse schemas, tables, columns, indexes, and constraints
- run SQL queries from the browser
- inspect result sets in a grid

The MVP should not support:

- organization invitations
- teams
- Redis connections
- saved queries shared across users
- query execution background jobs
- SSH tunnels
- secret managers integration

## Recommended Stack

### Monorepo

- package manager: `pnpm`
- monorepo orchestrator: `turbo`
- source control: `git`

`Turborepo` is a good fit because Stylora has a clear split between frontend, backend, database layer, auth configuration, and shared contracts.

### Frontend

- framework: `Angular 21`
- styling: `Tailwind CSS v4`
- component primitives: start custom, add a small shared UI package only if repetition appears
- state: Angular signals and resource APIs first; avoid adding a heavy state library unless needed later
- data fetching: generated or typed API client over `fetch`
- data grids: start with a simple custom table shell for schema browsing and query results, then harden only after usage patterns are clear

Angular is a strong fit for dense application UI, split panes, entity trees, tabbed workspaces, and structured forms.

### Backend

- runtime: `Node.js`
- HTTP framework: `Hono`
- validation: `zod`
- authentication: `better-auth`
- database driver for app data: `pg`
- PostgreSQL target connection layer: `pg`

Hono keeps the API small and explicit. It is well suited for a clean JSON API with auth middleware, resource endpoints, and query execution endpoints.

### Primary Application Database

- engine: `PostgreSQL`
- ORM / query builder: `Drizzle ORM`
- migrations: `drizzle-kit`

This keeps the application data model explicit and strongly typed while staying lightweight.

## Monorepo Layout

Recommended initial structure:

```text
stylora/
  apps/
    web/
    api/
  packages/
    db/
    auth/
    contracts/
  docs/
    superpowers/
      specs/
```

### `apps/web`

Angular application.

Responsibilities:

- authentication screens
- onboarding
- project listing and project detail screens
- database connection forms
- schema explorer UI
- SQL editor shell and results grid

### `apps/api`

Hono backend.

Responsibilities:

- Better Auth HTTP endpoints
- REST API for projects and database connections
- query execution endpoints
- metadata introspection endpoints
- server-side credential decryption and connection management

### `packages/db`

Shared application data layer.

Responsibilities:

- Drizzle schema
- migrations
- DB client bootstrap
- repository helpers only if duplication emerges

### `packages/auth`

Better Auth server configuration and shared auth utilities.

Responsibilities:

- Better Auth instance
- organization plugin setup
- auth helper functions for current user and active organization
- permission helper functions

### `packages/contracts`

Shared validation and API contracts.

Responsibilities:

- Zod schemas for payloads
- response DTOs if needed
- shared enums and narrow types

## Identity and Workspace Model

Stylora should use `better-auth` with the `organization` plugin from the start.

The MVP uses organizations in a constrained way:

- each new user gets one personal organization automatically
- that organization becomes the active organization
- collaboration features remain disabled at the product layer for now

This gives the application the correct long-term shape without introducing invitation or role-management complexity into the first release.

### Better Auth Setup

Use these features first:

- email and password auth
- session management
- organization plugin

Defer these features:

- invitations
- teams
- social login
- multi-session complexity unless needed by product requirements

### Active Organization Strategy

On first sign-up:

1. create user
2. create organization automatically
3. mark that organization as active
4. redirect user to onboarding or projects page

The application should still store `organizationId` on all project-scoped resources and always authorize against it.

## Domain Model

The MVP application schema should include at least these entities.

### `organization`

Provided by Better Auth plugin.

Relevant fields consumed by Stylora:

- `id`
- `name`
- `slug`
- `createdAt`

### `project`

Represents a logical workspace grouping related databases.

Suggested fields:

- `id`
- `organizationId`
- `name`
- `slug`
- `description` nullable
- `createdByUserId`
- `createdAt`
- `updatedAt`

Constraints:

- unique `slug` per organization
- foreign key to organization

### `database_connection`

Represents a PostgreSQL connection configured by the user.

Suggested fields:

- `id`
- `projectId`
- `name`
- `engine` with value `postgresql`
- `host`
- `port`
- `databaseName`
- `username`
- `passwordEncrypted`
- `sslMode`
- `connectionOptions` JSONB nullable
- `lastTestedAt` nullable
- `lastTestStatus` nullable
- `createdByUserId`
- `createdAt`
- `updatedAt`

Constraints:

- foreign key to project
- no password returned to the frontend

### Optional later entities

Not required for initial ship, but expected soon after:

- `query_history`
- `saved_query`
- `connection_favorite`

## Secrets and Connection Security

This is one of the most important parts of the MVP.

### Rules

- never store target database passwords in plaintext
- never send decrypted credentials to the frontend
- only decrypt on the server, right before opening a connection
- keep encryption key separate from the application database

### Recommended approach

Store these fields in plaintext:

- `host`
- `port`
- `databaseName`
- `username`
- `sslMode`

Store these fields encrypted:

- `password`

Use symmetric encryption with:

- algorithm: `AES-256-GCM`
- env var: `DATABASE_ENCRYPTION_KEY`

Recommended encrypted payload structure:

- version
- iv
- auth tag
- ciphertext

This allows future rotation or migration if the encryption scheme changes.

### Editing behavior

When updating a connection:

- if user leaves password empty, keep existing encrypted secret
- if user provides a new password, replace the encrypted payload

### Testing connections

Provide a server endpoint that:

1. validates payload
2. creates a short-lived PostgreSQL client
3. attempts connection
4. optionally runs a trivial query like `select current_database()`
5. returns sanitized success or error payload

Do not persist connection test errors verbatim if they may include sensitive internals.

## API Surface

The backend should stay simple and resource-oriented.

### Auth

- Better Auth endpoints mounted under `/api/auth/*`

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`

### Database connections

- `GET /api/projects/:projectId/connections`
- `POST /api/projects/:projectId/connections`
- `GET /api/connections/:connectionId`
- `PATCH /api/connections/:connectionId`
- `DELETE /api/connections/:connectionId`
- `POST /api/connections/test`

### Metadata exploration

- `GET /api/connections/:connectionId/schemas`
- `GET /api/connections/:connectionId/schemas/:schema/tables`
- `GET /api/connections/:connectionId/tables/:table/details`
- `GET /api/connections/:connectionId/tables/:table/rows`

### SQL execution

- `POST /api/connections/:connectionId/query`

Execution endpoint responsibilities:

- validate request
- authorize project access
- open connection using decrypted secret
- execute SQL with sensible timeout
- return columns, rows, row count, duration, and error state

## Authorization Model

The MVP keeps authorization intentionally simple.

Product behavior:

- one user primarily manages their own personal organization
- every project action is scoped to one organization
- every database connection action is scoped through project ownership

Recommended authorization checks:

- user must be authenticated
- user must belong to the resource organization
- user must have permission to manage project resources

Even if product UX remains single-user, the backend should still enforce organization scoping.

Custom Better Auth access control can later define resources like:

- `project`: `create`, `read`, `update`, `delete`
- `connection`: `create`, `read`, `update`, `delete`, `query`

For the MVP, a simple owner-only path is enough.

## Frontend Information Architecture

Recommended MVP navigation:

- sign in
- sign up
- projects list
- project detail
- connection detail / workspace

### Projects list

Should support:

- empty state for first project
- create project action
- list projects with connection counts

### Project detail

Should support:

- project header
- list of database connections
- create connection action
- open connection workspace

### Connection workspace

Should support:

- left schema explorer
- center SQL editor
- bottom or right results panel
- basic metadata panels for selected table

This should feel closer to a browser-native database workspace than an admin CRUD panel.

## Query Execution Constraints

For the first version, query execution should be intentionally conservative.

Recommended MVP constraints:

- set statement timeout on the PostgreSQL session or query
- cap returned rows for browsing endpoints
- expose pagination for row browsing
- show execution time and row count

The MVP should make an explicit product trade-off:

- schema exploration endpoints are always read-only
- the SQL editor allows all PostgreSQL statements for authorized users
- Stylora does not try to sandbox destructive SQL in the MVP
- the product should clearly warn that connections must target trusted environments

## Deployment Model

The first supported deployment target should be simple self-hosting.

Recommended runtime services:

- `web`
- `api`
- `postgres` for Stylora application data

Optional later services:

- `redis`
- worker process

### Initial deployment approach

- local development with Docker Compose or local Node processes
- production with Docker images behind a reverse proxy

Minimum required environment variables:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `DATABASE_ENCRYPTION_KEY`
- frontend API base URL if split by origin

## Development Milestones

### Milestone 1

- monorepo bootstrap
- Angular app scaffold
- Hono API scaffold
- shared packages scaffold
- PostgreSQL app database bootstrap

### Milestone 2

- Better Auth setup
- sign up and sign in
- personal organization auto-creation
- protected app shell

### Milestone 3

- projects CRUD
- project list and detail UI

### Milestone 4

- database connections CRUD
- encrypted password storage
- test connection flow

### Milestone 5

- schema explorer
- table metadata
- row browsing
- SQL query execution

### Milestone 6

- UX pass
- error handling hardening
- deployment docs

## Key Risks

### Secret handling

If credential encryption and decryption are not designed carefully, Stylora becomes unsafe immediately.

### Query execution safety

Long-running or destructive queries can degrade the product experience quickly.

### Overbuilding the first version

Adding Redis, collaboration, background jobs, and advanced roles too early will slow down the actual core product.

## Recommendation Summary

The recommended technical foundation for Stylora MVP is:

- `pnpm` + `turborepo`
- `Angular 21` frontend
- `Hono` backend
- `PostgreSQL` for application data
- `Drizzle ORM` for schema and migrations
- `Better Auth` with `organization` plugin
- encrypted PostgreSQL target credentials using `AES-256-GCM`

This gives Stylora the right product shape from day one while keeping the first release focused on a single high-value path: managing PostgreSQL workspaces in the browser.
