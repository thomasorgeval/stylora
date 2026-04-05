# Contributing

Thanks for contributing to Stylora.

## Before You Start

- keep changes focused and small when possible
- open an issue or discussion first for larger changes
- avoid unrelated refactors in the same PR

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm dev
```

## Development Notes

- use `pnpm` for workspace commands
- keep docs and examples in sync with code changes
- follow the existing structure and naming already used in the repo

## Before Opening a PR

Run the relevant checks before submitting:

```bash
pnpm lint
pnpm test
pnpm build
```

If your change touches the database layer, also run:

```bash
pnpm db:migrate
```

## Pull Requests

- explain the goal of the change clearly
- include screenshots for UI changes when helpful
- mention any follow-up work or known limitations

## Code of Conduct

Be respectful, constructive, and practical in reviews and discussions.
