import { test, expect } from '../src/fixtures';
import { buildUser } from '../src/data/user.factory';
import {
  INVALID_AGES,
  INVALID_EMAILS,
  INVALID_NAMES,
  REQUIRED_FIELDS,
} from '../src/data/invalid-inputs';
import { expectError, expectSchema, expectStatus, explain } from '../src/support/assertions';

test.describe('POST /{env}/users', () => {
  test.describe('happy path', () => {
    test('creates a user and returns 201 with the created resource', async ({ api, tracker }) => {
      const user = buildUser();
      tracker.add(user.email);

      const res = await api.createUser(user);

      expectStatus(res, 201);
      expectSchema('User', res);
      expect(res.body, explain(res)).toEqual(user);
    });

    test('persists the user so it can be fetched afterwards', async ({ api, tracker }) => {
      const user = buildUser();
      tracker.add(user.email);
      expectStatus(await api.createUser(user), 201);

      const fetched = await api.getUser(user.email);
      expectStatus(fetched, 200);
      expect(fetched.body, explain(fetched)).toEqual(user);
    });

    for (const age of [1, 150]) {
      test(`accepts boundary age ${age}`, async ({ api, tracker }) => {
        const user = buildUser({ age });
        tracker.add(user.email);
        const res = await api.createUser(user);
        expectStatus(res, 201);
        expect((res.body as { age: number }).age, explain(res)).toBe(age);
      });
    }

    test('accepts an email with plus-addressing and subdomain', async ({ api, tracker }) => {
      const user = buildUser({ email: `qa+tag.${Date.now()}@mail.example.co.uk` });
      tracker.add(user.email);
      expectStatus(await api.createUser(user), 201);
    });
  });

  test.describe('validation (400)', () => {
    for (const [label, age] of INVALID_AGES) {
      test(`rejects age: ${label}`, async ({ api, tracker }) => {
        const user = buildUser({ age: age as number });
        tracker.add(user.email);
        const res = await api.createUser(user);
        expectError(res, 400);
      });
    }

    for (const [label, email] of INVALID_EMAILS) {
      test(`rejects email: ${label}`, async ({ api, tracker }) => {
        if (typeof email === 'string' && email) tracker.add(email);
        const res = await api.createUser(buildUser({ email: email as string }));
        expectError(res, 400);
      });
    }

    for (const [label, name] of INVALID_NAMES) {
      test(`rejects name: ${label}`, async ({ api, tracker }) => {
        const user = buildUser({ name: name as string });
        tracker.add(user.email);
        const res = await api.createUser(user);
        expectError(res, 400);
      });
    }

    for (const field of REQUIRED_FIELDS) {
      test(`rejects a body without "${field}"`, async ({ api, tracker }) => {
        const user = buildUser();
        tracker.add(user.email);
        const payload: Record<string, unknown> = { ...user };
        delete payload[field];
        expectError(await api.createUser(payload), 400);
      });
    }

    test('rejects an empty object', async ({ api }) => {
      expectError(await api.createUser({}), 400);
    });

    test('rejects a request without body', async ({ api }) => {
      expectError(await api.createUser(undefined), 400);
    });

    test('rejects malformed JSON', async ({ api }) => {
      expectError(await api.createUserRaw('{"name": "Jane", "email": '), 400);
    });

    test('does not persist a user that failed validation', async ({ api, tracker }) => {
      const user = buildUser({ age: 0 });
      tracker.add(user.email);
      expectStatus(await api.createUser(user), 400);
      expectStatus(await api.getUser(user.email), 404);
    });
  });

  test.describe('duplicates (409)', () => {
    test('rejects a second user with the same email', async ({ api, seedUser }) => {
      const original = await seedUser();
      const res = await api.createUser(buildUser({ email: original.email, name: 'Someone Else' }));
      expectError(res, 409);
    });

    test('keeps the original user untouched after a rejected duplicate', async ({
      api,
      seedUser,
    }) => {
      const original = await seedUser();
      await api.createUser({ ...original, name: 'Overwritten', age: 99 });

      const res = await api.getUser(original.email);
      expectStatus(res, 200);
      expect(res.body, explain(res)).toEqual(original);
    });

    test('allows re-using an email after the user was deleted', async ({ api, seedUser }) => {
      const original = await seedUser();
      expectStatus(await api.deleteUser(original.email), 204);
      expectStatus(await api.createUser(original), 201);
    });
  });
});
