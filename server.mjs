import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { readFile, readdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { Store, publicPaper } from './lib/store.mjs';
import { ZoteroBridge, itemKey } from './lib/zotero.mjs';
import { DemoBridge, DemoProvider } from './lib/demo.mjs';
import { Provider, PROVIDER_PRESETS, baseURL, inferProvider } from './lib/provider.mjs';
import { Harness } from './lib/harness.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
export async function createApp({ demo = false, root, port = 43140 } = {}) {
  root ||= process.env.ZR_DATA_DIR || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.local/share'), 'ZoteroResearch', demo ? 'demo' : 'live');
  const store = new Store(root), bridge = demo ? new DemoBridge() : new ZoteroBridge();
  const defaults = { provider: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: '', apiKey: '' };
  let settings = await store.read('settings.json', defaults);
  settings.provider = PROVIDER_PRESETS[settings.provider] ? settings.provider : inferProvider(settings.baseUrl);
  const harness = new Harness({ store, bridge, provider: demo ? new DemoProvider() : new Provider(settings) });
  const token = randomBytes(24).toString('hex');
  const files = new Map([['/', ['index.html', 'text/html']], ['/app.js',['app.js','text/javascript']], ['/style.css',['style.css','text/css']], ['/library.css',['library.css','text/css']]]);
  // Interrupted jobs remain resumable, never run automatically after a restart.
  for (const name of await readdir(path.join(root, 'papers')).catch(() => [])) {
    if (!/^[A-Z0-9]{8}\.json$/.test(name)) continue;
    const data = await store.paper(name.slice(0,8));
    if (data.job?.status === 'running') { data.job.status = 'paused'; data.job.step = 'Server restarted; resume preparation or retry your question.'; await store.savePaper(data); }
    else if (data.job?.status === 'failed' && /(?:EPERM|EACCES|EBUSY).*rename.*\.tmp/i.test(data.job.step || '')) {
      data.job.status = 'paused';
      data.job.step = 'Recovered from a Windows file lock; resume preparation from the saved checkpoint.';
      await store.savePaper(data);
    }
  }
  const server = http.createServer(async (request, response) => {
    const json = (status, value) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(JSON.stringify(value)); };
    try {
      const actualPort = server.address()?.port || port;
      const host = `127.0.0.1:${actualPort}`;
      if (request.headers.host !== host && request.headers.host !== `localhost:${actualPort}`) return json(403, { error: 'Invalid local host.' });
      if (request.headers['sec-fetch-site'] === 'cross-site') return json(403, { error: 'Cross-site requests are not allowed.' });
      const url = new URL(request.url, `http://${host}`);
      if (request.method === 'GET' && files.has(url.pathname)) {
        const [filename,type] = files.get(url.pathname);
        const body = await readFile(path.join(ROOT, 'public', filename));
        response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" });
        return response.end(body);
      }
      if (url.pathname === '/api/bootstrap' && request.method === 'GET') return json(200, { app: 'zotero-research', token, demo, dataDirectory: root, version: '0.1.0' });
      if (request.headers['x-research-token'] !== token) return json(403, { error: 'Reload this local page to reconnect.' });
      let body = {};
      if (request.method === 'POST') {
        if (!request.headers['content-type']?.startsWith('application/json')) return json(415, { error: 'JSON required.' });
        const chunks = []; let bytes = 0;
        for await (const chunk of request) { bytes += chunk.length; if (bytes > 100000) throw new Error('Request is too large.'); chunks.push(chunk); }
        body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      }
      const route = `${request.method} ${url.pathname}`;
      if (route === 'GET /api/settings') return json(200, { provider: settings.provider, baseUrl: settings.baseUrl, model: settings.model, hasKey: Boolean(settings.apiKey), presets: PROVIDER_PRESETS });
      if (route === 'POST /api/settings') {
        if (demo) throw new Error('Demo mode does not use or save API credentials.');
        if (harness.active.size) throw new Error('Pause active reading tasks before changing providers.');
        const provider = String(body.provider || inferProvider(body.baseUrl));
        if (!PROVIDER_PRESETS[provider]) throw new Error('Choose a supported provider template or Custom.');
        const next = { provider, baseUrl: baseURL(body.baseUrl), model: String(body.model || '').trim().slice(0,200), apiKey: body.clearKey ? '' : String(body.apiKey || settings.apiKey || '') };
        if (!next.model || next.apiKey.length > 2000) throw new Error('Enter a model name and a valid API key.');
        await store.write('settings.json', next); settings = next; harness.provider = new Provider(next);
        return json(200, { saved: true });
      }
      if (route === 'POST /api/connect') return json(200, { tools: await bridge.connect() });
      if (route === 'GET /api/library') return json(200, await bridge.library());
      if (route === 'GET /api/collection') return json(200, await bridge.collection(itemKey(url.searchParams.get('key')), Number(url.searchParams.get('offset') || 0)));
      if (route === 'POST /api/search') {
        if (typeof body.query !== 'string' || !body.query.trim() || body.query.length > 200) throw new Error('Enter a title, author or keyword (up to 200 characters).');
        return json(200, await bridge.search(body.query.trim()));
      }
      if (route === 'GET /api/papers') {
        const list = [];
        for (const name of await readdir(path.join(root, 'papers')).catch(() => [])) if (/^[A-Z0-9]{8}\.json$/.test(name)) { const paper = await store.paper(name.slice(0,8)); list.push({ key: paper.key, title: paper.title }); }
        return json(200, list);
      }
      if (route === 'POST /api/open') return json(200, publicPaper(await harness.load(body.key, Number(body.page || 1))));
      if (route === 'GET /api/paper') return json(200, publicPaper(await store.paper(itemKey(url.searchParams.get('key')))));
      if (route === 'POST /api/run') {
        if (!demo && !settings.apiKey) throw new Error('Configure your API key in Settings first.');
        return json(202, await harness.start(body.key, { question: body.question, page: Number(body.page), prepare: body.prepare === true }));
      }
      if (route === 'POST /api/pause') { harness.cancel(itemKey(body.key)); return json(200, { requested: true }); }
      if (route === 'POST /api/card') {
        await store.exclusive(itemKey(body.key), async () => {
          if (harness.active.has(body.key)) throw new Error('Pause the reading task before editing a card.');
          const data = await store.paper(body.key);
          const card = data.cards.find(c => c.id === body.id);
          if (!card || typeof body.title !== 'string' || typeof body.body !== 'string' || body.body.length > 12000) throw new Error('Invalid card.');
          card.history = [...(card.history || []), { title: card.title, body: card.body, at: Date.now() }].slice(-20);
          card.title = body.title.slice(0,200); card.body = body.body; card.status = 'accepted';
          await store.savePaper(data);
        });
        return json(200, { saved: true });
      }
      json(404, { error: 'Not found.' });
    } catch (error) { json(400, { error: error.message }); }
  });
  return { server, store, harness, bridge, async close() {
    for (const controller of harness.active.values()) controller.abort(new Error('Server shutting down.'));
    await bridge.close(); server.close(); server.closeIdleConnections();
  } };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const demo = process.argv.includes('--demo');
  const port = Number(process.env.ZR_PORT || (demo ? 43141 : 43140));
  const app = await createApp({ demo, port });
  app.server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Open http://127.0.0.1:${port} or set ZR_PORT.` : error.message); process.exitCode = 1; });
  app.server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`; console.log(`Zotero Research ${demo ? '(scripted demo)' : '(API mode)'}: ${url}`);
    if (process.argv.includes('--open') && process.platform === 'win32') spawn('explorer.exe', [url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  });
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal, async () => { await app.close(); });
}
