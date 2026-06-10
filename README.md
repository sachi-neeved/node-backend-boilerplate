# Node.js Backend Boilerplate (Class-based)

A simple, class-based Node.js API boilerplate for rapid backend development.

## Tech Stack

- **Runtime** — Node.js 24+, TypeScript 6
- **Framework** — Express 5
- **Database** — MongoDB via Mongoose
- **Auth** — JWT (access + refresh tokens), bcrypt, HTTP-only cookies
- **Email** — Nodemailer with React Email templates
- **Cache** — Redis (optional, via express-expeditious)
- **Validation** — Zod schemas
- **API Docs** — Swagger UI (`/api-docs`)
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

The server runs on `http://localhost:8000` by default.

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
| `pnpm spell` | Run cspell spell checker |
| `pnpm email:preview` | Preview React Email templates in browser |

## Project Structure

```
src/
  config/           # DB connection, cookie config
  controllers/      # Route handlers (auth, user)
  lib/
    handlers/       # asyncHandler, error handler
    logger/         # Winston logger (dev/prod)
    middleware/     # CORS, body parser, auth, Redis, Swagger, validation
    swagger/        # OpenAPI path definitions and registry
    utils/          # Shared utilities (buildResponse, buildError, etc.)
    validators/     # Zod schemas
  models/           # Mongoose models
  repositories/     # Data access layer (base + user)
  routes/
    v1/             # auth, users (v1)
    v2/             # users (v2)
  services/         # Business logic (auth, JWT, mail)
  views/
    pages/          # React Email page components
    template/       # Email templates (OTP, Welcome)
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/court-record` |
| `PORT` | Server port | `8000` |
| `NODE_ENV` | `development` or `production` | `development` |
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
