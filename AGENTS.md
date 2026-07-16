# AGENTS.md

Guidance for an AI agent (or a new contributor) implementing a feature in this codebase.
Read this before writing code — it documents the layering and conventions the existing
code already follows; new code should match them rather than introduce new patterns.

## Architecture

Request flow is a straight line through five layers. Each layer only talks to the one
directly below it:

```
Route (Express Router)
  → validate(ZodSchema) middleware
  → authMiddleware / requirePermission(action, subject)   [if protected]
  → Controller method (asyncHandler-wrapped)
    → Service method (business logic, throws AppError on failure)
      → Repository method (Mongoose query)
        → Model (Mongoose schema)
```

Every class in the Controller/Service/Repository layers uses **constructor injection with
a default**, never an inheritance-based singleton/manager:

```ts
class AuthController {
	constructor(
		private readonly authServices: AuthService = new AuthService(),
		private readonly mailService: MailService = new MailService(),
	) {}
}
```

This means production code does `new AuthController()` and gets real dependencies for
free, while tests do `new AuthController(fakeAuthServices, fakeMailService)` and get full
control. Follow this pattern for any new class in these three layers — don't reach for a
DI container or a base-class `Manager`.

## Layer-by-layer conventions

### Models (`src/models/`)

- One file per model, named after the model (`User.ts`, `Role.ts`).
- Export the Mongoose `Document`/data interfaces (`UserDocument`, `UserData`) and the
  compiled model (`UserModel`) from the same file.
- Barrel-exported from `src/models/index.ts` (`export * from "./User"`).
- Models are excluded from coverage (`vitest.config.ts`) — they're schema declarations,
  not logic.

### Repositories (`src/repositories/`)

- One class per model, extending `BaseRepository<TDoc, TCreate>` (`src/repositories/baseRepository.ts`),
  which already provides `findAll`, `findById`, `findOne`, `findOneAndUpdate`,
  `findByIdAndUpdate`, `create`.
- Only add a method here if `BaseRepository` doesn't cover the query shape you need:

  ```ts
  class SessionRepository extends BaseRepository<SessionDocument, SessionData> {
  	constructor() {
  		super(SessionModel);
  	}

  	findByTokenHash(tokenHash: string): Promise<SessionDocument | null> {
  		return this.model.findOne({ tokenHash, isRevoked: false });
  	}
  }
  ```
- Repositories don't throw `AppError` or know about HTTP — they return `null`/`[]`/a
  document. Error semantics belong in the service layer.
- Use `{ returnDocument: "after" }` for update-and-return calls (matches `BaseRepository`'s
  default) — never the deprecated `{ new: true }`.

### Services (`src/services/`)

- Constructor-inject every repository the service needs, each defaulted to `new X()`:

  ```ts
  class AuthService {
  	constructor(
  		private readonly userRepository: UserRepository = new UserRepository(),
  		private readonly roleRepository: RoleRepository = new RoleRepository(),
  	) {}
  }
  ```
- This is where business rules live: validation beyond schema shape, cross-repository
  orchestration, throwing errors.
- Failure path: `return buildError(StatusCodes.X, UserMessages.Y)` — `buildError` (in
  `src/lib/utils/buildError.ts`) always throws an `AppError`, typed `never`, so `return
  buildError(...)` reads as an early-return but actually throws. Never `throw new Error(...)`
  directly — always go through `AppError`/`buildError` so `handleError` can classify it.
- Add user-facing strings to `src/lib/messages/user.ts` rather than inlining them.

### Controllers (`src/controllers/`)

- Constructor-inject services the same way, defaulted to `new X()`.
- Every route-handling method is an arrow function property (so it can be passed directly
  as an Express handler without losing `this`) wrapped in `asyncHandler`:

  ```ts
  public getProfile = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  	const reqUser = getUser(res); // throws AppError(401) if unauthenticated
  	const user = await this.authServices.findLoggedInUser(reqUser.id);
  	if (!user) return buildError(StatusCodes.NOT_FOUND, UserMessages.USER_NOT_FOUND);
  	buildResponse(res, { user });
  });
  ```
