# Bugs Report

Findings from running the E2E suite against the challenge container
(`ghcr.io/danielsilva-loanpro/sdet-interview-challenge:latest`).
All tests assert the behaviour described in `spec/sdet_challenge_api.yaml`; a failing test is a
discrepancy between the application and the specification.

**Run result:** `dev` 79 passed / 33 failed · `prod` 86 passed / 26 failed (224 tests total).
The 59 failures come from **8 distinct root causes**, because the validation tests are
parameterised and several tests hit the same defect.

## Summary

| ID     | Severity | Endpoint                      | Env     | Title                                                           | Failing tests (dev / prod) |
| ------ | -------- | ----------------------------- | ------- | --------------------------------------------------------------- | -------------------------- |
| BUG-01 | Critical | `DELETE /{env}/users/{email}` | **dev** | Authentication is not enforced: any/no token deletes the user   | 7 / 0                      |
| BUG-02 | High     | `GET /{env}/users/{email}`    | both    | Unknown (or deleted) email returns 500 instead of 404           | 8 / 8                      |
| BUG-03 | High     | `POST /{env}/users`           | both    | Duplicate email returns 500 instead of 409                      | 2 / 2                      |
| BUG-04 | High     | `PUT /{env}/users/{email}`    | both    | PUT returns 200 with the new data but does not persist anything | 3 / 3                      |
| BUG-05 | Medium   | `POST /{env}/users`           | both    | Email format is not validated (invalid emails are created)      | 6 / 6                      |
| BUG-06 | Medium   | `PUT /{env}/users/{email}`    | both    | Incomplete email validation: whitespace accepted, number → 500  | 2 / 2                      |
| BUG-07 | Medium   | `POST` and `PUT` (users)      | both    | `name` type is not validated (number accepted, object → 500)    | 4 / 4                      |
| BUG-08 | Medium   | `POST /{env}/users`           | both    | Malformed JSON body returns 500 instead of 400                  | 1 / 1                      |

Severity guide: **Critical** security / data loss · **High** wrong status or data in a main flow ·
**Medium** validation gap or unhandled input · **Low** cosmetic.

> Totals add up: dev 7 + 8 + 2 + 3 + 6 + 2 + 4 + 1 = 33; prod 0 + 8 + 2 + 3 + 6 + 2 + 4 + 1 = 26.
> BUG-01's dev count includes one side-effect test (`a rejected request does not delete the user`):
> the user is wrongly deleted and the follow-up GET then hits BUG-02.

**What works as specified** (tests passing in both environments): `age` validation
(0, negative, 151, float, string, null, boolean), required fields on POST and PUT, `PUT` 404 and 409,
`DELETE` 404, boundary ages 1 and 150, `GET /users` list, and isolation of data between `/dev`
and `/prod`. In `prod`, DELETE authentication works.

---

## BUG-01 — DELETE does not enforce authentication in `dev`

| Field                  | Value                                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**           | `DELETE /dev/users/{email}`                                                                                                                    |
| **Environment**        | `dev` only (`prod` correctly returns 401)                                                                                                      |
| **Severity**           | Critical                                                                                                                                       |
| **Expected (OpenAPI)** | The `Authentication` header is required; missing or invalid token → `401` with `ErrorResponse`                                                 |
| **Actual**             | `204 No Content` and the user is deleted, with no header, an invalid token, an empty token, wrong casing, or the token sent in `Authorization` |

**Steps to reproduce**

```bash
curl -s -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":"jane.auth@example.com","age":30}'

# No header at all -> expected 401
curl -i -X DELETE http://localhost:3000/dev/users/jane.auth%40example.com
# Compare with prod (works as specified):
curl -s -X POST http://localhost:3000/prod/users -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":"jane.auth@example.com","age":30}'
curl -i -X DELETE http://localhost:3000/prod/users/jane.auth%40example.com   # -> 401
```

**Actual response (dev):** `HTTP 204`, empty body.

**Associated tests** (`tests/users.delete.spec.ts` › authentication (401)): _rejects a request without
the Authentication header_, _rejects an invalid token_, _rejects an empty token_, _rejects a token with
different casing_, _rejects a valid token sent in the wrong header (Authorization)_, and
`tests/contract.spec.ts` › ErrorResponse schema › _DELETE /users/{email} 401_. Side effect test:
_a rejected request does not delete the user_.

