import { test, expect } from '../src/fixtures';
import { AUTH_TOKEN } from '../src/config/env';
import { missingEmail } from '../src/data/user.factory';
import { expectError, expectStatus, explain } from '../src/support/assertions';

test.describe('DELETE /{env}/users/{email}', () => {
  test.describe('happy path', () => {
    test('deletes a user with a valid token and returns 204 without body', async ({
      api,
      seedUser,
    }) => {
      const user = await seedUser();
      const res = await api.deleteUser(user.email);
      expectStatus(res, 204);
      expect(res.text, explain(res)).toBe('');
    });

    test('the user is no longer retrievable afterwards', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectStatus(await api.deleteUser(user.email), 204);
      expectError(await api.getUser(user.email), 404);
    });

    test('deleting twice returns 404 the second time', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectStatus(await api.deleteUser(user.email), 204);
      expectError(await api.deleteUser(user.email), 404);
    });

    test('only the targeted user is removed', async ({ api, seedUser }) => {
      const target = await seedUser();
      const bystander = await seedUser();
      expectStatus(await api.deleteUser(target.email), 204);
      expectStatus(await api.getUser(bystander.email), 200);
    });
  });

  test.describe('authentication (401)', { tag: '@auth' }, () => {
    test('rejects a request without the Authentication header', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectError(await api.deleteUser(user.email, { token: null }), 401);
    });

    test('rejects an invalid token', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectError(await api.deleteUser(user.email, { token: 'wrongtoken' }), 401);
    });

    test('rejects an empty token', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectError(await api.deleteUser(user.email, { token: '' }), 401);
    });

    test('rejects a token with different casing', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectError(await api.deleteUser(user.email, { token: AUTH_TOKEN.toUpperCase() }), 401);
    });

    test('rejects a valid token sent in the wrong header (Authorization)', async ({
      api,
      seedUser,
    }) => {
      // The spec names the header "Authentication", not "Authorization".
      const user = await seedUser();
      const res = await api.deleteUser(user.email, { headerName: 'Authorization' });
      expectError(res, 401);
    });

    test('a rejected request does not delete the user', async ({ api, seedUser }) => {
      const user = await seedUser();
      await api.deleteUser(user.email, { token: 'wrongtoken' });
      await api.deleteUser(user.email, { token: null });

      const res = await api.getUser(user.email);
      expectStatus(res, 200);
      expect(res.body, explain(res)).toEqual(user);
    });
  });

  test.describe('not found (404)', () => {
    test('returns 404 for an unknown email with a valid token', async ({ api }) => {
      expectError(await api.deleteUser(missingEmail()), 404);
    });
  });
});