- `asyncHandler` (`src/lib/handlers/asyncHandler.ts`) catches both sync throws and rejected
  promises and forwards them to `next(err)` — you never need your own try/catch in a
  controller method.
- Success responses go through `buildResponse(res, data, statusCode?)`
  (`src/lib/utils/buildResponse.ts`), which wraps the payload as `{ success: true, response: data }`.
- To read the authenticated user, use `getUser(res)` from `src/lib/middleware/auth.ts` — it
  returns the JWT subject or throws `401`. Don't read `res.locals.user` directly.

### Routes (`src/routes/v{1,2}/`)

- One class per resource, same shape as the layers above (a `Router` instance built in the
  constructor, routes wired in `initializeRoutes()`):

  ```ts
  class AuthRouter {
  	public router: Router;
  	private readonly authController: AuthController = new AuthController();

  	constructor() {
  		this.router = Router();
  		this.initializeRoutes();
  	}

  	private initializeRoutes() {
  		this.router.post("/register", validate(RegisterSchema), this.authController.register);
  		this.router.get("/me", authMiddleware, this.authController.getProfile);
  	}
  }

  export default new AuthRouter().router;
  ```
- Validate every request body/params/query with a Zod schema via the `validate()` middleware
  — don't hand-check `req.body` in the controller.
- Gate protected routes with `authMiddleware` (requires a valid JWT) and, where the action
  needs a specific permission, also `requirePermission(action, subject)` — see Authorization
  below.
- New route modules are wired with **static imports only** — `src/routes/index.ts` and
  `src/routes/v1/index.ts` / `v2/index.ts` import each router directly. Do not reintroduce a
  runtime `fs.readdirSync` + `require()` discovery scan: Vitest's module loader can't resolve
  a `require()` call whose path is only known at runtime, even though `ts-node` handles it
  fine — this broke e2e tests once already and was deliberately fixed by switching to static
  imports.

### Validation (`src/lib/validators/`)

- One Zod object schema per request shape, named `XSchema`, validating `{ body, params?, query? }`:

  ```ts
  export const RegisterSchema = z.object({
  	body: z.object({
  		email: z.email("Invalid email"),
  		password: z.string().min(8, "Password must be at least 8 characters"),
  	}),
  });
  export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
  ```
- Export the inferred `XInput` type alongside the schema and use it in the controller:
  `req.body as RegisterInput`.

### Authorization (`src/lib/casl/ability.ts`, `src/lib/middleware/auth.ts`)

- Two system roles today: `user` and `admin` (seeded via `DEFAULT_ROLES` in `src/models/Role.ts`,
  upserted on startup in `src/config/db.ts`). Their abilities are **hardcoded** in
  `SYSTEM_ROLE_ABILITIES` in `ability.ts` — DB `permissions` are ignored for system roles so
  access can't be escalated by editing the database.
- Custom (non-system) roles instead store `permissions: string[]` (`"action:subject"`
  strings, e.g. `"read:users"`), parsed at request time.
- To protect a route by permission, add `requirePermission(action, subject)` after
  `authMiddleware`:

  ```ts
  this.router.get("/me", authMiddleware, requirePermission("read", "profile"), this.userController.getUser);
  ```
- Adding a new permission subject: extend the `SUBJECTS` tuple in `ability.ts`, and decide
  whether `user`/`admin` should get it by default in `SYSTEM_ROLE_ABILITIES`.

### API docs (`src/lib/swagger/`)

- One `paths/v{n}/x.paths.ts` file per resource, exporting `registerXPaths(registry)`, which
  registers each route's request/response Zod schemas via `zod-to-openapi`.
- Wired into `src/lib/swagger/index.ts` — also static imports, same reason as routes. That
  file's import order matters (the `registry.ts` import must run first to patch Zod with
  `.openapi()` before any paths file calls it), which is why `organizeImports` is disabled
  for that one file in `biome.json`'s `overrides` — don't remove that override.
- Optional for internal-only endpoints, but expected for anything public-facing.

## Testing

- Every file gets a co-located `*.test.ts` unit test (e.g. `authController.ts` →
  `authController.test.ts`), using Vitest (`describe`/`it`/`vi.fn()`), not Jest.
