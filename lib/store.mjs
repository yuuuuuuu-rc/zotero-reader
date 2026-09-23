import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { itemKey } from './zotero.mjs';

export class Store {
  constructor(root) { this.root = root; this.queues = new Map(); }
  async read(name, fallback) {
    try { return JSON.parse(await readFile(path.join(this.root, name), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return structuredClone(fallback); throw error; }
  }
  async write(name, value) {
    const target = path.join(this.root, name);
    await mkdir(path.dirname(target), { recursive: true });
    const temp = `${target}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
    await rename(temp, target);
  }
  paper(key) { return this.read(`papers/${itemKey(key)}.json`, { key, title: key, pages: {}, messages: [], cards: [], memory: '', revisions: [], prepared: {}, job: null }); }
  savePaper(paper) { return this.write(`papers/${itemKey(paper.key)}.json`, paper); }
  async exclusive(key, task) {
    const previous = this.queues.get(key) || Promise.resolve();
    const pending = previous.catch(() => {}).then(task);
    this.queues.set(key, pending);
    try { return await pending; } finally { if (this.queues.get(key) === pending) this.queues.delete(key); }
  }
}
export function publicPaper(paper) {
  const { memory, revisions, prepared, ...visible } = paper;
  return { ...visible, preparedPages: Object.keys(prepared).map(Number), memoryRevisions: revisions.length };
}
