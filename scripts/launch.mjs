import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.ZR_PORT || 43140);
const url = `http://127.0.0.1:${port}`;
let ready = false;
try {
  const response = await fetch(`${url}/api/bootstrap`, { signal: AbortSignal.timeout(1500) });
  const info = await response.json();
  ready = info.app === 'zotero-research' && !info.demo;
} catch {}
if (ready) spawn('explorer.exe', [url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
else spawn(process.execPath, ['server.mjs', '--open'], { cwd: root, detached: true, stdio: 'ignore', windowsHide: true }).unref();
