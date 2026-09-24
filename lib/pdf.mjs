import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { itemKey } from './zotero.mjs';

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL('../', import.meta.url));

export function textFromPdfItems(items) {
  const rows = [];
  for (const item of items || []) {
    const value = String(item.str || '').replace(/\s+/g, ' ').trim();
    if (!value) continue;
    const y = Math.round(Number(item.transform?.[5] || 0));
    const last = rows.at(-1);
    if (!last || Math.abs(last.y - y) > 3) rows.push({ y, text: value });
    else last.text += `${last.text.endsWith('-') ? '' : ' '}${value}`;
  }
  return rows.map(row => row.text).join('\n').replace(/-\n(?=[a-z])/g, '').trim();
}

export class PdfLibrary {
  constructor() { this.resolved = new Map(); this.documents = new Map(); }
  async resolve(key) {
    itemKey(key);
    const cached = this.resolved.get(key);
    if (cached && Date.now() - cached.checkedAt < 30000) return cached.value;
    const python = process.env.ZR_PYTHON || path.join(ROOT, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
    const script = path.join(ROOT, 'scripts', 'resolve-zotero-pdf.py');
    const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => /^(PATH|SYSTEMROOT|WINDIR|APPDATA|LOCALAPPDATA|USERPROFILE|HOME|TEMP|TMP|LANG|ZOTERO_DB_PATH)$/i.test(name)));
    env.PYTHONIOENCODING = 'utf-8';
    const { stdout } = await execFileAsync(python, [script, key], { env, windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024 });
    const result = JSON.parse(stdout.trim() || '{"path":null}');
    if (!result.path) { this.resolved.set(key, { checkedAt: Date.now(), value: null }); return null; }
    const details = await stat(result.path);
    if (!details.isFile() || details.size < 5) throw new Error('The Zotero PDF attachment is unavailable.');
    const value = { path: path.resolve(result.path), attachmentKey: result.attachmentKey, filename: result.filename || path.basename(result.path), size: details.size, modified: details.mtimeMs };
    this.resolved.set(key, { checkedAt: Date.now(), value });
    return value;
  }
  async info(key) {
    try {
      const value = await this.resolve(key);
      return value ? { available: true, attachmentKey: value.attachmentKey, filename: value.filename, size: value.size } : { available: false };
    } catch { return { available: false }; }
  }
  async document(key) {
    const file = await this.resolve(key);
    if (!file) throw new Error('No local PDF attachment is available.');
    const cacheKey = `${file.path}:${file.modified}:${file.size}`;
    if (!this.documents.has(cacheKey)) {
      const promise = (async () => {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const bytes = new Uint8Array(await readFile(file.path));
        return pdfjs.getDocument({ data: bytes, isEvalSupported: false, useWorkerFetch: false, verbosity: 0 }).promise;
      })().catch(error => { this.documents.delete(cacheKey); throw error; });
      this.documents.set(cacheKey, promise);
      while (this.documents.size > 3) this.documents.delete(this.documents.keys().next().value);
    }
    return { file, document: await this.documents.get(cacheKey) };
  }
  async page(key, number) {
    if (!Number.isInteger(number) || number < 1 || number > 10000) throw new Error('Invalid page number.');
    const { file, document } = await this.document(key);
    if (number > document.numPages) throw new Error(`Page ${number} is outside this ${document.numPages}-page PDF.`);
    const page = await document.getPage(number);
    const content = await page.getTextContent({ includeMarkedContent: false, disableNormalization: false });
    const text = textFromPdfItems(content.items);
    if (!text) throw new Error('This PDF page has no extractable text. It may be a scan and need OCR.');
    return { page: number, text, totalPages: document.numPages, extraction: text.length < 80 ? 'sparse' : 'text-layer', sourceVersion: `${file.attachmentKey}:${file.size}:${Math.round(file.modified)}` };
  }
}
