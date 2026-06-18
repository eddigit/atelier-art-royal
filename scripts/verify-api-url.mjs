import assert from 'node:assert/strict';

import { resolveApiUrl } from '../src/api/apiUrl.js';

assert.equal(
  resolveApiUrl('https://api-artroyal.mybotia.com', 'artroyal.fr'),
  '',
  'production domain must use same-origin API routes'
);

assert.equal(
  resolveApiUrl('https://api-artroyal.mybotia.com', 'www.artroyal.fr'),
  '',
  'www production domain must use same-origin API routes'
);

assert.equal(
  resolveApiUrl('https://api-artroyal.mybotia.com', 'atelier-art-royal.vercel.app'),
  '',
  'Vercel production alias must use same-origin API routes'
);

assert.equal(
  resolveApiUrl('https://api-artroyal.mybotia.com', 'atelier-art-royal-grr5ah2k7-gilles-korzec-projects.vercel.app'),
  '',
  'Vercel deployment URLs must use same-origin API routes'
);

assert.equal(
  resolveApiUrl('http://localhost:3001', 'localhost'),
  'http://localhost:3001',
  'local development may use an external API server'
);

console.log('API URL resolution checks passed');
