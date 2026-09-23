const $ = id => document.getElementById(id);
let token, paper, demo, polling, renderedMessages = '', renderedCards = '';
function notice(message, error = false) { $('notice').textContent = message; $('notice').classList.toggle('error', error); }
async function api(route, body) {
  const response = await fetch(`/api/${route}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Research-Token': token, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Request failed.'); return value;
}
function action(task) { return async event => { event?.preventDefault(); try { await task(event); } catch (error) { notice(error.message, true); } }; }
function button(text, handler) { const el = document.createElement('button'); el.textContent = text; el.onclick = action(handler); return el; }
function renderEvidence(text, evidence) {
  const el = document.createElement('div');
  for (const part of text.split(/(\[E[a-f0-9]{16}\])/g)) {
    const source = evidence?.find(e => `[${e.id}]` === part);
    if (!source) el.append(document.createTextNode(part));
    else { const link = button(`p. ${source.page}`, () => { $('evidence-title').textContent = `Source · physical page ${source.page}${source.truncated ? ' · excerpt' : ''}`; $('evidence-text').textContent = source.text; $('evidence-dialog').showModal(); }); link.className = 'cite'; el.append(link); }
  }
  return el;
}
function render() {
  if (!paper) return;
  $('paper-title').textContent = paper.title;
  $('paper-meta').textContent = `${paper.key} · ${paper.totalPages || '?'} PDF pages · ${paper.preparedPages.length} prepared · ${paper.memoryRevisions} study revisions`;
  const page = Number($('page').value); $('source').textContent = paper.pages[page]?.text || 'Read this page to load its source text.';
  const busy = paper.job?.status === 'running';
  for (const id of ['ask','prepare','read-page']) $(id).disabled = busy;
  $('pause').disabled = !busy;
  $('progress').textContent = paper.job ? `${paper.job.status}: ${paper.job.step} · ${paper.job.tokens || 0} reported tokens` : 'Ready to read';
  if (paper.warning) notice(paper.warning, true);
  if (paper.job?.status === 'failed') notice(paper.job.step, true);
  const messageVersion = JSON.stringify(paper.messages);
  if (renderedMessages !== messageVersion) {
    renderedMessages = messageVersion; $('messages').replaceChildren();
    for (const message of paper.messages) {
      const el = document.createElement('article'); el.className = 'message';
      const question = document.createElement('div'); question.className = 'question'; question.textContent = message.question;
      const answer = renderEvidence(message.answer, message.evidence); answer.className = 'answer';
      el.append(question, answer); $('messages').append(el);
    }
    $('messages').scrollTop = $('messages').scrollHeight;
  }
  const cardVersion = JSON.stringify(paper.cards);
  if (renderedCards !== cardVersion) {
    renderedCards = cardVersion; $('cards-pane').replaceChildren();
    if (!paper.cards.length) $('cards-pane').textContent = 'Useful conclusions appear here as editable drafts after a discussion.';
    for (const card of paper.cards) {
      const el = document.createElement('article'); el.className = 'card';
      const status = document.createElement('div'); status.className = 'badge'; status.textContent = card.status === 'accepted' ? 'Saved locally · editable' : 'AI draft · review before accepting';
      const title = document.createElement('input'); title.value = card.title; title.setAttribute('aria-label','Card title');
      const body = document.createElement('textarea'); body.value = card.body; body.setAttribute('aria-label','Card body');
      el.append(status, title, body, button('Accept / save edits', async () => { await api('card', { key: paper.key, id: card.id, title: title.value, body: body.value }); await refresh(); notice('Card saved locally. Zotero publication is not enabled in this preview.'); }), renderEvidence(card.body, card.evidence));
      $('cards-pane').append(el);
    }
  }
}
async function recent() { const items = await api('papers'); $('recent').replaceChildren(...items.map(item => button(item.title, () => open(item.key, true)))); }
async function open(key, cached = false) {
  clearTimeout(polling); notice(cached ? 'Opening saved reading workspace…' : 'Reading through zotero-mcp…');
  paper = await api(cached ? `paper?key=${encodeURIComponent(key)}` : 'open', cached ? undefined : { key, page: 1 });
  $('key').value = key; $('page').value = '1'; renderedMessages = ''; renderedCards = ''; render(); await recent();
  notice(demo ? 'Scripted demo: no real model requests and no Zotero changes.' : 'Paper ready. Questions send retrieved evidence to your configured provider.');
  if (paper.job?.status === 'running') poll();
}
async function refresh() { if (!paper) return; paper = await api(`paper?key=${paper.key}`); render(); }
function poll() { clearTimeout(polling); polling = setTimeout(action(async () => { await refresh(); if (paper.job?.status === 'running') poll(); }), 1000); }
$('search-form').onsubmit = action(async () => {
  notice('Searching Zotero…'); const result = await api('search', { query: $('query').value });
  const pre = document.createElement('pre'); pre.textContent = result.text; $('results').replaceChildren(pre);
  const keys = [...new Set([...result.text.matchAll(/(?:\*\*(?:Item )?Key:\*\*\s*`?|\bkey[: ]+`?)([A-Z0-9]{8})/gi)].map(m => m[1]))];
  for (const key of keys) $('results').append(button(`Read ${key}`, () => open(key)));
  notice('Search complete. Open a result or paste its item key.');
});
$('open-form').onsubmit = action(() => open($('key').value.trim().toUpperCase()));
$('connect').onclick = action(async () => { notice('Connecting to zotero-mcp…'); await api('connect', {}); notice('MCP connected. Search for a title to check your Zotero library connection.'); });
$('read-page').onclick = action(async () => { if (!paper) throw new Error('Open a paper first.'); notice('Reading source page…'); paper = await api('open', { key: paper.key, page: Number($('page').value) }); render(); notice('Source page loaded.'); });
$('ask-form').onsubmit = action(async () => {
  if (!paper) throw new Error('Open a paper first.');
  await api('run', { key: paper.key, question: $('question').value, page: Number($('page').value) });
  $('question').value = ''; await refresh(); poll();
});
$('prepare').onclick = action(async () => {
  if (!paper) throw new Error('Open a paper first.');
  if (!confirm(`Prepare all ${paper.totalPages || '?'} pages? Extracted text will be sent to your configured provider page by page. API charges may apply. You can pause and resume.`)) return;
  await api('run', { key: paper.key, page: 1, prepare: true }); await refresh(); poll();
});
$('pause').onclick = action(async () => { if (paper) { await api('pause', { key: paper.key }); notice('Pause requested. Completed preparation pages are kept.'); poll(); } });
$('use-selection').onclick = action(() => {
  const selection = window.getSelection(); const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || !$('source').contains(range.commonAncestorContainer) || !selection.toString().trim()) throw new Error('Select text in the source passage first.');
  $('question').value = `About this passage on page ${$('page').value}:\n“${selection.toString().slice(0,4000)}”\n\n`; $('question').focus();
});
function tab(cards) { $('cards-pane').hidden = !cards; $('chat-pane').hidden = cards; $('cards-tab').classList.toggle('active',cards); $('chat-tab').classList.toggle('active',!cards); }
$('chat-tab').onclick = () => tab(false); $('cards-tab').onclick = () => tab(true);
$('settings').onclick = action(async () => { if (demo) throw new Error('Demo mode uses a scripted provider. Open API mode on port 43140 to configure a real model.'); const value = await api('settings'); $('base-url').value = value.baseUrl; $('model-name').value = value.model; $('api-key').value = ''; $('key-state').textContent = value.hasKey ? 'A key is already saved.' : 'No API key saved yet.'; $('settings-dialog').showModal(); });
$('settings-form').onsubmit = action(async () => { await api('settings',{ baseUrl:$('base-url').value, model:$('model-name').value, apiKey:$('api-key').value }); $('api-key').value = ''; $('settings-dialog').close(); notice('API settings saved locally.'); });
$('close-settings').onclick = () => $('settings-dialog').close(); $('close-evidence').onclick = () => $('evidence-dialog').close();
action(async () => { const boot = await (await fetch('/api/bootstrap')).json(); token = boot.token; demo = boot.demo; $('mode').textContent = demo ? 'SCRIPTED DEMO' : 'LOCAL API MODE'; await recent(); notice(demo ? 'Scripted demo: open DEMO0001. No API key needed.' : 'Connect Zotero, then configure your model in Settings.'); if (demo) { $('key').value = 'DEMO0001'; await open('DEMO0001'); } })();
