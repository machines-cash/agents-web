# agents-web

Public frontend for the Machines Cash agent experience.

## What this repo is
- Mobile-first Next.js app for `agent.machines.cash`.
- Open-source contribution surface only.
- Private backend/services remain in a separate private monorepo.

## Branch model
- `contrib`: external contributor intake branch.
- `main`: release mirror branch (synced from private `main`).

External pull requests must target `contrib`.

## Local development
```bash
npm ci
npm run dev
```

## Checks
```bash
npm run lint
npm run test
npm run build
```

## Environment
Copy `.env.example` to `.env.local` and set values for your environment.

## Security and disclosure
See `SECURITY.md`.
