/**
 * server.js — Portfolio Static File Server
 *
 * Implements the backend requirements from ARCHITECTURE.md:
 *  - Section 4.2  : Cache-Control policy per asset type
 *  - Section 6    : Security headers (CSP, HSTS, X-Frame-Options, etc.)
 *  - Section 8    : Startup validation — resume PDF must exist and be non-empty
 *
 * Zero external dependencies. Runs with: node server.js
 */

'use strict';

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const zlib  = require('zlib');
const crypto = require('crypto');

// ─── Configuration ────────────────────────────────────────────────────────────

const PORT        = process.env.PORT || 3000;
const ROOT        = __dirname;
const RESUME_PATH = path.join(ROOT, 'resume.pdf');

// MIME type registry
const MIME = {
  '.html' : 'text/html; charset=utf-8',
  '.css'  : 'text/css; charset=utf-8',
  '.js'   : 'text/javascript; charset=utf-8',
  '.json' : 'application/json; charset=utf-8',
  '.jpg'  : 'image/jpeg',
  '.jpeg' : 'image/jpeg',
  '.png'  : 'image/png',
  '.gif'  : 'image/gif',
  '.webp' : 'image/webp',
  '.svg'  : 'image/svg+xml',
  '.pdf'  : 'application/pdf',
  '.ico'  : 'image/x-icon',
  '.woff' : 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf'  : 'font/ttf',
};

// ─── Startup Validation (FMEA — Resume PDF) ───────────────────────────────────

function validateResumeAsset() {
  try {
    const stat = fs.statSync(RESUME_PATH);
    if (stat.size === 0) {
      console.error('[startup] FATAL: resume.pdf exists but is zero bytes. Fix before serving.');
      process.exit(1);
    }
    console.log(`[startup] resume.pdf OK (${(stat.size / 1024).toFixed(1)} KB)`);
  } catch {
    // Resume not present — non-fatal warning (PRD AF-1.1: show toast on client side)
    console.warn('[startup] WARNING: resume.pdf not found. Recruiters will see the fallback message.');
  }
}

// ─── Security Headers (ARCHITECTURE.md Section 6) ────────────────────────────

/**
 * Returns the full set of security response headers.
 * Applied to every response regardless of asset type.
 */
function securityHeaders() {
  return {
    // Content Security Policy — strict, hardened zero-trust policy
    'Content-Security-Policy':
      "default-src 'self'; " +
      "img-src 'self' data: https:; " +
      "script-src 'self'; " +   // Strictly 'self' — external script only, zero unsafe-inline
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "connect-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "frame-ancestors 'none';",

    // HTTP Strict Transport Security (HSTS) — 2 years, include sub-domains
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME-type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Referrer policy — keep referrer info within origin only
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Modern XSS protection header override
    'X-XSS-Protection': '0',

    // Isolation policies
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',

    // Permissions policy — disable unused sensitive browser capabilities
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  };
}

// ─── Cache-Control Policy (ARCHITECTURE.md Section 4.2) ──────────────────────

/**
 * Returns the Cache-Control header value based on file type.
 *
 *   HTML  → must-revalidate (instant invalidation on deploy)
 *   PDF   → 1-hour TTL with stale-while-revalidate
 *   JSON  → 5-minute TTL (data files; allows updates without hard reload)
 *   JS/CSS/images → 1 year immutable (content-addressed in production)
 */
function cacheHeader(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.html') {
    return 'public, max-age=0, must-revalidate';
  }
  if (ext === '.pdf') {
    return 'public, max-age=3600, stale-while-revalidate=86400';
  }
  if (ext === '.json') {
    // Data files update when content changes — short TTL so browsers pick up edits
    return 'public, max-age=300, stale-while-revalidate=3600';
  }
  // JS, CSS, fonts, images — treat as immutable in dev too for parity
  return 'public, max-age=31536000, immutable';
}

// ─── Path Sanitisation ────────────────────────────────────────────────────────

/**
 * Resolves the requested URL path to an absolute filesystem path,
 * and rejects any attempt to escape the root directory (path traversal).
 *
 * Returns null if the path is outside ROOT.
 */
function resolveSafePath(reqUrl) {
  // Prevent null-byte injection
  if (reqUrl.includes('\0') || reqUrl.includes('%00')) {
    return null;
  }

  // Strip query string and hash
  const urlPath = reqUrl.split('?')[0].split('#')[0];

  // Decode and normalise
  let rel;
  try {
    rel = decodeURIComponent(urlPath);
  } catch {
    return null; // malformed percent-encoding
  }

  const resolved = path.normalize(path.join(ROOT, rel));

  // Ensure the resolved path is inside ROOT (path traversal guard)
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
    return null;
  }

  return resolved;
}

// ─── 404 Response ─────────────────────────────────────────────────────────────

function send404(res) {
  const body = JSON.stringify({ error: 'Not Found', status: 404 });
  res.writeHead(404, {
    'Content-Type'  : 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...securityHeaders(),
  });
  res.end(body);
}

// ─── Request Handler ──────────────────────────────────────────────────────────

const COMPRESSIBLE_EXTENSIONS = new Set([
  '.html', '.css', '.js', '.json', '.svg', '.txt'
]);

function handleRequest(req, res) {
  // Only allow GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', ...securityHeaders() });
    res.end();
    return;
  }

  // Resolve URL → filesystem path
  let filePath = resolveSafePath(req.url);
  if (!filePath) {
    send404(res);
    return;
  }

  // Directory → serve index.html
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch {
    send404(res);
    return;
  }

  // Read and serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send404(res);
      return;
    }

    const ext         = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const cacheCtl    = cacheHeader(filePath);

    // ETag calculation for HTTP 304 conditional validation
    const etag = `"${crypto.createHash('md5').update(data).digest('hex')}"`;

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, {
        'ETag': etag,
        'Cache-Control': cacheCtl,
        ...securityHeaders(),
      });
      res.end();
      return;
    }

    const headers = {
      'Content-Type'  : contentType,
      'Cache-Control' : cacheCtl,
      'ETag'          : etag,
      'Vary'          : 'Accept-Encoding',
      ...securityHeaders(),
    };

    // For PDF — add Content-Disposition so browsers offer "Save As" with the right filename
    if (ext === '.pdf') {
      const downloadName = path.basename(filePath);
      headers['Content-Disposition'] = `inline; filename="${downloadName}"`;
    }

    // Compression negotiation for text assets
    const acceptEncoding = req.headers['accept-encoding'] || '';
    let responsePayload = data;

    if (COMPRESSIBLE_EXTENSIONS.has(ext)) {
      if (acceptEncoding.includes('gzip')) {
        headers['Content-Encoding'] = 'gzip';
        responsePayload = zlib.gzipSync(data);
      } else if (acceptEncoding.includes('deflate')) {
        headers['Content-Encoding'] = 'deflate';
        responsePayload = zlib.deflateSync(data);
      }
    }

    headers['Content-Length'] = responsePayload.length;

    res.writeHead(200, headers);
    // HEAD requests: send headers only
    res.end(req.method === 'HEAD' ? undefined : responsePayload);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

validateResumeAsset();

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`[server] Portfolio running at http://localhost:${PORT}/`);
  console.log(`[server] Serving files from: ${ROOT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received — shutting down gracefully.');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('[server] SIGINT received — shutting down gracefully.');
  server.close(() => process.exit(0));
});
