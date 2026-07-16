# Node.js Backend Boilerplate (Class-based)

A simple, class-based Node.js API boilerplate for rapid backend development.

## Tech Stack

- **Runtime** — Node.js 24+, TypeScript 6
- **Framework** — Express 5
- **Database** — MongoDB via Mongoose
- **Auth** — JWT (access + refresh tokens), bcrypt, HTTP-only cookies, server-side session revocation
- **Authorization** — Role-based (`user` / `admin`) permissions via CASL
- **Email** — Nodemailer with React Email templates
- **Cache** — Redis (optional, via express-expeditious)
- **Validation** — Zod schemas
- **API Docs** — Swagger UI (`/api-docs`)
- **Testing** — Vitest (unit + e2e), Supertest, mongodb-memory-server
- **Linting/Formatting** — Biome
- **Spell Check** — cspell
- **Package Manager** — pnpm 11+

## Requirements

- Node.js **24+**
- pnpm **11+**
- MongoDB instance (local or remote)
- Redis (optional)
- SMTP server for email (optional in dev)

## Getting Started
### 1. Clone the repository

```bash
git clone <Git URL> project
cd project
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values — at minimum `MONGO_URI` and `JWT_SECRET_KEY`.

### 4. Run the server

```bash
# Development (with hot reload)
pnpm dev

# Production
pnpm start
```

The server runs on `http://localhost:8000` by default. On startup it upserts the seeded
system roles (`user`, `admin`) into the `roles` collection — see `src/models/Role.ts`.

### 5. API documentation

Swagger UI is available at `http://localhost:8000/api-docs` while the server is running.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start in development mode with nodemon |
| `pnpm start` | Start in production mode |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code with Biome |
| `pnpm check` | Run Biome lint + format check |
| `pnpm check:ci` | Run Biome in CI mode (no writes, fails on any issue) |
| `pnpm spell` | Run cspell spell checker |
| `pnpm test:unit` | Run unit tests (`src/**/*.test.ts`) |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:e2e` | Run e2e tests (`e2e/`) against an in-memory MongoDB |
| `pnpm test:coverage` | Run unit + e2e together with merged coverage |
| `pnpm email:preview` | Preview React Email templates in browser |

## Project Structure

```
src/
  config/           # DB connection (+ default-role seeding), cookie config
  controllers/      # Route handlers (auth, user) — thin, delegate to services
  lib/
    casl/           # Role → permission ability definitions (CASL)
    handlers/       # asyncHandler, error handler
    logger/         # Winston logger (dev/prod/test)
    messages/       # User-facing response message strings
    middleware/     # CORS, body parser, auth (+ requirePermission), Redis, Swagger, validation
    swagger/        # OpenAPI path definitions and registry
    utils/          # Shared utilities (buildResponse, buildError, etc.)
    validators/     # Zod schemas
  models/           # Mongoose models — User, Role, Session, Otp
  repositories/     # Data access layer (base + user/role/session/otp)
  routes/
    v1/             # auth, users (v1)
    v2/             # users (v2)
  services/         # Business logic (auth, JWT, mail)
  types/            # Shared TypeScript types (JWT payload/subject, error shapes)
  views/
    pages/          # React Email page components
    template/       # Email templates (OTP, Welcome)
e2e/                # Supertest + mongodb-memory-server integration tests
```

Each `.ts` file under `src/` may have a co-located `*.test.ts` unit test — see
[AGENTS.md](./AGENTS.md) for the layering conventions and how to add a new feature.

## Authorization

Every user has a `roleId` pointing at a seeded `Role` document (`user` or `admin`).
`src/lib/casl/ability.ts` hardcodes what each system role can do — `requirePermission(action, subject)`
(in `src/lib/middleware/auth.ts`) checks that ability against the JWT's `role`/`permissions` claims
on any route that needs it, e.g. `requirePermission("read", "profile")`. Custom (non-system) roles
are also supported: their DB-stored `permissions: string[]` (`"action:subject"` strings) are parsed
instead of using a hardcoded rule set.

## Testing

- **Unit tests** (`pnpm test:unit`) mock every collaborator (repositories, services, `Response`
  objects) and run fast, with no real database.
- **E2E tests** (`pnpm test:e2e`) boot the real Express app against an in-memory MongoDB
  (`mongodb-memory-server`) via Supertest, exercising full request/response cycles.
- **Coverage** (`pnpm test:coverage`) runs both suites together for a merged coverage report
  (`coverage/index.html`), since some code paths are only exercised by one suite or the other.
  A pre-commit hook enforces a minimum of 80% statement/line coverage — commits are blocked if
  it drops below that.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/nodejs-boilerplate` |
| `PORT` | Server port | `8000` |
| `NODE_ENV` | `development`, `production`, or `test` | `development` |
| `JWT_SECRET_KEY` | Secret for signing JWTs | — |
| `DOMAIN` | Cookie domain (leave blank for localhost) | — |
| `USE_REDIS` | Enable Redis caching | `false` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (blank = all in dev) | — |
| `ACCESS_TOKEN_EXPIRY` | Access token TTL in seconds | `600` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token TTL in seconds | `604800` |
| `SMTP_HOST` | SMTP server host | — |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | Sender email address | `noreply@example.com` |

## CI

`.github/workflows/ci.yml` runs on every push/PR: type-check, format/lint, unit tests, and
dependency audit run in parallel; e2e tests run afterward (only once the fast checks pass);
spell-check runs independently. See [AGENTS.md](./AGENTS.md) for the local pre-commit hook.
