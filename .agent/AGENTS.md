# Multi-Tenant Safety And UI Consistency Rules

These rules are always-on for changes in this repository.

## Tenant Boundaries
- Always scope tenant reads/writes with the active organization context (`org_id`) from session.
- Never run cross-organization updates/deletes without an explicit super-admin flow and validation.
- API handlers must reject requests that target an org the current user cannot access.

## Database Separation
- Keep master and tenant Prisma clients separated and explicit in each API path.
- Do not mix master database entities with tenant database entities in a single transactional flow unless org validation is performed first.
- Avoid schema shortcuts that bypass migrations or validation checks.

## Runtime And Deployment Safety
- Do not remove required Prisma runtime binaries for deployment targets.
- Avoid destructive runtime shortcuts (force reset, bypassed checks, unvalidated raw queries).

## UI And Localization Consistency
- New/updated dialogs should use shadcn dialog structure with accessible title/header/footer.
- Use translation keys for all user-facing strings; do not introduce raw hardcoded UI copy.
- Keep organization-level settings behavior consistent across sidebar/header/table create actions.

## Change Hygiene
- Prefer merge-safe updates for organization settings payloads (`theme`, `sidebar`, `header`, `ui`).
- Preserve backward compatibility for existing settings fields when adding new keys.
- Validate all new config values server-side before persisting.
