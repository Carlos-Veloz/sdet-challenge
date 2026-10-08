# Failure summary (auto-generated)

- **dev**: 79 passed, 33 failed
- **prod**: 86 passed, 26 failed

## dev (33 failing)

### OpenAPI contract › ErrorResponse schema › POST /users 409
`contract.spec.ts:60`

```
Error: Expected HTTP 409 per OpenAPI.
POST /dev/users -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### OpenAPI contract › ErrorResponse schema › GET /users/{email} 404
`contract.spec.ts:65`

```
Error: Expected HTTP 404 per OpenAPI.
GET /dev/users/missing.d1d1e714-bdf%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### OpenAPI contract › ErrorResponse schema › DELETE /users/{email} 401
`contract.spec.ts:85`

```
Error: Expected HTTP 401 per OpenAPI.
DELETE /dev/users/qa.8c346407-31c%40example.com -> HTTP 204
Response body: (empty)

expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 204
```

### OpenAPI contract › ErrorResponse schema › error message is a non-empty string
`contract.spec.ts:94`

```
Error: Expected HTTP 404 per OpenAPI.
GET /dev/users/missing.c24b9dbf-c36%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### environment isolation › a user created here is not visible in the other environment (GET by email)
`environment-isolation.spec.ts:8`

```
Error: Expected HTTP 404 per OpenAPI.
GET /prod/users/qa.b0d8f83e-6e7%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### POST /{env}/users › validation (400) › rejects email: missing domain ("user@")
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /dev/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "user@",
  "name": "QA User a67cb1a6-bb6"
}

```

### POST /{env}/users › validation (400) › rejects email: missing "@" ("user.domain.com")
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /dev/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "user.domain.com",
  "name": "QA User 7acffd34-e42"
}

```

### POST /{env}/users › validation (400) › rejects email: missing local part
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /dev/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "@example.com",
  "name": "QA User b2822ba0-61f"
}

```

### POST /{env}/users › validation (400) › rejects email: double "@"
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /dev/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "user@@example.com",
  "name": "QA User c6d8404c-b49"
}

```

### POST /{env}/users › validation (400) › rejects email: contains whitespace
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /dev/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "us er@example.com",
  "name": "QA User 87c5d568-89f"
}

```

### POST /{env}/users › validation (400) › rejects email: number
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /dev/users -> HTTP 201
Response body: {
  "age": 30,
  "email": 12345,
  "name": "QA User 568eeb59-e1f"
}

```

### POST /{env}/users › validation (400) › rejects name: number
`users.create.spec.ts:70`

```
Error: Expected HTTP 400 per OpenAPI.
POST /dev/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "qa.5351df14-db1@example.com",
  "name": 123
}

```

### POST /{env}/users › validation (400) › rejects name: object
`users.create.spec.ts:70`

```
Error: Expected HTTP 400 per OpenAPI.
POST /dev/users -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### POST /{env}/users › validation (400) › rejects malformed JSON
`users.create.spec.ts:96`

```
Error: Expected HTTP 400 per OpenAPI.
POST /dev/users -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### POST /{env}/users › validation (400) › does not persist a user that failed validation
`users.create.spec.ts:100`

```
Error: Expected HTTP 404 per OpenAPI.
GET /dev/users/qa.fc634649-eb7%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### POST /{env}/users › duplicates (409) › rejects a second user with the same email
`users.create.spec.ts:109`

```
Error: Expected HTTP 409 per OpenAPI.
POST /dev/users -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### DELETE /{env}/users/{email} › happy path › the user is no longer retrievable afterwards
`users.delete.spec.ts:18`

```
Error: Expected HTTP 404 per OpenAPI.
GET /dev/users/qa.223bbc27-43a%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### DELETE /{env}/users/{email} › authentication (401) › rejects a request without the Authentication header
`users.delete.spec.ts:39`

```
Error: Expected HTTP 401 per OpenAPI.
DELETE /dev/users/qa.adf3f436-ddf%40example.com -> HTTP 204
Response body: (empty)

expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 204
```

### DELETE /{env}/users/{email} › authentication (401) › rejects an invalid token
`users.delete.spec.ts:44`

```
Error: Expected HTTP 401 per OpenAPI.
DELETE /dev/users/qa.919a993b-cf7%40example.com -> HTTP 204
Response body: (empty)

expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 204
```

### DELETE /{env}/users/{email} › authentication (401) › rejects an empty token
`users.delete.spec.ts:49`

```
Error: Expected HTTP 401 per OpenAPI.
DELETE /dev/users/qa.18bdf862-839%40example.com -> HTTP 204
Response body: (empty)

expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 204
```

### DELETE /{env}/users/{email} › authentication (401) › rejects a token with different casing
`users.delete.spec.ts:54`

```
Error: Expected HTTP 401 per OpenAPI.
DELETE /dev/users/qa.62e240f6-1bc%40example.com -> HTTP 204
Response body: (empty)

expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 204
```

### DELETE /{env}/users/{email} › authentication (401) › rejects a valid token sent in the wrong header (Authorization)
`users.delete.spec.ts:59`

```
Error: Expected HTTP 401 per OpenAPI.
DELETE /dev/users/qa.08fa668e-92c%40example.com -> HTTP 204
Response body: (empty)

expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 204
```

### DELETE /{env}/users/{email} › authentication (401) › a rejected request does not delete the user
`users.delete.spec.ts:69`

```
Error: Expected HTTP 200 per OpenAPI.
GET /dev/users/qa.cc5aa175-395%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### GET /{env}/users/{email} › returns 404 with an ErrorResponse for an unknown email
`users.get.spec.ts:21`

```
Error: Expected HTTP 404 per OpenAPI.
GET /dev/users/missing.179d28fc-93b%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### GET /{env}/users/{email} › returns 404 for a deleted user
`users.get.spec.ts:25`

```
Error: Expected HTTP 404 per OpenAPI.
GET /dev/users/qa.1e37ff97-e6b%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### GET /{env}/users › reflects updates made via PUT
`users.list.spec.ts:28`

```
Error: GET /dev/users -> HTTP 200
Response body: [
  {
    "age": 30,
    "email": "12345",
    "name": "QA User 568eeb59-e1f"
  },
  {
```

### PUT /{env}/users/{email} › happy path › persists the update
`users.update.spec.ts:27`

```
Error: GET /dev/users/qa.8b7392d6-15f%40example.com -> HTTP 200
Response body: {
  "age": 30,
  "email": "qa.8b7392d6-15f@example.com",
  "name": "QA User 8b7392d6-15f"
}


```

### PUT /{env}/users/{email} › happy path › changing the email moves the user to the new email
`users.update.spec.ts:53`

```
Error: Expected HTTP 200 per OpenAPI.
GET /dev/users/qa.c6b8d0e8-011%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### PUT /{env}/users/{email} › validation (400) › rejects email: contains whitespace
`users.update.spec.ts:82`

```
Error: Expected HTTP 400 per OpenAPI.
PUT /dev/users/qa.8a7b2ce1-1e8%40example.com -> HTTP 200
Response body: {
  "age": 30,
  "email": "us er@example.com",
  "name": "QA User 8a7b2ce1-1e8"
}

```

### PUT /{env}/users/{email} › validation (400) › rejects email: number
`users.update.spec.ts:82`

```
Error: Expected HTTP 400 per OpenAPI.
PUT /dev/users/qa.10fd3536-abc%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### PUT /{env}/users/{email} › validation (400) › rejects name: number
`users.update.spec.ts:89`

```
Error: Expected HTTP 400 per OpenAPI.
PUT /dev/users/qa.c9c10cab-181%40example.com -> HTTP 200
Response body: {
  "age": 30,
  "email": "qa.c9c10cab-181@example.com",
  "name": 123
}

```

### PUT /{env}/users/{email} › validation (400) › rejects name: object
`users.update.spec.ts:89`

```
Error: Expected HTTP 400 per OpenAPI.
PUT /dev/users/qa.1c1132b1-888%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### PUT /{env}/users/{email} › not found (404) › does not create the user as a side effect
`users.update.spec.ts:124`

```
Error: Expected HTTP 404 per OpenAPI.
GET /dev/users/missing.1594c051-a75%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

## prod (26 failing)

### OpenAPI contract › ErrorResponse schema › POST /users 409
`contract.spec.ts:60`

```
Error: Expected HTTP 409 per OpenAPI.
POST /prod/users -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### OpenAPI contract › ErrorResponse schema › GET /users/{email} 404
`contract.spec.ts:65`

```
Error: Expected HTTP 404 per OpenAPI.
GET /prod/users/missing.dba387bb-4d7%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### OpenAPI contract › ErrorResponse schema › error message is a non-empty string
`contract.spec.ts:94`

```
Error: Expected HTTP 404 per OpenAPI.
GET /prod/users/missing.5cd927a5-2bc%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### environment isolation › a user created here is not visible in the other environment (GET by email)
`environment-isolation.spec.ts:8`

```
Error: Expected HTTP 404 per OpenAPI.
GET /dev/users/qa.c5e0bfc9-202%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### POST /{env}/users › validation (400) › rejects email: missing domain ("user@")
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /prod/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "user@",
  "name": "QA User 9601bab9-d12"
}

```

### POST /{env}/users › validation (400) › rejects email: missing "@" ("user.domain.com")
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /prod/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "user.domain.com",
  "name": "QA User 347ef08c-853"
}

```

### POST /{env}/users › validation (400) › rejects email: missing local part
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /prod/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "@example.com",
  "name": "QA User 665e5b41-836"
}

