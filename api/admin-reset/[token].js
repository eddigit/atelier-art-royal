import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';

/**
 * TEMPORARY endpoint to initialize admin passwords after Base44 migration.
 *
 * Usage:
 *   GET /api/admin-reset/ArtRoyal-Init-2026  → lists users (email + role + has_password)
 *   POST /api/admin-reset/ArtRoyal-Init-2026 → sets passwords for admin accounts
 *     Body: { "accounts": [{ "email": "...", "password": "..." }] }
 *
 * ⚠️  DELETE THIS FILE AFTER USE
 */

const RESET_TOKEN = 'ArtRoyal-Init-2026';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify secret token
  const { token } = req.query;
  if (token !== RESET_TOKEN) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  try {
    if (req.method === 'GET') {
      // List all users with their status
      const result = await query(
        `SELECT id, email, full_name, role,
                (password_hash IS NOT NULL AND password_hash != '') as has_password,
                created_at
         FROM users
         ORDER BY role DESC, created_at ASC`
      );
      return res.status(200).json({
        total: result.rows.length,
        users: result.rows
      });
    }

    if (req.method === 'POST') {
      const { accounts } = req.body;

      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        return res.status(400).json({
          error: 'Body must contain "accounts" array with {email, password} objects',
          example: {
            accounts: [
              { email: 'gilleskorzec@gmail.com', password: 'VotreMotDePasse123' },
              { email: 'contact@artroyal.fr', password: 'AutreMotDePasse456' }
            ]
          }
        });
      }

      const results = [];

      for (const account of accounts) {
        const { email, password } = account;

        if (!email || !password) {
          results.push({ email: email || '?', status: 'error', message: 'Email and password required' });
          continue;
        }

        if (password.length < 6) {
          results.push({ email, status: 'error', message: 'Password must be at least 6 characters' });
          continue;
        }

        // Check if user exists
        const existing = await query('SELECT id, email, full_name, role FROM users WHERE email = $1', [email.toLowerCase()]);

        if (existing.rows.length === 0) {
          // User doesn't exist — create it as admin
          const password_hash = await bcrypt.hash(password, 10);
          const created = await query(
            `INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
             VALUES ($1, $2, $3, 'admin', NOW(), NOW())
             RETURNING id, email, full_name, role`,
            [email.toLowerCase(), password_hash, email.split('@')[0]]
          );
          results.push({
            email,
            status: 'created',
            message: 'New admin account created',
            user: created.rows[0]
          });
        } else {
          // User exists — update password
          const password_hash = await bcrypt.hash(password, 10);
          await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
            [password_hash, email.toLowerCase()]
          );
          results.push({
            email,
            status: 'updated',
            message: `Password set for ${existing.rows[0].full_name || email} (role: ${existing.rows[0].role})`,
            user: existing.rows[0]
          });
        }
      }

      return res.status(200).json({
        message: 'Password reset complete',
        results,
        next_steps: [
          '1. Test login at /Login with each account',
          '2. DELETE the file api/admin-reset/[token].js immediately after verification',
          '3. Commit and push the deletion'
        ]
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin reset error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