**Impact:** anyone can delete any user in `dev`. Environments are documented as having "identical behavior".

---

## BUG-02 — GET of a non-existent user returns 500 instead of 404

| Field                  | Value                                            |
| ---------------------- | ------------------------------------------------ |
| **Endpoint**           | `GET /{env}/users/{email}`                       |
| **Environment**        | both                                             |
| **Severity**           | High                                             |
| **Expected (OpenAPI)** | `404` with `{"error": "..."}` ("User not found") |
| **Actual**             | `500` with `{"error": "Internal server error"}`  |

**Steps to reproduce**

```bash
curl -i http://localhost:3000/dev/users/does.not.exist%40example.com
curl -i http://localhost:3000/prod/users/does.not.exist%40example.com
```

**Actual response:**

```
HTTP/1.1 500 Internal Server Error
{"error":"Internal server error"}
```

**Associated tests:** `users.get.spec.ts` › _returns 404 with an ErrorResponse for an unknown email_,
_returns 404 for a deleted user_; `users.delete.spec.ts` › _the user is no longer retrievable afterwards_;
`users.update.spec.ts` › _does not create the user as a side effect_; `users.create.spec.ts` ›
_does not persist a user that failed validation_; `contract.spec.ts` › _GET /users/{email} 404_ and
_error message is a non-empty string_; `environment-isolation.spec.ts` › _a user created here is not
visible in the other environment (GET by email)_.

**Notes:** `PUT` and `DELETE` on unknown emails correctly return 404, so only the GET path is broken.
It also breaks every flow that relies on GET-after-delete to confirm removal.

---

## BUG-03 — Duplicate email on POST returns 500 instead of 409

| Field                  | Value                                        |
| ---------------------- | -------------------------------------------- |
| **Endpoint**           | `POST /{env}/users`                          |
| **Environment**        | both                                         |
| **Severity**           | High                                         |
| **Expected (OpenAPI)** | `409` "Duplicate email" with `ErrorResponse` |
| **Actual**             | `500` `{"error":"Internal server error"}`    |

**Steps to reproduce**

```bash
BODY='{"name":"Jane","email":"jane.dup@example.com","age":30}'
curl -i -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' -d "$BODY"  # 201
curl -i -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' -d "$BODY"  # expected 409, got 500
```

**Associated tests:** `users.create.spec.ts` › duplicates (409) › _rejects a second user with the same
email_; `contract.spec.ts` › ErrorResponse schema › _POST /users 409_.

**Notes:** the original record is not modified. The duplicate is detected (otherwise it would return 201) but the error is not mapped to 409. `PUT` with a duplicate email correctly returns 409.

---

## BUG-04 — PUT returns 200 with the updated data but does not persist it

| Field                  | Value                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **Endpoint**           | `PUT /{env}/users/{email}`                                                                |
| **Environment**        | both                                                                                      |
| **Severity**           | High                                                                                      |
| **Expected (OpenAPI)** | `200` "User updated successfully"; the update must be visible in subsequent reads         |
| **Actual**             | `200` echoing the new data, but a later `GET` still returns the **original** name and age |

**Steps to reproduce**

```bash
curl -s -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' \
  -d '{"name":"Before","email":"jane.put@example.com","age":30}'
curl -i -X PUT http://localhost:3000/dev/users/jane.put%40example.com -H 'Content-Type: application/json' \
  -d '{"name":"After","email":"jane.put@example.com","age":18}'   # 200, body shows "After"/18
curl -i http://localhost:3000/dev/users/jane.put%40example.com    # expected "After"/18
```

**Actual response (GET after PUT, from the report):**
`{"age":30,"email":"…@example.com","name":"QA User …"}` — original values.

**Associated tests:** `users.update.spec.ts` › happy path › _persists the update_, _changing the email moves
the user to the new email_ (the new email cannot be fetched afterwards); `users.list.spec.ts` ›
_reflects updates made via PUT_.

