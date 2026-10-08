import { test, expect } from '../src/fixtures';
import { UserApiClient } from '../src/clients/user-api.client';
import { otherEnvironment } from '../src/config/env';
import { buildUser } from '../src/data/user.factory';
import { expectError, expectStatus, explain } from '../src/support/assertions';

test.describe('environment isolation', { tag: '@isolation' }, () => {
  test('a user created here is not visible in the other environment (GET by email)', async ({
    request,
    env,
    seedUser,
  }) => {
    const other = new UserApiClient(request, otherEnvironment(env));
    const user = await seedUser();
    expectError(await other.getUser(user.email), 404);
  });

  test('a user created here is not listed in the other environment', async ({
    api,
    request,
    env,
    seedUser,
  }) => {
    const other = new UserApiClient(request, otherEnvironment(env));
    const user = await seedUser();

    const res = await other.listUsers();
    expectStatus(res, 200);
    const emails = (res.body ?? []).map((u) => u.email);
    expect(emails, `${api.env} user leaked into ${other.env}.\n${explain(res)}`).not.toContain(
      user.email,
    );
  });

  test('the same email can exist independently in both environments (no cross-env 409)', async ({
    api,
    request,
    env,
  }) => {
    const other = new UserApiClient(request, otherEnvironment(env));
    const user = buildUser();
    try {
      expectStatus(await api.createUser(user), 201);
      expectStatus(await other.createUser({ ...user, name: 'Other Env Twin', age: 61 }), 201);

      // Each environment keeps its own data for the same email.
      const here = await api.getUser(user.email);
      const there = await other.getUser(user.email);
      expect(here.body, explain(here)).toEqual(user);
      expect(there.body, explain(there)).toEqual({ ...user, name: 'Other Env Twin', age: 61 });
    } finally {
      await api.deleteUser(user.email).catch(() => undefined);
      await other.deleteUser(user.email).catch(() => undefined);
    }
  });

  test('updating a user here does not alter the same email in the other environment', async ({
    api,
    request,
    env,
  }) => {
    const other = new UserApiClient(request, otherEnvironment(env));
    const user = buildUser();
    try {
      expectStatus(await api.createUser(user), 201);
      expectStatus(await other.createUser(user), 201);
      expectStatus(
        await api.updateUser(user.email, { ...user, name: 'Changed Here', age: 77 }),
        200,
      );

      const there = await other.getUser(user.email);
      expect(there.body, explain(there)).toEqual(user);
    } finally {
      await api.deleteUser(user.email).catch(() => undefined);
      await other.deleteUser(user.email).catch(() => undefined);
    }
  });

  test('deleting a user here does not delete the same email in the other environment', async ({
    api,
    request,
    env,
  }) => {
    const other = new UserApiClient(request, otherEnvironment(env));
    const user = buildUser();
    try {
      expectStatus(await api.createUser(user), 201);
      expectStatus(await other.createUser(user), 201);
      expectStatus(await api.deleteUser(user.email), 204);

      expectStatus(await other.getUser(user.email), 200);
    } finally {
      await api.deleteUser(user.email).catch(() => undefined);
      await other.deleteUser(user.email).catch(() => undefined);
    }
  });

  test('an unknown environment prefix is not served', async ({ api }) => {
    const res = await api.rawGet('/staging/users');
    expect([400, 404], explain(res)).toContain(res.status);
  });
});
