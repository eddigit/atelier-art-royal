import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';
import { signToken, requireAuth } from '../lib/auth.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signToken(user);
  return res.status(200).json({
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, created_date: user.created_at, updated_date: user.updated_at },
  });
}

async function handleRegister(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });

  const password_hash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, full_name, role, created_at, updated_at`,
    [email.toLowerCase(), password_hash, full_name || null, 'user']
  );

  const user = result.rows[0];
  const token = signToken(user);
  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, created_date: user.created_at, updated_date: user.updated_at },
  });
}

async function handleMe(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userPayload = requireAuth(req, res);
  if (!userPayload) return;

  const result = await query('SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = $1', [userPayload.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

  const user = result.rows[0];
  return res.status(200).json({
    id: user.id, email: user.email, full_name: user.full_name, role: user.role,
    created_date: user.created_at, updated_date: user.updated_at,
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const action = req.query.action;
    switch (action) {
      case 'login': return await handleLogin(req, res);
      case 'register': return await handleRegister(req, res);
      case 'me': return await handleMe(req, res);
      default: return res.status(404).json({ error: `Unknown auth action: ${action}` });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
