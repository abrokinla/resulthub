# ResultHub — Monorepo

```
resulthub/
├── frontend/     # Next.js 16 (deployed to Cloudflare Pages)
├── backend/      # Django 6 + DRF (deployed to Render)
└── package.json  # Root convenience scripts
```

## Local Development

From the repo root:

```bash
npm run dev        # Starts Next.js on :3000 + Django on :8000 concurrently
npm run build      # Builds frontend only (npm run build --prefix frontend)
npm run lint       # Lints frontend only
npm run backend    # Django dev server only (:8000)
```

Or run services individually:

```bash
npm run dev --prefix frontend      # Next.js on :3000
python backend/manage.py runserver # Django on :8000
```

## Frontend → Cloudflare Pages

The frontend proxies all `/api/*` requests to the Django backend via `frontend/src/app/api/[...path]/route.ts`. Set `NEXT_PUBLIC_API_URL` to point to the Render backend URL.

### Build & Deploy

```bash
cd frontend
nvm use                    # Requires Node.js 22+
npm run cf:build           # OpenNext build for Cloudflare
npm run cf:deploy          # Build + deploy to Cloudflare Pages
```

### Required env vars (set in Cloudflare dashboard)

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://resulthub-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | `https://resulthub.pages.dev` |

### Patches

- `patches/@opennextjs+cloudflare+1.19.11.patch` — marks `pg-cloudflare` as external in OpenNext esbuild bundle
- Applied automatically via `patch-package` in `postinstall`

## Backend → Render

The Django backend connects to PostgreSQL (Aiven) via `DATABASE_URL`.

### Procfile (used by Render)

```
web: gunicorn config.wsgi --workers 4 --bind 0.0.0.0:$PORT
```

### Required env vars (set in Render dashboard)

| Variable | Example |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:port/defaultdb?sslmode=require` |
| `DJANGO_SECRET_KEY` | `<random 64+ char string>` |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | `https://resulthub.pages.dev,http://localhost:3000` |

### Database migrations

```bash
cd backend
python manage.py migrate
```

## Directory Structure

```
frontend/
├── src/              # Next.js app
├── public/           # Static assets
├── patches/          # patch-package patches for Cloudflare build
├── open-next.config.ts
├── wrangler.jsonc
└── package.json

backend/
├── accounts/         # Auth (register, login, me)
├── schools/          # School management, config, terms
├── classes/          # Class groups
├── students/         # Students + academic records
├── subjects/         # Subjects + student-subject assignments
├── scores/           # Assessments + score summaries
├── results/          # Results + computed results + public access
├── config/           # Django settings, WSGI, URLs
├── Procfile
├── runtime.txt
└── requirements.txt
```
