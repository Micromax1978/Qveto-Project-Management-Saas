const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { getDb, resetDb } = require('../../backend/src/data/mockDb');

describe('Week 1 - Authentication & User Sessions', () => {
  beforeEach(() => {
    resetDb();
  });

  test('TC-AUTH-01: Valid user lookup and authentication payload', () => {
    const db = getDb();
    const user = db.users.find(u => u.email === 'alice@acme.com');
    assert.ok(user, 'User Alice should exist');
    assert.strictEqual(user.role, 'OWNER');
    assert.strictEqual(user.orgId, 'org_acme_corp');
  });

  test('TC-AUTH-02: Multi-tenant membership lookup', () => {
    const db = getDb();
    const aliceMembership = db.memberships.find(m => m.userId === 'user_owner_1' && m.orgId === 'org_acme_corp');
    assert.ok(aliceMembership, 'Alice must have an active membership in Acme Corp');
    assert.strictEqual(aliceMembership.role, 'OWNER');

    const externalUser = db.users.find(u => u.email === 'eve@beta.com');
    assert.strictEqual(externalUser.orgId, 'org_beta_tech');
  });
});
