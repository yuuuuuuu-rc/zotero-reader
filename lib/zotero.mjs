import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ALLOWED = new Set(['zotero_search_items', 'zotero_get_item_metadata', 'zotero_read_pdf_pages', 'zotero_get_collections', 'zotero_get_collection_items', 'zotero_get_recent']);
export function itemKey(value) {
  if (typeof value !== 'string' || !/^[A-Z0-9]{8}$/.test(value)) throw new Error('Use an eight-character Zotero item key.');
  return value;
}
export function parseCollections(text) {
  const collections = [], stack = [];
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/^(\s*)- \*\*(.+?)\*\* \(Key: ([A-Z0-9]{8})\)/);
    if (!match) continue;
    const depth = Math.floor(match[1].length / 2), entry = { key: match[3], name: match[2], depth, parentKey: depth ? stack[depth - 1] || null : null };
    collections.push(entry); stack[depth] = entry.key; stack.length = depth + 1;
  }
  return collections;
}
export function parseItems(text) {
  const starts = [...String(text).matchAll(/^## (?:\d+\. )?(.+)$/gm)];
  return starts.map((match,index) => {
    const block = String(text).slice(match.index, starts[index + 1]?.index ?? undefined);
    const field = label => block.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.*)$`,'m'))?.[1]?.trim() || '';
    const attachments = field('Attachments');
    return { title: match[1].trim(), key: field('Item Key'), type: field('Type'), date: field('Date'), authors: field('Authors'), attachments, hasPdf: /\bPDF\b/i.test(attachments), tags: [...field('Tags').matchAll(/`([^`]+)`/g)].map(value => value[1]) };
  }).filter(item => /^[A-Z0-9]{8}$/.test(item.key));
}
export class ZoteroBridge {
  constructor(pdfLibrary = null) { this.pdfLibrary = pdfLibrary; }
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
  async search(query) { const text = await this.call('zotero_search_items', { query, limit: 50, qmode: 'titleCreatorYear' }); return { items: parseItems(text) }; }
  async library() {
    const [tree,recent] = await Promise.all([
      this.call('zotero_get_collections', { limit: 5000 }),
      this.call('zotero_get_recent', { limit: 50 }),
    ]);
    return { collections: parseCollections(tree), items: parseItems(recent), scope: 'recent' };
  }
  async collection(key, offset = 0) {
    itemKey(key);
    if (!Number.isInteger(offset) || offset < 0 || offset > 1000000) throw new Error('Invalid collection offset.');
    const text = await this.call('zotero_get_collection_items', { collection_key: key, detail: 'summary', limit: 100, offset });
    const total = Number(text.match(/^# Items in Collection: .* \((\d+) items\)$/m)?.[1]) || parseItems(text).length;
    const items = parseItems(text);
    return { items, total, offset, nextOffset: offset + items.length < total ? offset + items.length : null };
  }
  async metadata(key) {
    const item = JSON.parse(await this.call('zotero_get_item_metadata', { item_key: itemKey(key), format: 'json' }));
    const data = item.data || item;
    return { key, title: data.title || key, abstract: data.abstractNote || '', type: data.itemType, date: data.date || '' };
  }
  async page(key, number) {
    if (!Number.isInteger(number) || number < 1 || number > 10000) throw new Error('Invalid page number.');
    itemKey(key);
    let localError;
    if (this.pdfLibrary) {
      try { return await this.pdfLibrary.page(key, number); }
      catch (error) { localError = error; }
    }
    try {
      const raw = await this.call('zotero_read_pdf_pages', { item_key: key, start_page: number, end_page: number, format: 'text' });
      const match = raw.match(new RegExp(`## Page ${number}\\s*\\n([\\s\\S]*)`));
      if (!match?.[1]?.trim()) throw new Error('Upstream returned no page text.');
      return { page: number, text: match[1].trim(), totalPages: Number(raw.match(/Total pages in PDF[^\d]*(\d+)/i)?.[1]) || null, extraction: 'zotero-mcp' };
    } catch (upstreamError) {
      if (localError?.message?.includes('no extractable text')) throw localError;
      throw new Error(`PDF extraction failed: ${localError?.message || upstreamError.message}`);
    }
  }
  async close() { await this.client?.close(); this.pending = null; }
}
