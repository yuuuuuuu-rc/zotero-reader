import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ALLOWED = new Set(['zotero_search_items', 'zotero_get_item_metadata', 'zotero_read_pdf_pages']);
export function itemKey(value) {
  if (typeof value !== 'string' || !/^[A-Z0-9]{8}$/.test(value)) throw new Error('Use an eight-character Zotero item key.');
  return value;
}
export class ZoteroBridge {
  async connect() {
    if (!this.pending) this.pending = this.open().catch(error => { this.pending = null; throw error; });
    return this.pending;
  }
  async open() {
    const command = process.env.ZR_MCP_COMMAND || path.join(ROOT, '.venv', process.platform === 'win32' ? 'Scripts/zotero-mcp.exe' : 'bin/zotero-mcp');
    // Deliberately do not inherit Zotero cloud credentials or API provider keys.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SYSTEMROOT|WINDIR|APPDATA|LOCALAPPDATA|USERPROFILE|HOME|TEMP|TMP|LANG)$/i.test(key)));
    Object.assign(env, { ZOTERO_LOCAL: 'true', ZOTERO_LOCAL_WRITE: 'false', PYTHONIOENCODING: 'utf-8', ZOTERO_MCP_TOOLSETS: 'none' });
    if (process.env.ZR_ZOTERO_DB_PATH) env.ZOTERO_DB_PATH = process.env.ZR_ZOTERO_DB_PATH;
    this.transport = new StdioClientTransport({ command, args: ['serve', '--transport', 'stdio'], env, stderr: 'pipe' });
    this.transport.stderr?.on('data', () => {}); // Drain diagnostics without exposing library paths.
    this.client = new Client({ name: 'zotero-research-companion', version: '0.1.0' });
    try {
      await this.client.connect(this.transport, { timeout: 30000 });
      const { tools } = await this.client.listTools();
      this.names = tools.map(tool => tool.name);
      for (const name of ALLOWED) if (!this.names.includes(name)) throw new Error(`Upstream tool is unavailable: ${name}`);
      return this.names.filter(name => ALLOWED.has(name));
    } catch (error) { await this.client.close().catch(() => {}); throw error; }
  }
  async call(name, args) {
    if (!ALLOWED.has(name)) throw new Error('This prototype only permits selected read tools.');
    await this.connect();
    const result = await this.client.callTool({ name, arguments: args }, undefined, { timeout: 60000 });
    const text = (result.content || []).filter(block => block.type === 'text').map(block => block.text).join('\n');
    if (result.isError || /^(Error[: ]|No item found|No PDF attachment|Could not read)/i.test(text.trim())) throw new Error(text.slice(0,500));
    return text;
  }
  search(query) { return this.call('zotero_search_items', { query, limit: 12, qmode: 'titleCreatorYear' }); }
  async metadata(key) {
    const item = JSON.parse(await this.call('zotero_get_item_metadata', { item_key: itemKey(key), format: 'json' }));
    const data = item.data || item;
    return { key, title: data.title || key, abstract: data.abstractNote || '', type: data.itemType, date: data.date || '' };
  }
  async page(key, number) {
    if (!Number.isInteger(number) || number < 1 || number > 10000) throw new Error('Invalid page number.');
    const raw = await this.call('zotero_read_pdf_pages', { item_key: itemKey(key), start_page: number, end_page: number, format: 'text' });
    const match = raw.match(new RegExp(`## Page ${number}\\s*\\n([\\s\\S]*)`));
    if (!match) throw new Error('Upstream returned no page text.');
    return { page: number, text: match[1].trim(), totalPages: Number(raw.match(/Total pages in PDF[^\d]*(\d+)/i)?.[1]) || null };
  }
  async close() { await this.client?.close(); this.pending = null; }
}
