import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';
import { requireAdmin } from '../lib/auth.js';

/**
 * Admin user management endpoint.
 * All operations require admin JWT.
 *
 * GET    /api/auth/admin-users              → list all users
 * POST   /api/auth/admin-users              → create user
 * PUT    /api/auth/admin-users?id=<uuid>    → update user (role, password, full_name, disabled)
 * DELETE /api/auth/admin-users?id=<uuid>    → disable user
 */

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // All operations require admin
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    // ── GET: List users ──────────────────────────────────────────────
    if (req.method === 'GET') {
      const search = req.query.search || '';
      const role = req.query.role || '';

      let sql = `
        SELECT id, email, full_name, role, disabled,
               (password_hash IS NOT NULL AND password_hash != '') as has_password,
               created_at, updated_at
        FROM users
        WHERE 1=1
      `;
      const params = [];
      let idx = 1;

      if (search) {
        sql += ` AND (email ILIKE $${idx} OR full_name ILIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }
      if (role) {
        sql += ` AND role = $${idx}`;
        params.push(role);
        idx++;
      }

      sql += ' ORDER BY role DESC, created_at ASC';

      const result = await query(sql, params);
      return res.status(200).json(result.rows);
    }

    // ── POST: Create user ────────────────────────────────────────────
    if (req.method === 'POST') {
      const { email, password, full_name, role } = req.body;

      if (!email) return res.status(400).json({ error: 'Email is required' });

      const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà' });
      }

      const password_hash = password ? await bcrypt.hash(password, 10) : null;
      const result = await query(
        `INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, email, full_name, role, disabled, created_at, updated_at`,
        [email.toLowerCase(), password_hash, full_name || null, role || 'user']
      );

      return res.status(201).json(result.rows[0]);
    }

    // ── PUT: Update user ─────────────────────────────────────────────
    if (req.method === 'PUT') {
      const userId = req.query.id;
      if (!userId) return res.status(400).json({ error: 'User id required (?id=...)' });

      const { full_name, email, role, password, disabled } = req.body;
      const fields = [];
      const values = [];
      let idx = 1;

      if (full_name !== undefined) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
      if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email.toLowerCase()); }
      if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }
      if (disabled !== undefined) { fields.push(`disabled = $${idx++}`); values.push(disabled); }
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        fields.push(`password_hash = $${idx++}`);
        values.push(hash);
      }

      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

      fields.push('updated_at = NOW()');
      values.push(userId);

      const result = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
         RETURNING id, email, full_name, role, disabled,
                   (password_hash IS NOT NULL AND password_hash != '') as has_password,
                   created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json(result.rows[0]);
    }

    // ── DELETE: Disable user ─────────────────────────────────────────
    if (req.method === 'DELETE') {
      const userId = req.query.id;
      if (!userId) return res.status(400).json({ error: 'User id required (?id=...)' });

      // Don't allow admins to delete themselves
      if (userId === admin.id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte' });
      }

      const result = await query(
        `UPDATE users SET disabled = true, updated_at = NOW() WHERE id = $1
         RETURNING id, email, full_name, role, disabled`,
        [userId]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
