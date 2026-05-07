#!/usr/bin/env node
// Génère public/sitemap.xml depuis l'API ART ROYAL au moment du build Vercel.
// Échec silencieux si l'API n'est pas joignable (build ne casse pas).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITE = 'https://artroyal.fr';
const API = 'https://api-artroyal.mybotia.com';

const STATIC_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/Catalog', priority: '0.9', changefreq: 'daily' },
  { loc: '/Contact', priority: '0.5', changefreq: 'yearly' },
  { loc: '/MentionsLegales', priority: '0.3', changefreq: 'yearly' },
  { loc: '/CGV', priority: '0.3', changefreq: 'yearly' },
  { loc: '/PolitiqueConfidentialite', priority: '0.3', changefreq: 'yearly' },
];

async function fetchJson(path) {
  try {
    const r = await fetch(`${API}${path}`);
    if (!r.ok) return [];
    return await r.json();
  } catch (e) {
    console.warn(`[sitemap] fetch ${path} failed:`, e.message);
    return [];
  }
}

function url({ loc, lastmod, priority = '0.7', changefreq = 'weekly' }) {
  return `  <url>
    <loc>${SITE}${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

(async () => {
  const products = await fetchJson('/api/entities/Product?filter=%7B%22is_active%22%3Atrue%7D&limit=1000');
  const rites = await fetchJson('/api/entities/Rite?limit=100');
  const categories = await fetchJson('/api/entities/Category?limit=100');

  const urls = [
    ...STATIC_PAGES.map(url),
    ...rites.map(r => url({ loc: `/Catalog?rite=${r.id}`, priority: '0.8', changefreq: 'weekly' })),
    ...categories.map(c => url({ loc: `/Catalog?category=${c.id}`, priority: '0.8', changefreq: 'weekly' })),
    ...products.map(p => url({
      loc: `/ProductDetail?id=${p.id}`,
      lastmod: (p.updated_date || p.created_date || '').slice(0, 10) || undefined,
      priority: '0.7',
      changefreq: 'weekly'
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  mkdirSync(resolve(ROOT, 'public'), { recursive: true });
  writeFileSync(resolve(ROOT, 'public/sitemap.xml'), xml);
  console.log(`[sitemap] généré : ${urls.length} URLs (${products.length} produits, ${rites.length} rites, ${categories.length} catégories)`);
})();