```

### POST /{env}/users › validation (400) › rejects email: double "@"
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /prod/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "user@@example.com",
  "name": "QA User b61d150d-b77"
}

```

### POST /{env}/users › validation (400) › rejects email: contains whitespace
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /prod/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "us er@example.com",
  "name": "QA User b41b5793-a78"
}

```

### POST /{env}/users › validation (400) › rejects email: number
`users.create.spec.ts:62`

```
Error: Expected HTTP 400 per OpenAPI.
POST /prod/users -> HTTP 201
Response body: {
  "age": 30,
  "email": 12345,
  "name": "QA User c0d56b08-7de"
}

```

### POST /{env}/users › validation (400) › rejects name: number
`users.create.spec.ts:70`

```
Error: Expected HTTP 400 per OpenAPI.
POST /prod/users -> HTTP 201
Response body: {
  "age": 30,
  "email": "qa.107755c2-42c@example.com",
  "name": 123
}

```

### POST /{env}/users › validation (400) › rejects name: object
`users.create.spec.ts:70`

```
Error: Expected HTTP 400 per OpenAPI.
POST /prod/users -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### POST /{env}/users › validation (400) › rejects malformed JSON
`users.create.spec.ts:96`

```
Error: Expected HTTP 400 per OpenAPI.
POST /prod/users -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### POST /{env}/users › validation (400) › does not persist a user that failed validation
`users.create.spec.ts:100`

```
Error: Expected HTTP 404 per OpenAPI.
GET /prod/users/qa.d2a8af1a-e81%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### POST /{env}/users › duplicates (409) › rejects a second user with the same email
`users.create.spec.ts:109`

```
Error: Expected HTTP 409 per OpenAPI.
POST /prod/users -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### DELETE /{env}/users/{email} › happy path › the user is no longer retrievable afterwards
`users.delete.spec.ts:18`

```
Error: Expected HTTP 404 per OpenAPI.
GET /prod/users/qa.cc247f04-342%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### GET /{env}/users/{email} › returns 404 with an ErrorResponse for an unknown email
`users.get.spec.ts:21`

```
Error: Expected HTTP 404 per OpenAPI.
GET /prod/users/missing.6669146a-322%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### GET /{env}/users/{email} › returns 404 for a deleted user
`users.get.spec.ts:25`

```
Error: Expected HTTP 404 per OpenAPI.
GET /prod/users/qa.8896a739-365%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### GET /{env}/users › reflects updates made via PUT
`users.list.spec.ts:28`

```
Error: GET /prod/users -> HTTP 200
Response body: [
  {
    "age": 30,
    "email": "12345",
    "name": "QA User c0d56b08-7de"
  },
  {
```

### PUT /{env}/users/{email} › happy path › persists the update
`users.update.spec.ts:27`

```
Error: GET /prod/users/qa.a9902e3f-d94%40example.com -> HTTP 200
Response body: {
  "age": 30,
  "email": "qa.a9902e3f-d94@example.com",
  "name": "QA User a9902e3f-d94"
}


```

### PUT /{env}/users/{email} › happy path › changing the email moves the user to the new email
`users.update.spec.ts:53`

```
Error: Expected HTTP 200 per OpenAPI.
GET /prod/users/qa.e99bc622-d13%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### PUT /{env}/users/{email} › validation (400) › rejects email: contains whitespace
`users.update.spec.ts:82`

```
Error: Expected HTTP 400 per OpenAPI.
PUT /prod/users/qa.9ca07c6c-aee%40example.com -> HTTP 200
Response body: {
  "age": 30,
  "email": "us er@example.com",
  "name": "QA User 9ca07c6c-aee"
}

```

### PUT /{env}/users/{email} › validation (400) › rejects email: number
`users.update.spec.ts:82`

```
Error: Expected HTTP 400 per OpenAPI.
PUT /prod/users/qa.00fe3f03-061%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### PUT /{env}/users/{email} › validation (400) › rejects name: number
`users.update.spec.ts:89`

```
Error: Expected HTTP 400 per OpenAPI.
PUT /prod/users/qa.a8ccdae5-8a1%40example.com -> HTTP 200
Response body: {
  "age": 30,
  "email": "qa.a8ccdae5-8a1@example.com",
  "name": 123
}

```

### PUT /{env}/users/{email} › validation (400) › rejects name: object
`users.update.spec.ts:89`

```
Error: Expected HTTP 400 per OpenAPI.
PUT /prod/users/qa.62d8f1bd-513%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```

### PUT /{env}/users/{email} › not found (404) › does not create the user as a side effect
`users.update.spec.ts:124`

```
Error: Expected HTTP 404 per OpenAPI.
GET /prod/users/missing.fe3dfecb-a72%40example.com -> HTTP 500
Response body: {
  "error": "Internal server error"
}


expect(received).toBe(expected) // Object.is equality
```
