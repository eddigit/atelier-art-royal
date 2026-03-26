import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';

/**
 * TEMPORARY endpoint to initialize admin accounts after Base44 migration.
 *
 * GET  /api/admin-reset/ArtRoyal-Init-2026 → auto-creates super admin + lists users
 * POST /api/admin-reset/ArtRoyal-Init-2026 → set passwords for any accounts
 *
 * ⚠️  DELETE THIS FILE AFTER SETUP IS COMPLETE
 */

const RESET_TOKEN = 'ArtRoyal-Init-2026';

// Pre-hashed: $$Reussite888!!
const SUPER_ADMIN_HASH = '$2b$10$jLorHD/OwjUhXCxuLYCsheTMqLkrOK4ezYw7qQBQVUxA6qqd8kJ2i';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function ensureSuperAdmin() {
  const email = 'gilleskorzec@gmail.com';
  const existing = await query('SELECT id, email, full_name, role, (password_hash IS NOT NULL AND password_hash != \'\') as has_password FROM users WHERE email = $1', [email]);

  if (existing.rows.length === 0) {
    // Create super admin
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, 'admin', NOW(), NOW())
       RETURNING id, email, full_name, role`,
      [email, SUPER_ADMIN_HASH, 'Gilles Korzec']
    );
    return { status: 'created', user: result.rows[0] };
  }

  const user = existing.rows[0];
  if (!user.has_password) {
    // Set password for existing user
    await query('UPDATE users SET password_hash = $1, role = $2, updated_at = NOW() WHERE email = $3',
      [SUPER_ADMIN_HASH, 'admin', email]);
    return { status: 'password_set', user: { ...user, role: 'admin' } };
  }

  // Already has password — update it anyway
  await query('UPDATE users SET password_hash = $1, role = $2, updated_at = NOW() WHERE email = $3',
    [SUPER_ADMIN_HASH, 'admin', email]);
  return { status: 'password_updated', user: { ...user, role: 'admin' } };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { token } = req.query;
  if (token !== RESET_TOKEN) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  try {
    if (req.method === 'GET') {
      // Auto-init super admin
      const adminResult = await ensureSuperAdmin();

      // List all users
      const result = await query(
        `SELECT id, email, full_name, role,
                (password_hash IS NOT NULL AND password_hash != '') as has_password,
                created_at
         FROM users
         ORDER BY role DESC, created_at ASC`
      );

      return res.status(200).json({
        super_admin: adminResult,
        login_info: {
          url: '/Login',
          email: 'gilleskorzec@gmail.com',
          note: 'Use the password you configured'
        },
        total_users: result.rows.length,
        users: result.rows
      });
    }

    if (req.method === 'POST') {
      const { accounts } = req.body;
      if (!accounts || !Array.isArray(accounts)) {
        return res.status(400).json({
          error: 'Body: { "accounts": [{ "email": "...", "password": "..." }] }'
        });
      }

      const results = [];
      for (const { email, password } of accounts) {
        if (!email || !password || password.length < 6) {
          results.push({ email: email || '?', status: 'error', message: 'Invalid email or password (min 6 chars)' });
          continue;
        }

        const existing = await query('SELECT id, full_name, role FROM users WHERE email = $1', [email.toLowerCase()]);
        const password_hash = await bcrypt.hash(password, 10);

        if (existing.rows.length === 0) {
          await query(
            `INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
             VALUES ($1, $2, $3, 'user', NOW(), NOW())`,
            [email.toLowerCase(), password_hash, email.split('@')[0]]
          );
          results.push({ email, status: 'created' });
        } else {
          await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
            [password_hash, email.toLowerCase()]);
          results.push({ email, status: 'password_updated', role: existing.rows[0].role });
        }
      }

      return res.status(200).json({ results });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin reset error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
