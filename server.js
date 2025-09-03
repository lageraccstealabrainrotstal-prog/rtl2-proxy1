// server.js
// Simple Express server for Render.com
// - Serves static files from repo root (index.html)
// - Provides /api/rtl2/lookup proxy (POST with URL params forwarded)
// - Uses native fetch (Node 18+) and AbortController for timeouts

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET = 'https://whut.dev/api/rtl2/lookup';

app.disable('x-powered-by');

// Serve static files (index.html at root)
app.use(express.static(path.join(__dirname)));

// Proxy route to avoid CORS issues: accepts POST and forwards query params
app.post('/api/rtl2/lookup', async (req, res) => {
  try {
    // Build target URL using original query string
    const originalQs = req.originalUrl.split('?')[1] || '';
    const url = `${TARGET}${originalQs ? '?' + originalQs : ''}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        // forward client headers if needed (careful with auth)
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    // forward status and body
    const text = await response.text();
    res.status(response.status);
    // Try to set JSON content type if possible
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) res.type('application/json');
    res.send(text);
  } catch (err) {
    console.error('Proxy error', err && err.stack ? err.stack : err);
    if (err.name === 'AbortError') return res.status(504).json({ success: false, error: 'timeout' });
    res.status(502).json({ success: false, error: String(err) });
  }
});

// Fallback: for any other route serve index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

