import { test, expect } from '../src/fixtures';
import { expectStatus, explain } from '../src/support/assertions';

test.describe('GET /{env}/users', () => {
  test('returns 200 and a JSON array', async ({ api }) => {
    const res = await api.listUsers();
    expectStatus(res, 200);
    expect(Array.isArray(res.body), explain(res)).toBe(true);
  });

  test('includes a newly created user', async ({ api, seedUser }) => {
    const user = await seedUser();
    const res = await api.listUsers();
    expectStatus(res, 200);
    expect(res.body, explain(res)).toContainEqual(user);
  });

  test('does not include a deleted user', async ({ api, seedUser }) => {
    const user = await seedUser();
    expectStatus(await api.deleteUser(user.email), 204);

    const res = await api.listUsers();
    expectStatus(res, 200);
    const emails = (res.body ?? []).map((u) => u.email);
    expect(emails, explain(res)).not.toContain(user.email);
  });

  test('reflects updates made via PUT', async ({ api, seedUser }) => {
    const user = await seedUser();
    const updated = { ...user, name: 'Renamed User', age: 41 };
    expectStatus(await api.updateUser(user.email, updated), 200);

    const res = await api.listUsers();
    expect(res.body, explain(res)).toContainEqual(updated);
  });

  test('does not require authentication', async ({ api }) => {
    // The client sends no Authentication header on GET requests.
    expectStatus(await api.listUsers(), 200);
  });
});
