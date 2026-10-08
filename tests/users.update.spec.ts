import { test, expect } from '../src/fixtures';
import { buildUser, missingEmail } from '../src/data/user.factory';
import {
  INVALID_AGES,
  INVALID_EMAILS,
  INVALID_NAMES,
  REQUIRED_FIELDS,
} from '../src/data/invalid-inputs';
import { expectError, expectSchema, expectStatus, explain } from '../src/support/assertions';

test.describe('PUT /{env}/users/{email}', () => {
  test.describe('happy path', () => {
    test('updates name and age, returning 200 with the updated resource', async ({
      api,
      seedUser,
    }) => {
      const user = await seedUser();
      const updated = { ...user, name: 'Updated Name', age: 55 };

      const res = await api.updateUser(user.email, updated);

      expectStatus(res, 200);
      expectSchema('User', res);
      expect(res.body, explain(res)).toEqual(updated);
    });

    test('persists the update', async ({ api, seedUser }) => {
      const user = await seedUser();
      const updated = { ...user, name: 'Persisted Name', age: 18 };
      expectStatus(await api.updateUser(user.email, updated), 200);

      const fetched = await api.getUser(user.email);
      expectStatus(fetched, 200);
      expect(fetched.body, explain(fetched)).toEqual(updated);
    });

    test('is idempotent: same payload twice returns 200 both times (no false 409)', async ({
      api,
      seedUser,
    }) => {
      const user = await seedUser();
      expectStatus(await api.updateUser(user.email, user), 200);
      expectStatus(await api.updateUser(user.email, user), 200);
    });

    for (const age of [1, 150]) {
      test(`accepts boundary age ${age}`, async ({ api, seedUser }) => {
        const user = await seedUser();
        expectStatus(await api.updateUser(user.email, { ...user, age }), 200);
      });
    }

    test('changing the email moves the user to the new email', async ({
      api,
      seedUser,
      tracker,
    }) => {
      // Email is the primary key and is a required field of the PUT body,
      // so the expected behaviour is that the record is re-keyed.
      const user = await seedUser();
      const newEmail = buildUser().email;
      tracker.add(newEmail);

      const res = await api.updateUser(user.email, { ...user, email: newEmail });
      expectStatus(res, 200);
      expect((res.body as { email: string }).email, explain(res)).toBe(newEmail);

      expectStatus(await api.getUser(newEmail), 200);
      expectError(await api.getUser(user.email), 404);
    });
  });

  test.describe('validation (400)', () => {
    for (const [label, age] of INVALID_AGES) {
      test(`rejects age: ${label}`, async ({ api, seedUser }) => {
        const user = await seedUser();
        expectError(await api.updateUser(user.email, { ...user, age }), 400);
      });
    }

    for (const [label, email] of INVALID_EMAILS) {
      test(`rejects email: ${label}`, async ({ api, seedUser }) => {
        const user = await seedUser();
        expectError(await api.updateUser(user.email, { ...user, email }), 400);
      });
    }

    for (const [label, name] of INVALID_NAMES) {
      test(`rejects name: ${label}`, async ({ api, seedUser }) => {
        const user = await seedUser();
        expectError(await api.updateUser(user.email, { ...user, name }), 400);
      });
    }

    for (const field of REQUIRED_FIELDS) {
      test(`rejects a body without "${field}"`, async ({ api, seedUser }) => {
        const user = await seedUser();
        const payload: Record<string, unknown> = { ...user };
        delete payload[field];
        expectError(await api.updateUser(user.email, payload), 400);
      });
    }

    test('rejects an empty object', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectError(await api.updateUser(user.email, {}), 400);
    });

    test('leaves the stored user unchanged after a rejected update', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectStatus(await api.updateUser(user.email, { ...user, name: 'Hacked', age: 999 }), 400);

      const fetched = await api.getUser(user.email);
      expect(fetched.body, explain(fetched)).toEqual(user);
    });
  });

  test.describe('not found (404)', () => {
    test('returns 404 when the user does not exist', async ({ api }) => {
      const ghost = buildUser({ email: missingEmail() });
      expectError(await api.updateUser(ghost.email, ghost), 404);
    });

    test('does not create the user as a side effect', async ({ api }) => {
      const ghost = buildUser({ email: missingEmail() });
      await api.updateUser(ghost.email, ghost);
      expectStatus(await api.getUser(ghost.email), 404);
    });
  });

  test.describe('duplicates (409)', () => {
    test('rejects changing the email to one that already exists', async ({ api, seedUser }) => {
      const first = await seedUser();
      const second = await seedUser();
      expectError(await api.updateUser(second.email, { ...second, email: first.email }), 409);
    });

    test('keeps both users untouched after a rejected email change', async ({ api, seedUser }) => {
      const first = await seedUser();
      const second = await seedUser();
      await api.updateUser(second.email, { ...second, email: first.email, name: 'Clobbered' });

      const a = await api.getUser(first.email);
      const b = await api.getUser(second.email);
      expect(a.body, explain(a)).toEqual(first);
      expect(b.body, explain(b)).toEqual(second);
    });
  });
});
