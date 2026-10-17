const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;
const SUBMISSIONS = path.join(ROOT, 'data', 'submissions.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// Form submissions from the site are appended to data/submissions.json
const FIELDS = { link: 500, name: 120, category: 40, level: 40, credit: 120, notes: 1000 };

function reply(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function handleSubmit(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy();
  });
  req.on('end', () => {
    let input;
    try {
      input = JSON.parse(body);
    } catch {
      return reply(res, 400, { ok: false, error: 'Invalid request.' });
    }
    // Spam trap filled in: pretend it worked and drop it
    if (input.website) return reply(res, 200, { ok: true });

    // Keep only the form's fields, trimmed and length-capped
    const entry = {};
    for (const [key, max] of Object.entries(FIELDS)) {
      entry[key] = String(input[key] ?? '').trim().slice(0, max);
    }
    if (!/^https?:\/\/\S+\.\S+/i.test(entry.link)) return reply(res, 400, { ok: false, error: 'Please enter a valid link.' });
    if (!entry.name || !entry.category) return reply(res, 400, { ok: false, error: 'Please fill in the required fields.' });

    fs.mkdirSync(path.dirname(SUBMISSIONS), { recursive: true });
    let all = [];
    try {
      all = JSON.parse(fs.readFileSync(SUBMISSIONS, 'utf8'));
    } catch {}
    all.push({ ...entry, receivedAt: new Date().toISOString() });
    fs.writeFileSync(SUBMISSIONS, JSON.stringify(all, null, 2));
    reply(res, 200, { ok: true });
  });
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath));

  // Block path traversal and private files
  if (!filePath.startsWith(ROOT) || filePath.startsWith(path.join(ROOT, 'data')) || path.relative(ROOT, filePath).startsWith('_') || filePath.endsWith('server.js')) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

    // Byte ranges let browsers (Safari/iOS especially) stream and seek video
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range && (range[1] || range[2])) {
      let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
      let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
      start = Math.max(0, start);
      end = Math.min(end, stat.size - 1);
      if (start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        return res.end();
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
      });
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(filePath).pipe(res);
  });
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/submit') return handleSubmit(req, res);
  if (req.method === 'GET') return serveStatic(req, res);
  res.writeHead(405);
  res.end('Method not allowed');
}).listen(PORT, () => console.log(`Trickopedia running at http://localhost:${PORT}`));
