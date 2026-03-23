const { query } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userPayload = requireAuth(req, res);
    if (!userPayload) return; // 401 already sent

    const result = await query(
      'SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = $1',
      [userPayload.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    return res.status(200).json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_date: user.created_at,
      updated_date: user.updated_at,
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
