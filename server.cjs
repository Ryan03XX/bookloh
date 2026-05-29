'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT) || 8080;

const cleanRoutes = new Map([
  ['/home', 'main/index-8.html'],
  ['/about', 'main/page-about.html'],
  ['/features', 'main/page-features.html'],
  ['/pricing', 'main/page-pricing.html'],
  ['/contact', 'main/page-contact.html'],
  ['/page-privacy.html', 'main/page-privacy.html'],
  ['/page-terms.html', 'main/page-terms.html'],
]);

const legacyRoutes = new Map([
  ['/index-8.html', '/home'],
  ['/main/index-8.html', '/home'],
  ['/page-about.html', '/about'],
  ['/main/page-about.html', '/about'],
  ['/page-features.html', '/features'],
  ['/main/page-features.html', '/features'],
  ['/page-pricing.html', '/pricing'],
  ['/main/page-pricing.html', '/pricing'],
  ['/page-contact.html', '/contact'],
  ['/main/page-contact.html', '/contact'],
  ['/main/page-privacy.html', '/page-privacy.html'],
  ['/main/page-terms.html', '/page-terms.html'],
]);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const rangeFriendlyExt = new Set(['.mp4', '.webm', '.mp3', '.ogg', '.wav']);

/**
 * Parse a single "bytes=..." Range header. Returns { start, end } inclusive, or null.
 */
function parseRange(rangeHeader, size) {
  if (!rangeHeader || !/^bytes=/i.test(rangeHeader)) return null;
  const inner = rangeHeader.slice(rangeHeader.indexOf('=') + 1).trim();
  const first = inner.split(',')[0].trim();
  const m = /^(\d*)-(\d*)$/.exec(first);
  if (!m) return null;
  const lo = m[1];
  const hi = m[2];
  if (lo === '' && hi === '') return null;

  if (lo === '' && hi !== '') {
    const suffixLen = parseInt(hi, 10);
    if (!Number.isFinite(suffixLen) || suffixLen <= 0) return null;
    const start = Math.max(0, size - suffixLen);
    return { start, end: size - 1 };
  }

  const start = parseInt(lo, 10);
  if (!Number.isFinite(start) || start < 0 || start >= size) return null;

  let end = hi === '' ? size - 1 : parseInt(hi, 10);
  if (!Number.isFinite(end) || end < start) return null;
  end = Math.min(end, size - 1);
  return { start, end };
}

function resolveUnderDist(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const pathname = decoded;
  const relative = pathname.replace(/^\/+/, '');
  if (relative === '') {
    return null;
  }
  const candidate = path.resolve(distDir, relative);
  const relToDist = path.relative(distDir, candidate);
  if (relToDist.startsWith('..') || path.isAbsolute(relToDist)) {
    return null;
  }
  return candidate;
}

function send(res, status, body, type) {
  res.statusCode = status;
  if (type) res.setHeader('Content-Type', type);
  res.end(body);
}

function pipeStream(res, stream) {
  stream.on('error', () => {
    if (!res.writableEnded) {
      try {
        res.destroy();
      } catch (_) {
        /* ignore */
      }
    }
  });
  res.on('close', () => {
    stream.destroy();
  });
  stream.pipe(res);
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} filePath
 * @param {import('fs').Stats} st
 */
function respondWithFile(req, res, filePath, st) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || 'application/octet-stream';
  const allowRanges = rangeFriendlyExt.has(ext);

  if (req.method === 'HEAD') {
    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Length', String(st.size));
    if (allowRanges) res.setHeader('Accept-Ranges', 'bytes');
    return res.end();
  }

  const rangeHeader = allowRanges ? req.headers.range : undefined;

  if (rangeHeader) {
    const parsed = parseRange(rangeHeader, st.size);
    if (!parsed) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${st.size}`);
      return res.end();
    }
    const { start, end } = parsed;
    const chunkLen = end - start + 1;
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', String(chunkLen));
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const stream = fs.createReadStream(filePath, { start, end });
    return pipeStream(res, stream);
  }

  if (allowRanges) {
    res.statusCode = 200;
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', String(st.size));
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const stream = fs.createReadStream(filePath);
    return pipeStream(res, stream);
  }

  fs.readFile(filePath, (readErr, data) => {
    if (readErr) {
      return send(res, 500, 'Server Error', 'text/plain; charset=utf-8');
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Length', String(data.length));
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed', 'text/plain; charset=utf-8');
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  // Redirect / to the public home URL.
  if (url.pathname === '/' || url.pathname === '') {
    res.statusCode = 302;
    res.setHeader('Location', `/home${url.search}`);
    return res.end();
  }

  const normalizedPath = url.pathname.toLowerCase();
  const legacyTarget = legacyRoutes.get(normalizedPath);
  if (legacyTarget) {
    res.statusCode = 302;
    res.setHeader('Location', `${legacyTarget}${url.search}`);
    return res.end();
  }

  const cleanRouteFile = cleanRoutes.get(normalizedPath);
  const filePath = cleanRouteFile ? path.join(distDir, cleanRouteFile) : resolveUnderDist(url.pathname);
  if (!filePath) {
    return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  }

  fs.stat(filePath, (err, st) => {
    if (err) {
      return send(res, 404, 'Not Found', 'text/plain; charset=utf-8');
    }
    if (st.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      return fs.stat(indexPath, (err2, st2) => {
        if (err2) {
          return send(res, 404, 'Not Found', 'text/plain; charset=utf-8');
        }
        respondWithFile(req, res, indexPath, st2);
      });
    }
    respondWithFile(req, res, filePath, st);
  });
});

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Static server listening on 0.0.0.0:${port}`);
});
