# ResultHub

## Database
- Provider: Aiven (PostgreSQL)
- Prisma ORM
- Connection URL already set in .env

## Setup
1. Database schema already pushed to Aiven
2. Run `npm run dev` for local development
3. Run `npm run build` to verify compilation

## Deploy to Cloudflare Pages
- Requires Node.js 22+ (use `nvm use` — `.nvmrc` is in the project)
- `npm run cf:build` — build for Cloudflare
- `npm run cf:deploy` — build + deploy to Cloudflare Pages
- First deploy: run `npm run cf:deploy` — auto-creates Pages project
- Then set env vars in Cloudflare dashboard: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`
- The package `@opennextjs/cloudflare` is patched (via `patch-package` + `postinstall`) to mark `pg-cloudflare` as external in the esbuild bundle

## Key Commands
- `npm run dev` — local development
- `npm run build` — build check
- `npm run lint` — lint check
- `npm run db:studio` — browse database
- `npx prisma db push` — push schema changes
- `npx prisma generate` — regenerate Prisma client
