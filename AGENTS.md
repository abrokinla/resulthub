# ResultHub

## Database
- Provider: Aiven (PostgreSQL)
- Prisma ORM
- Connection URL already set in .env

## Setup
1. Database schema already pushed to Aiven
2. Run `npm run dev` for local development
3. Run `npm run build` to verify compilation

## Deploy to Cloudflare
- `npm run cf:build` — build for Cloudflare
- `npm run cf:deploy` — deploy to Cloudflare Workers

## Key Commands
- `npm run dev` — local development
- `npm run build` — build check
- `npm run lint` — lint check
- `npm run db:studio` — browse database
- `npx prisma db push` — push schema changes
- `npx prisma generate` — regenerate Prisma client
