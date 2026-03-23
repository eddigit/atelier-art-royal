import { query } from '../lib/db.js';
import { authenticateRequest, requireAuth, requireAdmin } from '../lib/auth.js';
import {
  ENTITY_TABLE_MAP,
  PUBLIC_READ_ENTITIES,
  ADMIN_WRITE_ENTITIES,
  mapToDb,
  mapFromDb,
  buildFilterQuery,
} from '../lib/helpers.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Resolve entity → table
    const entityName = req.query.entity;
    const tableName = ENTITY_TABLE_MAP[entityName];

    if (!tableName) {
      return res.status(404).json({ error: `Unknown entity: ${entityName}` });
    }

    const isPublicRead = PUBLIC_READ_ENTITIES.has(tableName);
    const isAdminWrite = ADMIN_WRITE_ENTITIES.has(tableName);

    // -----------------------------------------------------------------------
    // GET - list / filter
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      // Public-read entities don't require auth; others do
      if (!isPublicRead) {
        const user = requireAuth(req, res);
        if (!user) return; // 401 already sent
      }

      let filters = {};
      if (req.query.filter) {
        try {
          filters = JSON.parse(req.query.filter);
        } catch {
          return res.status(400).json({ error: 'Invalid filter JSON' });
        }
      }

      const sort = req.query.sort || '-created_date';
      const limit = req.query.limit || 100;

      const { text, values } = buildFilterQuery(tableName, filters, sort, limit);
      const result = await query(text, values);

      return res.status(200).json(result.rows.map(mapFromDb));
    }

    // -----------------------------------------------------------------------
    // POST - create
    // -----------------------------------------------------------------------
    if (req.method === 'POST') {
      if (isAdminWrite) {
        const user = requireAdmin(req, res);
        if (!user) return;
      } else {
        const user = requireAuth(req, res);
        if (!user) return;
      }

      const body = mapToDb(req.body);
      if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ error: 'Request body is empty' });
      }

      // Remove id if present (auto-generated)
      delete body.id;

      const columns = Object.keys(body);
      const values = Object.values(body);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const colNames = columns.map((c) => `"${c}"`).join(', ');

      const text = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) RETURNING *`;
      const result = await query(text, values);

      return res.status(201).json(mapFromDb(result.rows[0]));
    }

    // -----------------------------------------------------------------------
    // PUT - update
    // -----------------------------------------------------------------------
    if (req.method === 'PUT') {
      if (isAdminWrite) {
        const user = requireAdmin(req, res);
        if (!user) return;
      } else {
        const user = requireAuth(req, res);
        if (!user) return;
      }

      const { id, ...rest } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Missing id in request body' });
      }

      const data = mapToDb(rest);
      const columns = Object.keys(data);
      if (columns.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const setClauses = columns.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
      const values = [...Object.values(data), id];

      const text = `UPDATE "${tableName}" SET ${setClauses}, "updated_at" = NOW() WHERE id = $${values.length} RETURNING *`;
      const result = await query(text, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }

      return res.status(200).json(mapFromDb(result.rows[0]));
    }

    // -----------------------------------------------------------------------
    // DELETE
    // -----------------------------------------------------------------------
    if (req.method === 'DELETE') {
      if (isAdminWrite) {
        const user = requireAdmin(req, res);
        if (!user) return;
      } else {
        const user = requireAuth(req, res);
        if (!user) return;
      }

      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Missing id in request body' });
      }

      const text = `DELETE FROM "${tableName}" WHERE id = $1 RETURNING id`;
      const result = await query(text, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }

      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Entity API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