- **Mock at the constructor boundary, not deeper.** Build a `Partial<T>`-overridable fake
  and cast it, the same way every existing test does:

  ```ts
  function createMockUserRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  	return { findOne: vi.fn(), create: vi.fn(), ...overrides } as unknown as UserRepository;
  }
  ```
- For controller tests, build a fake `Response` (`{ status: vi.fn().mockReturnThis(), json/send: vi.fn() }`,
  optionally `locals` for `getUser`) and a fake `NextFunction`. Controller methods are
  fire-and-forget (wrapped in `asyncHandler`), so **don't `await` the call itself** — wait for
  the effect instead: `await vi.waitFor(() => expect(res.send).toHaveBeenCalled())`.
- For `AppError` assertions, check `.rejects.toMatchObject({ code })` (service tests) or
  `next` being called `with(expect.objectContaining({ code }))` (controller tests).
- To mock a module-level import (e.g. `logger`, `nodemailer`, `../constants`), use
  `vi.mock("path", factory)` — if the factory closure needs a variable declared in the test
  file, wrap it in `vi.hoisted()` first (`vi.mock` calls are hoisted above regular `const`s,
  so referencing an un-hoisted variable throws "Cannot access before initialization").
- Repositories are thin Mongoose wrappers — unit-test one only when it has a query worth
  asserting the shape of (see `sessionRepository.test.ts` for the pattern: mock the Model's
  static methods directly, not the repository).
- **E2E tests** (`e2e/*.e2e.test.ts`) boot the real app (`createApp()` from `src/index.ts`)
  against a real in-memory Mongo (`mongodb-memory-server`) and hit it with `supertest`. Use
  these for full request/response flows you can't cheaply fake (e.g. register → verify →
  login → refresh → logout). They manage their own Mongo connection independently of the
  app's normal `initDb()`, so if a flow depends on seeded data (like the `user` role), the
  e2e file has to seed it itself in `beforeAll`.
- Run `pnpm test:unit` while iterating; run `pnpm test:coverage` before committing to see the
  merged unit+e2e number that actually gates the commit (see below).

## Local gates

- **Pre-commit** (`.husky/pre-commit`), in order: (1) — only when `package.json`/
  `pnpm-lock.yaml` are staged — `pnpm audit --audit-level high`, runs first so a vulnerable
  dependency fails fast before spending time on anything else; (2) Biome (auto-fixes staged
  files); (3) cspell; (4) `pnpm test:coverage` last, since it's the slowest check. The
  coverage run enforces `statements: 80, lines: 80` (configured in `vitest.config.ts`'s
  `coverage.thresholds`) — a commit that drops below that fails. Branch/function coverage
  aren't gated yet (they sit lower today); tighten those thresholds only once real coverage
  clears them, not by lowering the bar.
- **CI** (`.github/workflows/ci.yml`): dependency-audit runs first with no `needs:` and gates
  type-check, format/lint, and unit-tests (`needs: [dependency-audit]`) — a vulnerable
  dependency fails the whole pipeline immediately instead of after the other jobs already
  spent runner time. Those three then run in parallel with each other. e2e-tests runs only
  after all three pass (it's the slowest job — no point paying for a real Mongo boot if a
  fast check already failed). spell-check runs independently of all of it.

## Checklist for a new feature

1. Model (if new data) in `src/models/`, barrel-exported from `src/models/index.ts`.
2. Repository extending `BaseRepository`, only adding methods `BaseRepository` doesn't cover.
3. Zod schema(s) in `src/lib/validators/`, exporting both the schema and its inferred `Input` type.
4. Service method: injected repositories, throws `AppError` via `buildError` on failure.
5. Controller method: injected service(s), `asyncHandler`-wrapped, `getUser`/`buildResponse`/`buildError`.
6. Route: `validate(Schema)`, `authMiddleware`/`requirePermission` if protected, wired via
   static import into the versioned router index.
7. (Public endpoints) Swagger path registration in `src/lib/swagger/paths/v{n}/`.
8. Unit tests for the new repository method (if non-trivial), service method, and controller
   method — mock at the constructor boundary.
9. E2E test update if the change affects an existing user-facing flow.
10. `npx tsc --noEmit`, `pnpm check:ci`, `pnpm test:coverage` all clean before committing.
