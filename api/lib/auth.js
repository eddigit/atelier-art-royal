const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Create a signed JWT for a user.
 * @param {{ id: number, email: string, role: string }} user
 * @returns {string} JWT token
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify a JWT and return its payload.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Extract and verify Bearer token from the Authorization header.
 * Returns the user payload or null if missing/invalid.
 * @param {import('http').IncomingMessage} req
 * @returns {object|null}
 */
function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Like authenticateRequest but sends a 401 response if not authenticated.
 * Returns user payload or null (after sending response).
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {object|null}
 */
function requireAuth(req, res) {
  const user = authenticateRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return user;
}

/**
 * Like requireAuth but also checks for admin role.
 * Sends 403 if authenticated but not admin.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {object|null}
 */
function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null; // 401 already sent
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return user;
}

module.exports = {
  signToken,
  verifyToken,
  authenticateRequest,
  requireAuth,
  requireAdmin,
};
