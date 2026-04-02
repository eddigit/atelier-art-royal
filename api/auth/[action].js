import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../lib/db.js';
import { signToken, verifyToken, requireAuth } from '../lib/auth.js';
import { sendEmail } from '../lib/ses.js';
import { emailLayout, goldButton, SITE_URL } from '../lib/emailTemplate.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
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

  // Send welcome email (fire & forget)
  sendEmail({
    to: user.email,
    subject: 'Bienvenue chez Atelier Art Royal — Haute Couture Maçonnique',
    bodyHtml: emailLayout({
      title: 'Bienvenue !',
      body: `
        <p>Bonjour${user.full_name ? ' <strong>' + user.full_name + '</strong>' : ''}, </p>
        <p>Nous sommes ravis de vous accueillir parmi les membres de l'Atelier Art Royal.</p>
        <p>Vous avez désormais accès à :</p>
        <ul style="padding-left:20px;color:#555">
          <li>Notre collection exclusive d'articles maçonniques</li>
          <li>Le suivi de vos commandes en temps réel</li>
          <li>Des créations sur-mesure personnalisées</li>
          <li>Votre liste de souhaits et vos créations sauvegardées</li>
        </ul>
        ${goldButton(SITE_URL + '/Catalog', 'Découvrir la Boutique')}
        <p style="color:#666;font-size:13px">Si vous avez la moindre question, n'hésitez pas à nous contacter à <a href="mailto:contact@artroyal.fr" style="color:#c9a84c">contact@artroyal.fr</a> ou au <strong>+33 6 46 68 36 10</strong>.</p>
        <p style="color:#666;font-size:13px">À très bientôt,<br><strong>L'équipe Atelier Art Royal</strong></p>
      `
    }),
    bodyText: `Bienvenue chez Atelier Art Royal ! Découvrez notre boutique : ${SITE_URL}/Catalog`,
  }).catch(err => console.error('Welcome email error:', err));

  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, created_date: user.created_at, updated_date: user.updated_at },
  });
}

async function handleMe(req, res) {
  if (req.method === 'GET') {
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

  if (req.method === 'PUT') {
    const userPayload = requireAuth(req, res);
    if (!userPayload) return;

    const { full_name, email } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (full_name !== undefined) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email.toLowerCase()); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    fields.push(`updated_at = NOW()`);
    values.push(userPayload.id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, full_name, role, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = result.rows[0];
    return res.status(200).json({
      id: user.id, email: user.email, full_name: user.full_name, role: user.role,
      created_date: user.created_at, updated_date: user.updated_at,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleForgotPassword(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const result = await query('SELECT id, email, full_name FROM users WHERE email = $1', [email.toLowerCase()]);
  // Always return success to avoid leaking whether an email exists
  if (result.rows.length === 0) {
    return res.status(200).json({ success: true, message: 'If this email exists, a reset link has been sent.' });
  }

  const user = result.rows[0];
  const JWT_SECRET = process.env.JWT_SECRET;
  const resetToken = jwt.sign({ id: user.id, email: user.email, purpose: 'reset-password' }, JWT_SECRET, { expiresIn: '1h' });

  const resetUrl = `${SITE_URL}/ResetPassword?token=${encodeURIComponent(resetToken)}`;

  await sendEmail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe — Atelier Art Royal',
    bodyHtml: emailLayout({
      title: 'Réinitialisation du mot de passe',
      body: `
        <p>Bonjour${user.full_name ? ' <strong>' + user.full_name + '</strong>' : ''},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        ${goldButton(resetUrl, 'Réinitialiser mon mot de passe')}
        <p style="color:#666;font-size:13px">Ce lien expire dans <strong>1 heure</strong>.</p>
        <p style="color:#666;font-size:13px">Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
        <p style="color:#999;font-size:12px;margin-top:20px">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${resetUrl}" style="color:#c9a84c;word-break:break-all">${resetUrl}</a></p>
      `
    }),
    bodyText: `Réinitialisez votre mot de passe Atelier Art Royal : ${resetUrl}`,
  });

  return res.status(200).json({ success: true, message: 'If this email exists, a reset link has been sent.' });
}

async function handleResetPassword(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  if (decoded.purpose !== 'reset-password') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const result = await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email',
    [password_hash, decoded.id]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

  return res.status(200).json({ success: true, message: 'Password updated successfully' });
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
      case 'forgot-password': return await handleForgotPassword(req, res);
      case 'reset-password': return await handleResetPassword(req, res);
      default: return res.status(404).json({ error: `Unknown auth action: ${action}` });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
