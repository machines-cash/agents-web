# agents-web

Public frontend for the Machines Cash agent experience.

## What this repo is
- Mobile-first Next.js app for `agent.machines.cash`.
- Open-source contribution surface only.
- Private backend/services remain in a separate private monorepo.

## API surface this app uses
- `POST /auth/challenge`
- `POST /auth/login`
- `POST /auth/session`
- `/agent/v1/*` (agent auth, chat, kyc, catalog)
- `/connect/v1/*` (machines connect auth flow)

This app does **not** call `/partner/v1/*` directly and does **not** use `X-Partner-Key` in the browser.

## Branch model
- `contrib`: external contributor intake branch.
- `main`: release mirror branch (synced from private `main`).

External pull requests must target `contrib`.

## Local development
1. Copy env:

```bash
cp .env.example .env.local
```

2. Pick API profile in `.env.local`:
   - Dev API (recommended for contributors):
     - `NEXT_PUBLIC_API_BASE_URL=https://dev-api.machines.cash`
     - `NEXT_PUBLIC_APP_ORIGIN=https://sandbox.machines.cash`
   - Prod API (maintainer/debug only):
     - `NEXT_PUBLIC_API_BASE_URL=https://api.machines.cash`
     - `NEXT_PUBLIC_APP_ORIGIN=https://app.machines.cash`
3. Install and run:

```bash
npm ci
npm run dev
```

By default this app serves on port `3002`.

## Checks
```bash
npm run lint
npm run test
npm run build
```

## Environment
Contributors run only the frontend locally and point it to hosted APIs:
- local frontend: `http://localhost:3002`
- hosted backend: `https://dev-api.machines.cash` (recommended) or `https://api.machines.cash`

Sandbox KYC tip (backend behavior): set KYC `lastName` to `approved` to force an approved state in sandbox/dev mode.

## Security and disclosure
See `SECURITY.md`.
