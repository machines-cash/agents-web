# Contributing

## Pull request target
- Open pull requests against `contrib` only.
- Pull requests to `main` are not accepted.

## Required checks
A pull request must pass all required CI checks before review.

## Review and intake flow
1. You open a PR to `contrib`.
2. Maintainer review approves the PR.
3. An automation labels it for private intake.
4. The change is imported into a private `dev` PR for validation.
5. After private validation and promotion, `main` is mirrored from private releases.

## Restrictions
- No direct pushes to protected branches.
- Contributor PRs are limited by changed-file policy (`.oss-contrib-allowlist`).
- Workflow and CI script paths are excluded from external contributor changes.
- Workflow/security boundary changes may be rejected even if checks pass.

## Development notes
- Keep changes scoped and minimal.
- Include tests for behavior changes.
- Do not commit secrets.
