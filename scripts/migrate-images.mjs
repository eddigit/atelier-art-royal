// =============================================================================
// migrate-images.mjs — Download Base44 images for later upload to VPS
// Usage: node scripts/migrate-images.mjs
// =============================================================================

import { readFileSync, writeFileSync, mkdirSync, existsSync, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import https from 'https';
import http from 'http';

const BACKUP_FILE = new URL('../atelier-art-royal-backup-2026-03-23.json', import.meta.url).pathname;
const ID_MAP_FILE = new URL('./id-mapping.json', import.meta.url).pathname;
const DOWNLOAD_DIR = new URL('./downloaded-images/', import.meta.url).pathname;
const URL_MAPPING_FILE = new URL('./image-url-mapping.json', import.meta.url).pathname;

// ---------------------------------------------------------------------------
// Collect all base44 image URLs from the backup
// ---------------------------------------------------------------------------

function collectImageUrls(data) {
  const urls = new Set();

  function addIfBase44(url) {
    if (url && typeof url === 'string' && url.includes('base44.app')) {
      urls.add(url);
    }
  }

  // Product images
  for (const p of (data.Product || [])) {
    if (Array.isArray(p.images)) {
      p.images.forEach(addIfBase44);
    }
  }

  // Rite image_url
  for (const r of (data.Rite || [])) {
    addIfBase44(r.image_url);
  }

  // Obedience image_url
  for (const o of (data.Obedience || [])) {
    addIfBase44(o.image_url);
  }

  // Category image_url
  for (const c of (data.Category || [])) {
    addIfBase44(c.image_url);
  }

  // ProductionItem design_images
  for (const pi of (data.ProductionItem || [])) {
    if (Array.isArray(pi.design_images)) {
      pi.design_images.forEach(addIfBase44);
    }
  }

  return [...urls];
}

// ---------------------------------------------------------------------------
// Download a single file
// ---------------------------------------------------------------------------

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;

    const request = proto.get(url, { timeout: 30000 }, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }

      const file = createWriteStream(destPath);
      pipeline(response, file).then(resolve).catch(reject);
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

// ---------------------------------------------------------------------------
// Generate a safe filename from a URL
// ---------------------------------------------------------------------------

function urlToFilename(url, index) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];

    // The Base44 filenames are like "261e8f2f2_Patron-produit-aar.jpg"
    // Keep them but prefix with index to guarantee uniqueness
    const safeName = lastPart.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${String(index).padStart(4, '0')}_${safeName}`;
  } catch {
    return `${String(index).padStart(4, '0')}_image`;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Atelier Art Royal — Image Migration ===\n');

  // Load backup
  console.log(`Reading backup: ${BACKUP_FILE}`);
  const backup = JSON.parse(readFileSync(BACKUP_FILE, 'utf-8'));
  const data = backup.data;

  // Load ID map (optional, for reference)
  let idMap = {};
  if (existsSync(ID_MAP_FILE)) {
    idMap = JSON.parse(readFileSync(ID_MAP_FILE, 'utf-8'));
    console.log(`Loaded ID mapping: ${Object.keys(idMap).length} entries`);
  } else {
    console.log('No id-mapping.json found (run import-data.mjs first for full mapping)');
  }

  // Collect URLs
  const urls = collectImageUrls(data);
  console.log(`\nFound ${urls.length} unique base44.app image URLs\n`);

  if (urls.length === 0) {
    console.log('Nothing to download.');
    return;
  }

  // Create download directory
  mkdirSync(DOWNLOAD_DIR, { recursive: true });

  // Download images with concurrency limit
  const CONCURRENCY = 3;
  const urlMapping = {};
  let downloaded = 0;
  let failed = 0;

  async function downloadWithRetry(url, destPath, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await downloadFile(url, destPath);
        return true;
      } catch (err) {
        if (attempt === retries) {
          console.error(`  ✗ Failed: ${url} — ${err.message}`);
          return false;
        }
        // Wait before retry
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    return false;
  }

  // Process in batches for controlled concurrency
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(async (url, batchIdx) => {
        const globalIdx = i + batchIdx;
        const filename = urlToFilename(url, globalIdx);
        const destPath = path.join(DOWNLOAD_DIR, filename);

        // Skip if already downloaded
        if (existsSync(destPath)) {
          urlMapping[url] = filename;
          downloaded++;
          return;
        }

        const success = await downloadWithRetry(url, destPath);
        if (success) {
          urlMapping[url] = filename;
          downloaded++;
          console.log(`  [${downloaded}/${urls.length}] ${filename}`);
        } else {
          failed++;
          urlMapping[url] = null; // mark as failed
        }
      })
    );
  }

  // Save URL mapping
  writeFileSync(URL_MAPPING_FILE, JSON.stringify(urlMapping, null, 2));

  console.log(`\n=== Image migration summary ===`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Failed:     ${failed}`);
  console.log(`  Total URLs: ${urls.length}`);
  console.log(`\n  Images saved to: ${DOWNLOAD_DIR}`);
  console.log(`  URL mapping:     ${URL_MAPPING_FILE}`);
  console.log(`\nNext step: upload images to VPS and update DB URLs.`);
}

main().catch(err => {
  console.error('Image migration failed:', err);
  process.exit(1);
});
