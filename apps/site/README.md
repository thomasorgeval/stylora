# Site

Astro marketing site and Starlight documentation for Stylora.

## Responsibilities

- `stylora.xyz` marketing pages
- `stylora.xyz/docs` product documentation
- waitlist landing page and external form handoff

## Commands

Run these from the repository root:

```bash
pnpm --filter site dev
pnpm --filter site build
pnpm --filter site check
```

## Waitlist

The waitlist page supports an external provider through `PUBLIC_WAITLIST_FORM_URL`.

If this variable is not set, the page renders the native form shell but keeps submissions disabled.

## Deployment

The repository includes a GitHub Actions workflow that deploys this app to Cloudflare Pages.

Expected Pages output directory:

```text
apps/site/dist
```
