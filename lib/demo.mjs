const pages = [
  'DEMONSTRATION PAPER — NOT A REAL PUBLICATION\nQuestion: does retrieval improve source-grounded answers? We compare a baseline assistant with an assistant that retrieves passages before answering. The study uses 40 synthetic questions.',
  'Methods and results: the same 40 synthetic questions were answered in both conditions. Baseline: 22 answers supported by the supplied evidence; retrieval: 31. The test uses one topic and one model. No independent replication or confidence interval is reported.',
  'Limitations: this small synthetic example does not establish generalization to other topics, models or real researchers. Source links help inspection, but do not prove that an interpretation is correct.',
];
export class DemoBridge {
  async connect() { return ['demo read tools']; }
  async search() { return '# Demonstration library\n\n## Evidence before answers\n**Key:** DEMO0001\nSynthetic fixture; not a real paper.'; }
  async metadata(key) { if (key !== 'DEMO0001') throw new Error('Demo mode only contains DEMO0001.'); return { key, title: 'Evidence before answers — demonstration', type: 'journalArticle', date: 'Demo' }; }
  async page(key, number) { await this.metadata(key); if (!pages[number - 1]) throw new Error('The demo has three pages.'); return { page: number, text: pages[number - 1], totalPages: 3 }; }
  async close() {}
}
export class DemoProvider {
  async complete(messages, tools, signal) {
    signal?.throwIfAborted();
    if (tools?.length && !messages.some(m => m.role === 'tool')) return { tokens: 80, message: { role: 'assistant', content: null, tool_calls: [{ id: 'demo-read', type: 'function', function: { name: 'read_page', arguments: '{"page":2}' } }] } };
    const ids = [...JSON.stringify(messages).matchAll(/\bE[a-f0-9]{16}\b/g)].map(match => match[0]);
    const cite = ids.at(-1);
    return { tokens: 160, message: { role: 'assistant', content: JSON.stringify({ answer: `Demo response: retrieval improved evidence support in this small example${cite ? ` [${cite}]` : ''}. This does not establish generalization. This is a scripted demo, not a live AI answer.`, memory: 'Demo study record: distinguish observed evidence support from generalization; verify study scope.', card: { title: 'Does the result generalize?', body: `The example is limited to one topic and one model${cite ? ` [${cite}]` : ''}. Independent replication remains an open question.` } }) } };
  }
}
