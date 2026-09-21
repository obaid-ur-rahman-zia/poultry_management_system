---
trigger: always_on
---

# Strict Command Execution Policy

NEVER run any Prisma migration or deployment commands via the terminal.
This includes, but is not limited to:
- `npx prisma migrate ...`
- `npx prisma db push`
- `npx prisma migrate dev`
- `npx prisma migrate deploy`
-`npx prisma generate`

If a database schema change is needed:
1. Update `schema.prisma`.
2. Just remind me to run them after change.
3. Stop and instruct the user to review and run migrations manually.