**Notes:** the test _updates name and age, returning 200 with the updated resource_ passes, which is
why the defect is easy to miss: only the response body is right. Verify with the curl above that the
GET after PUT really returns the old values before submitting (the list test failure is consistent
with the same root cause but its body was truncated in the summary).

---

## BUG-05 — POST does not validate email format

| Field                  | Value                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**           | `POST /{env}/users`                                                                                                           |
| **Environment**        | both                                                                                                                          |
| **Severity**           | Medium                                                                                                                        |
| **Expected (OpenAPI)** | `email` has `format: email`; invalid values → `400` Validation error                                                          |
| **Actual**             | `201 Created` for `user@`, `user.domain.com`, `@example.com`, `user@@example.com`, `us er@example.com` and the number `12345` |

Only an empty string and `null` are rejected.

**Steps to reproduce**

```bash
curl -i -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":"user@","age":30}'          # expected 400, got 201
curl -i -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":12345,"age":30}'            # expected 400, got 201
```

**Actual response (number case):** `201` with `"email": 12345` (a number). A later `GET /dev/users`
lists the same record with `"email": "12345"` (a string), so the type also changes between responses.

**Associated tests:** `users.create.spec.ts` › validation (400) › _rejects email: missing domain ("user@")_,
_missing "@"_, _missing local part_, _double "@"_, _contains whitespace_, _number_.

**Notes:** `PUT` does validate most of these formats (see BUG-06), so POST and PUT are inconsistent.

---

## BUG-06 — PUT email validation is incomplete

| Field                  | Value                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| **Endpoint**           | `PUT /{env}/users/{email}`                                          |
| **Environment**        | both                                                                |
| **Severity**           | Medium                                                              |
| **Expected (OpenAPI)** | invalid `email` → `400` Validation error                            |
| **Actual**             | `us er@example.com` → `200` (stored); numeric email `12345` → `500` |

**Steps to reproduce**

```bash
curl -s -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":"jane.v@example.com","age":30}'
curl -i -X PUT http://localhost:3000/dev/users/jane.v%40example.com -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":"us er@example.com","age":30}'   # expected 400, got 200
curl -i -X PUT http://localhost:3000/dev/users/jane.v%40example.com -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":12345,"age":30}'                  # expected 400, got 500
```

**Associated tests:** `users.update.spec.ts` › validation (400) › _rejects email: contains whitespace_,
_rejects email: number_.

---

## BUG-07 — `name` type is not validated

| Field                  | Value                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Endpoint**           | `POST /{env}/users`, `PUT /{env}/users/{email}`                                        |
| **Environment**        | both                                                                                   |
| **Severity**           | Medium                                                                                 |
| **Expected (OpenAPI)** | `name` is `type: string`; other types → `400` Validation error                         |
| **Actual**             | `name: 123` → `201` (POST) / `200` (PUT) and stored as a number; `name: {...}` → `500` |

`name: null` and `name: false` are correctly rejected.

**Steps to reproduce**

```bash
curl -i -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' \
  -d '{"name":123,"email":"jane.n1@example.com","age":30}'              # expected 400, got 201
curl -i -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' \
  -d '{"name":{"first":"Jane"},"email":"jane.n2@example.com","age":30}' # expected 400, got 500
```

**Associated tests:** `users.create.spec.ts` › _rejects name: number_, _rejects name: object_;
`users.update.spec.ts` › _rejects name: number_, _rejects name: object_.

---

## BUG-08 — Malformed JSON returns 500 instead of 400

| Field                  | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| **Endpoint**           | `POST /{env}/users`                                  |
| **Environment**        | both                                                 |
| **Severity**           | Medium                                               |
| **Expected (OpenAPI)** | `400` Validation error (client sent an invalid body) |
| **Actual**             | `500` `{"error":"Internal server error"}`            |

**Steps to reproduce**

```bash
curl -i -X POST http://localhost:3000/dev/users -H 'Content-Type: application/json' \
  -d '{"name": "Jane", "email": '
```

**Associated test:** `users.create.spec.ts` › validation (400) › _rejects malformed JSON_.

**Notes:** the spec does not mention unparsable JSON explicitly; a 500 (server fault) for a client
error is wrong under any reading, and `400` is the closest documented status.
