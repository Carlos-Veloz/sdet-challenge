# User Management API — E2E Test Suite

End-to-end API test suite for the **User Management API** SDET challenge, built with
**Playwright Test + TypeScript**, with schema validation (Ajv) driven directly by the OpenAPI
specification and a GitHub Actions pipeline that runs `dev` and `prod` in parallel.

| Challenge task               | Where                                                      |
| ---------------------------- | ---------------------------------------------------------- |
| 1. Test suites               | [`tests/`](tests) + [`src/`](src)                          |
| 2. GitHub Actions pipeline   | [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml)   |
| 3. Bugs report               | [`BUGS.md`](BUGS.md)                                       |
| Testing report (tool output) | `playwright-report/`, `reports/` (see [Reports](#reports)) |

---

## Tech stack

| Concern             | Choice                                                           |
| ------------------- | ---------------------------------------------------------------- |
| Language            | TypeScript                                                       |
| Runner / HTTP       | `@playwright/test` (`APIRequestContext`; **no browsers needed**) |
| Contract validation | `ajv` + `ajv-formats`, schemas loaded from the OpenAPI file      |
| Quality             | ESLint (typescript-eslint) + Prettier                            |
| CI                  | GitHub Actions, `services:` container, matrix `dev`/`prod`       |

## Architecture

```
.
├── .github/workflows/e2e.yml     # CI: lint job + parallel E2E matrix (dev, prod)
├── spec/sdet_challenge_api.yaml  # OpenAPI spec (source of truth for the contract)
├── src/
│   ├── config/env.ts             # BASE_URL, AUTH_TOKEN, environments
│   ├── clients/user-api.client.ts# UserApiClient: Service Object over the 5 endpoints
│   ├── contract/schema-validator.ts # Ajv validators built from the OpenAPI components
│   ├── data/
│   │   ├── user.factory.ts       # Unique, valid users (parallel-safe)
│   │   └── invalid-inputs.ts     # Data tables for negative tests
│   ├── fixtures/index.ts         # Playwright fixtures: api, seedUser, tracker (auto-cleanup)
│   └── support/assertions.ts     # expectStatus / expectSchema / expectError helpers
├── tests/
│   ├── users.list.spec.ts        # GET    /{env}/users
│   ├── users.create.spec.ts      # POST   /{env}/users
│   ├── users.get.spec.ts         # GET    /{env}/users/{email}
│   ├── users.update.spec.ts      # PUT    /{env}/users/{email}
│   ├── users.delete.spec.ts      # DELETE /{env}/users/{email}   (@auth)
│   ├── environment-isolation.spec.ts # dev <-> prod isolation     (@isolation)
│   └── contract.spec.ts          # Schema/contract checks         (@contract)
├── scripts/failures-summary.ts   # JSON report -> Markdown list of failing tests
├── playwright.config.ts          # Two projects: `dev` and `prod`
└── docker-compose.yml            # Local API container
```

### Design

1. **Service Object (`UserApiClient`)** — the only place that knows URLs, verbs and headers.
   It returns a normalised `ApiResult` (status, headers, parsed body **and** raw text), so any
   assertion can print exactly what the server answered. Payloads are typed `unknown` so negative
   tests can send invalid data.
2. **Environments as Playwright projects** — the same specs run once per project (`dev`, `prod`).
   The `env` option injected by the project selects the URL prefix (`/dev/...` or `/prod/...`).
3. **Contract from the spec** — `User` and `ErrorResponse` schemas are read from
   `spec/sdet_challenge_api.yaml` at runtime, with `additionalProperties: false` added so
   undocumented fields are flagged. Nothing is duplicated by hand.
4. **Independent, parallel-safe tests** — each test creates users with a unique email through
   `seedUser`; the `tracker` fixture deletes them afterwards, even when the test fails.
5. **Descriptive failures** — every assertion message includes `METHOD url -> status` and the
   response body, plus the expectation taken from the OpenAPI document.
6. **No retries** — retries would only mask deterministic bugs.

### Test coverage

| Area             | What is verified                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRUD flow        | Create → read → update → delete, persistence checked with follow-up GETs, list reflects every change                                                                            |
| Validation (400) | `age` 0 / -5 / 151 / 25.5 / `"30"` / null / boolean; invalid emails; wrong `name` types; each missing required field; empty body; no body; malformed JSON — on **POST and PUT** |
| Boundaries       | `age` 1 and 150 accepted                                                                                                                                                        |
| Not found (404)  | GET / PUT / DELETE on unknown email; deleted users; PUT must not create the user                                                                                                |
| Duplicates (409) | POST with existing email; PUT changing email to an existing one; original data untouched afterwards                                                                             |
| Auth (401)       | DELETE without header, wrong token, empty token, wrong casing, token in `Authorization`; user survives                                                                          |
| Isolation        | Data created in one environment is invisible in the other; same email can live in both; update/delete don't cross over; unknown environment prefix is not served                |
| Contract         | `User` on every success response; `ErrorResponse` on every documented error; JSON content type; 204 has no body                                                                 |
| Side effects     | Rejected requests (400/401/409) must not modify stored data                                                                                                                     |

> One inference beyond the literal spec: changing `email` through `PUT` is expected to re-key the
> record (email is the primary key _and_ a required body field). If the interviewer considers
> this undefined behaviour, that single test (`changing the email moves the user…`) can be removed.

---

## Prerequisites

- [Node.js](https://nodejs.org/) **20+** (22 recommended) and npm
- [Docker](https://docs.docker.com/get-docker/) installed and running

## Install

```bash
npm ci          # or: npm install
```

No `npx playwright install` is required: API tests do not launch a browser.

## Run the API locally

```bash
docker compose up -d
# or
docker run -p 3000:3000 ghcr.io/danielsilva-loanpro/sdet-interview-challenge:latest
```

Check it: `curl http://localhost:3000/dev/users` → JSON array.

## Run the tests

```bash
npm test               # both environments (projects dev + prod, in parallel)
npm run test:dev       # only /dev
npm run test:prod      # only /prod

npm run test:auth      # by tag: @auth | @contract | @isolation
npm run test:contract
```

Useful Playwright options:

```bash
npx playwright test --project=dev tests/users.create.spec.ts   # a single file
npx playwright test -g "rejects age"                            # by title
npx playwright test --ui                                        # interactive UI mode
```

### Configuration (environment variables)

| Variable     | Default                 | Purpose                                     |
| ------------ | ----------------------- | ------------------------------------------- |
| `BASE_URL`   | `http://localhost:3000` | Host of the API (without `/dev` or `/prod`) |
| `AUTH_TOKEN` | `mysecrettoken`         | Token sent in the `Authentication` header   |

Example: `BASE_URL=http://my-host:8080 npm run test:prod`. See `.env.example`.

## Reports

Each run produces:

| Output                         | Description                                   |
| ------------------------------ | --------------------------------------------- |
| `playwright-report/index.html` | HTML report (`npm run report` to open it)     |
| `reports/results.json`         | Machine-readable results                      |
| `reports/junit.xml`            | JUnit XML                                     |
| `reports/failures-summary.md`  | Failing tests + messages (`npm run failures`) |

`playwright-report/` and `reports/` are **not git-ignored** on purpose: after running the suite
against the real container you can commit them as the "Testing report" deliverable. The CI also
uploads them as artifacts.

## CI pipeline (GitHub Actions)

`.github/workflows/e2e.yml` defines two kinds of jobs:

- **`quality`** — typecheck, ESLint, Prettier.
- **`E2E - dev` / `E2E - prod`** — a matrix with `fail-fast: false`, so both environments run **in
  parallel and independently**. Each job starts its own API container through the native
  `services:` syntax (port `3000:3000`), waits for it to answer, runs
  `npx playwright test --project=<env>`, appends a failure summary to the job summary, and uploads
  `playwright-report-<env>` as an artifact (`if: always()`).

Because the application has known bugs, an environment job is reported **red when its tests
fail**; that is intentional and honest, and it never blocks the other environment. If you prefer
a green check while still keeping all evidence, add `continue-on-error: true` to the
_Run E2E tests_ step.

> The container image must be pullable by GitHub runners
> (`ghcr.io/danielsilva-loanpro/sdet-interview-challenge:latest`). If it were private, add a
> `credentials:` block under `services.api`.

## Bug reporting

Tests are written against the **specification**, so a failing test = a discrepancy between the
app and the OpenAPI document. The workflow to document bugs is:

1. `docker compose up -d && npm test`
2. `npm run failures` → `reports/failures-summary.md`
3. Reproduce each distinct failure with `curl`, and record it in [`BUGS.md`](BUGS.md).
