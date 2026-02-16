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

2. Ensure an API server is reachable at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080`).
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
`.env.example` includes local defaults:
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
- `NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000`
- `NEXT_PUBLIC_AGENT_ORIGIN=http://localhost:3002`

Sandbox KYC tip (backend behavior): in sandbox, setting KYC `lastName` to `approved` can auto-approve.

## Security and disclosure
See `SECURITY.md`.
