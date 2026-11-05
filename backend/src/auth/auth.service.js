/**
 * auth.service.js
 * User authentication, session issuance, and identity verification.
 */

const { getDb } = require('../data/mockDb');

class AuthService {
  /**
   * Authenticate user with email and simulated password verification
   * Returns user context with tenant metadata and session token
   */
  static login(email, password = 'password123') {
    if (!email || typeof email !== 'string') {
      throw { status: 400, message: 'Bad Request: email is required' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw { status: 401, message: 'Invalid credentials: user not found' };
    }

    // Simple password verification for prototype / demo
    if (password !== 'password123' && password !== 'secret' && password.length < 4) {
      throw { status: 401, message: 'Invalid credentials: incorrect password' };
    }

    // Verify organization membership
    const membership = db.memberships.find(m => m.userId === user.id && m.orgId === user.orgId);
    const org = db.organizations.find(o => o.id === user.orgId);

    const token = `token_${user.id}_${Date.now()}`;

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: membership ? membership.role : user.role,
        orgId: user.orgId,
        orgName: org ? org.name : 'Unknown Organization'
      }
    };
  }

  /**
   * Validate token and return authenticated user object
   */
  static verifyToken(token) {
    if (!token || typeof token !== 'string' || !token.startsWith('token_')) {
      throw { status: 401, message: 'Unauthorized: invalid or missing session token' };
    }

    const parts = token.split('_');
    const userId = `${parts[1]}_${parts[2]}_${parts[3]}`.replace(/_[0-9]+$/, ''); // handles 'user_owner_1' etc
    const db = getDb();
    
    // Find matching user by id prefix
    const user = db.users.find(u => token.includes(u.id));
    if (!user) {
      throw { status: 401, message: 'Unauthorized: expired or unknown session token' };
    }

    const org = db.organizations.find(o => o.id === user.orgId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      orgName: org ? org.name : 'Unknown Organization'
    };
  }

  /**
   * Get user profile by ID scoped to caller's organization
   */
  static getUserProfile(userId, requestingUser) {
    if (!requestingUser || !requestingUser.orgId) {
      throw { status: 401, message: 'Unauthorized: authentication required' };
    }

    const db = getDb();
    const targetUser = db.users.find(u => u.id === userId && u.orgId === requestingUser.orgId);

    if (!targetUser) {
      throw { status: 404, message: 'User not found' }; // Mask cross-tenant presence
    }

    return {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      orgId: targetUser.orgId
    };
  }
}

module.exports = AuthService;
