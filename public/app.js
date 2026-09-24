const $ = id => document.getElementById(id);
const zh = {
  'RESEARCH COMPANION':'论文阅读助手','API preview':'API 探索版','Language':'界面语言',
  'Connect Zotero':'连接 Zotero','Settings':'设置','Connecting to the local reading workspace…':'正在连接本地阅读工作区…',
  'Your papers':'我的论文','Find a title or author':'搜索标题或作者','Search Zotero':'搜索 Zotero','Search':'搜索','Zotero library':'Zotero 资料库','Refresh':'刷新','Search this library':'搜索当前资料库','Title, author or year':'标题、作者或年份','Loading collections…':'正在载入分类…','Recently added':'最近添加','Load more':'载入更多','Reading history':'阅读记录','My Library':'我的资料库','No items in this view.':'当前视图没有条目。',
  'Open by item key':'按条目编号打开','Eight-character Zotero key':'8 位 Zotero 条目编号','Open':'打开','Recent papers':'最近阅读',
  'Source text is read through zotero-mcp. Opening a page does not call the model.':'原文通过 zotero-mcp 读取。打开页面不会调用 AI。',
  'SOURCE EVIDENCE':'原文证据','Start with a question worth reading for.':'带着问题，开始阅读。',
  'Choose a Zotero paper to read its extracted PDF text alongside the conversation.':'选择 Zotero 中的论文，一边查看提取的 PDF 原文，一边与 AI 讨论。',
  'Page':'页码','Read page':'读取本页','Prepare paper':'预读论文','Pause':'暂停',
  'The source passage appears here. You can select text and ask about it. Scans, equations and figures may need inspection in Zotero.':'原文将显示在这里。可以选中文字并提问。扫描页、公式和图表可能需要在 Zotero 中查看。',
  'Use selected passage in my question':'将选中文字加入问题','Discussion':'讨论','Note cards':'笔记卡片',
  'Read, question, verify.':'阅读、追问、核实。',
  'Ask what a claim means, what evidence supports it, or where its limits are. Answers link to the pages actually read.':'询问论点的含义、支持它的证据或它的局限。回答会链接到实际读取的原文页面。',
  'AI study records stay behind the conversation. Accepted cards are yours to edit.':'AI 阅读记录在后台维护。接受后的笔记卡片由你编辑。',
  'Your question':'你的问题','What does this experiment establish—and what does it leave uncertain?':'这个实验说明了什么？还有哪些不确定之处？','Discuss with AI':'与 AI 讨论',
  'Model connection':'模型连接','Your API credentials are stored locally, outside this project.':'API 密钥保存在本机，不放入项目仓库。','Provider template':'模型服务模板',
  'OpenAI-compatible base URL':'兼容 OpenAI 的 API 地址','Model name':'模型名称',"Your provider's tool-capable model":'填写支持工具调用的模型名称',
  'Suggested models are editable. Availability depends on your account and region.':'建议模型可以修改，实际可用性取决于账户和区域。','Official documentation':'官方说明文档','Custom endpoint: enter a compatible URL and tool-capable model.':'自定义接口：填写兼容地址和支持工具调用的模型。',
  'API key':'API 密钥','Leave blank to keep the saved key':'留空则保留已保存的密钥',
  'Sending a question shares the current evidence with this provider. Preparing a paper sends its extractable text page by page.':'发送问题会将当前证据交给所配置的模型服务。预读论文会逐页发送可提取的文本。',
  'Cancel':'取消','Save settings':'保存设置','Source evidence':'原文证据','Close':'关闭',
  'SCRIPTED DEMO':'模拟演示','LOCAL API MODE':'本地 API 模式','Ready to read':'可以开始阅读',
  'Read this page to load its source text.':'点击“读取本页”加载原文。','Useful conclusions appear here as editable drafts after a discussion.':'讨论后，有用的结论会以可编辑的笔记草稿出现在这里。',
  'Saved locally · editable':'已保存在本地 · 可编辑','AI draft · review before accepting':'AI 草稿 · 请审阅后接受','Card title':'卡片标题','Card body':'卡片内容','Accept / save edits':'接受 / 保存修改',
  'Card saved locally. Zotero publication is not enabled in this preview.':'卡片已保存在本地。此探索版暂未启用 Zotero 写回。',
  'Opening saved reading workspace…':'正在打开已保存的阅读工作区…','Reading through zotero-mcp…':'正在通过 zotero-mcp 读取…',
  'Scripted demo: no real model requests and no Zotero changes.':'模拟演示：不会调用真实模型，也不会修改 Zotero。',
  'Paper ready. Questions send retrieved evidence to your configured provider.':'论文已就绪。提问会将检索到的证据发送给所配置的模型服务。',
  'Searching Zotero…':'正在搜索 Zotero…','Search complete. Open a result or paste its item key.':'搜索完成。打开结果，或粘贴条目编号。',
  'Connecting to zotero-mcp…':'正在连接 zotero-mcp…','MCP connected. Search for a title to check your Zotero library connection.':'MCP 已连接。搜索论文标题即可检查文库连接。',
  'MCP connected. Browse a collection or search your Zotero library.':'MCP 已连接。可以浏览分类或搜索 Zotero 资料库。','Loading Zotero collection…':'正在载入 Zotero 分类…','Zotero collection loaded.':'Zotero 分类已载入。','Search complete. Select an item to read.':'搜索完成。请选择一个条目阅读。',
  'Open a paper first.':'请先打开一篇论文。','Reading source page…':'正在读取原文页面…','Source page loaded.':'原文页面已加载。',
  'Pause requested. Completed preparation pages are kept.':'已请求暂停，已完成的预读页面会保留。','Select text in the source passage first.':'请先在原文区域选中文字。',
  'Demo mode uses a scripted provider. Open API mode on port 43140 to configure a real model.':'演示模式使用模拟回答。请打开 43140 端口的 API 版配置真实模型。',
  'A key is already saved.':'已保存 API 密钥。','No API key saved yet.':'尚未保存 API 密钥。','API settings saved locally.':'API 设置已保存在本地。',
  'Scripted demo: open DEMO0001. No API key needed.':'模拟演示：打开 DEMO0001 即可体验，无需 API 密钥。','Connect Zotero, then configure your model in Settings.':'连接 Zotero，然后在“设置”中配置模型。',
  'running':'进行中','complete':'已完成','failed':'失败','paused':'已暂停','Starting':'正在开始','Paused':'已暂停','Paused by reader.':'已由读者暂停。',
  'Available text prepared':'可用文本预读完成','Answer saved':'回答已保存','Server restarted; resume preparation or retry your question.':'服务已重启，请继续预读或重新提问。',
  'Recovered from a Windows file lock; resume preparation from the saved checkpoint.':'已从 Windows 文件占用中恢复，可从保存的断点继续预读。',
  'Task time limit reached. Resume preparation or retry the question.':'任务已达到时间上限，请继续预读或重新提问。',
  'Server shutting down.':'服务正在关闭。','Source text changed. Earlier answers and cards may refer to an older version; prepare again.':'原文已变化。先前的回答和卡片可能引用旧版本，请重新预读。',
  'Request failed.':'请求失败。','Failed to fetch':'连接失败，请检查本地服务是否正在运行。','fetch failed':'连接失败，请检查服务地址和网络。',
  'Invalid local host.':'本地服务地址无效。','Cross-site requests are not allowed.':'不允许跨站请求。','Reload this local page to reconnect.':'请刷新此页面以重新连接。','JSON required.':'请求必须使用 JSON 格式。','Not found.':'未找到请求的内容。',
  'Request is too large.':'请求内容过长。','Demo mode does not use or save API credentials.':'演示模式不使用或保存 API 密钥。','Pause active reading tasks before changing providers.':'请先暂停正在运行的阅读任务，再修改模型服务。',
  'Enter a model name and a valid API key.':'请输入模型名称和有效的 API 密钥。','Enter a title, author or keyword (up to 200 characters).':'请输入标题、作者或关键词（最多 200 个字符）。','Configure your API key in Settings first.':'请先在“设置”中配置 API 密钥。',
  'Pause the reading task before editing a card.':'请先暂停阅读任务，再编辑卡片。','Invalid card.':'卡片内容无效。','Use an eight-character Zotero item key.':'请使用 8 位 Zotero 条目编号。','This prototype only permits selected read tools.':'此探索版仅允许指定的读取工具。','Choose a supported provider template or Custom.':'请选择受支持的模型服务模板或“自定义”。',
  'Invalid page number.':'页码无效。','Upstream returned no page text.':'Zotero 工具未返回页面文本。','Use an API base URL without credentials or query parameters.':'API 地址不能包含登录凭据或查询参数。','API endpoints require HTTPS (local testing may use HTTP).':'API 地址需要使用 HTTPS（本地测试可使用 HTTP）。',
  'Set an API base URL, model and API key first.':'请先设置 API 地址、模型和密钥。','The API returned no assistant message.':'API 未返回模型回答。','The model did not return a valid research answer. Check that the selected model supports tool calling.':'模型未返回有效的研究回答，请确认所选模型支持工具调用。','The model mixed its final answer with other tool requests. Please retry.':'模型同时提交最终回答和其他工具请求，请重试。',
  'The model response is missing the answer or study record.':'模型返回内容缺少回答或阅读记录。','The model exceeded the response size limit.':'模型回答超过了长度限制。','Invalid note proposal.':'笔记建议格式无效。','Demo mode only contains DEMO0001.':'演示模式仅包含 DEMO0001。','The demo has three pages.':'演示论文共有 3 页。',
  'The answer cited evidence that was not retrieved. Nothing was accepted.':'回答引用了未读取的证据，本次结果未保存。','The answer did not cite any retrieved evidence. Nothing was accepted.':'回答没有引用已读取的证据，本次结果未保存。','Wait for the current reading task or pause it.':'请等待当前阅读任务完成，或先暂停任务。',
  'Enter a question of up to 6000 characters.':'请输入问题（最多 6000 个字符）。','Invalid starting page.':'起始页码无效。','A task is already running for this paper.':'这篇论文已有任务正在运行。','Open a source page first.':'请先打开一页原文。',
  'Preparation currently supports PDFs with a known length of up to 200 pages.':'预读目前支持已知页数且不超过 200 页的 PDF。','Reading budget reached. Narrow the question or resume later.':'已达到阅读用量上限，请缩小问题范围或稍后继续。','The model requested too many or unavailable tools.':'模型请求了过多或不可用的工具。',
  'The model requested a tool outside this paper-reading scope.':'模型请求的工具超出了本篇论文的阅读范围。','Invalid or out-of-scope page request.':'页面请求无效或超出了允许范围。','Tool-call limit reached. Ask a narrower question.':'已达到工具调用次数上限，请缩小问题范围。',
};
let language = navigator.language?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
try { const saved = localStorage.getItem('zr-interface-language'); if (['zh-CN','en'].includes(saved)) language = saved; } catch {}
function tr(value) {
  if (language === 'en') return value;
  if (Object.hasOwn(zh, value)) return zh[value];
  return value.replace(/^Preparing page (\d+) of (\d+)$/, '正在预读第 $1 页，共 $2 页')
    .replace(/^Checking evidence · step (\d+) of 5$/, '正在核查证据 · 第 $1 步，共 5 步')
    .replace(/^Model API returned HTTP (\d+)\. Check the endpoint, model and account limits\.$/, '模型 API 返回 HTTP $1。请检查地址、模型和账户额度。')
    .replace(/^Upstream tool is unavailable: (.+)$/, 'Zotero 工具不可用：$1');
}
// Capture only the original interface labels, never source text or reader content.
const staticLabels = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) { const node = walker.currentNode; const text = node.nodeValue.trim(); if (Object.hasOwn(zh,text)) staticLabels.push({node,text}); }
const placeholders = [...document.querySelectorAll('[placeholder]')].map(node => ({node,text:node.placeholder}));
let lastNotice = '', lastNoticeError = false, evidenceSource;
let token, paper, demo, polling, renderedMessages = '', renderedCards = '', providerPresets = {};
let libraryCollections = [], libraryItems = [], libraryScopeKey = null, libraryScopeName = 'Recently added', libraryNextOffset = null;
function notice(message, error = false) { lastNotice = message; lastNoticeError = error; $('notice').textContent = tr(message); $('notice').classList.toggle('error', error); }
function evidenceTitle(source) { return language === 'zh-CN' ? `原文 · PDF 第 ${source.page} 页${source.truncated ? ' · 节选' : ''}` : `Source · physical page ${source.page}${source.truncated ? ' · excerpt' : ''}`; }
function applyLanguage() {
  const drafts = [...document.querySelectorAll('.card')].map(el => ({id:el.dataset.id,title:el.querySelector('input').value,body:el.querySelector('textarea').value}));
  document.documentElement.lang = language; $('language').value = language;
  for (const {node,text} of staticLabels) if (node.isConnected) node.nodeValue = tr(text);
  for (const {node,text} of placeholders) node.placeholder = tr(text);
  if (demo !== undefined) $('mode').textContent = tr(demo ? 'SCRIPTED DEMO' : 'LOCAL API MODE');
  if ($('key-state').dataset.message) $('key-state').textContent = tr($('key-state').dataset.message);
  for (const el of document.querySelectorAll('[data-read-key]')) el.textContent = `${language === 'zh-CN' ? '阅读' : 'Read'} ${el.dataset.readKey}`;
  if (evidenceSource) $('evidence-title').textContent = evidenceTitle(evidenceSource);
  renderedMessages = ''; renderedCards = ''; render();
  if (libraryItems.length || libraryCollections.length) { renderCollections(); renderLibraryItems(); }
  if (Object.keys(providerPresets).length) renderProviderPreset(false);
  for (const draft of drafts) { const el = [...document.querySelectorAll('.card')].find(node => node.dataset.id === draft.id); if (el) { el.querySelector('input').value = draft.title; el.querySelector('textarea').value = draft.body; } }
  if (lastNotice) notice(lastNotice,lastNoticeError);
}
$('language').onchange = () => { language = $('language').value; try { localStorage.setItem('zr-interface-language',language); } catch {} applyLanguage(); };
async function api(route, body) {
  const response = await fetch(`/api/${route}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Research-Token': token, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Request failed.'); return value;
}
function action(task) { return async event => { event?.preventDefault(); try { await task(event); } catch (error) { notice(error.message, true); } }; }
function button(text, handler) { const el = document.createElement('button'); el.textContent = tr(text); el.onclick = action(handler); return el; }
function renderEvidence(text, evidence) {
  const el = document.createElement('div');
  for (const part of text.split(/(\[E[a-f0-9]{16}\])/g)) {
    const source = evidence?.find(e => `[${e.id}]` === part);
    if (!source) el.append(document.createTextNode(part));
    else { const link = button(language === 'zh-CN' ? `第 ${source.page} 页` : `p. ${source.page}`, () => { evidenceSource = source; $('evidence-title').textContent = evidenceTitle(source); $('evidence-text').textContent = source.text; $('evidence-dialog').showModal(); }); link.className = 'cite'; el.append(link); }
  }
  return el;
}
function render() {
  if (!paper) return;
  $('paper-title').textContent = paper.title;
  $('paper-meta').textContent = language === 'zh-CN' ? `${paper.key} · PDF 共 ${paper.totalPages || '?'} 页 · 已预读 ${paper.preparedPages.length} 页 · 阅读记录修订 ${paper.memoryRevisions} 次` : `${paper.key} · ${paper.totalPages || '?'} PDF pages · ${paper.preparedPages.length} prepared · ${paper.memoryRevisions} study revisions`;
  const page = Number($('page').value); $('source').textContent = paper.pages[page]?.text || tr('Read this page to load its source text.');
  const busy = paper.job?.status === 'running';
  for (const id of ['ask','prepare','read-page']) $(id).disabled = busy;
  $('pause').disabled = !busy;
  $('progress').textContent = paper.job ? `${tr(paper.job.status)}: ${tr(paper.job.step)} · ${paper.job.tokens || 0} ${language === 'zh-CN' ? '已报告 token' : 'reported tokens'}` : tr('Ready to read');
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
    if (!paper.cards.length) $('cards-pane').textContent = tr('Useful conclusions appear here as editable drafts after a discussion.');
    for (const card of paper.cards) {
      const el = document.createElement('article'); el.className = 'card'; el.dataset.id = card.id;
      const status = document.createElement('div'); status.className = 'badge'; status.textContent = tr(card.status === 'accepted' ? 'Saved locally · editable' : 'AI draft · review before accepting');
      const title = document.createElement('input'); title.value = card.title; title.setAttribute('aria-label',tr('Card title'));
      const body = document.createElement('textarea'); body.value = card.body; body.setAttribute('aria-label',tr('Card body'));
      el.append(status, title, body, button('Accept / save edits', async () => { await api('card', { key: paper.key, id: card.id, title: title.value, body: body.value }); await refresh(); notice('Card saved locally. Zotero publication is not enabled in this preview.'); }), renderEvidence(card.body, card.evidence));
      $('cards-pane').append(el);
    }
  }
}
async function recent() { const items = await api('papers'); $('recent').replaceChildren(...items.map(item => button(item.title, () => open(item.key, true)))); }
function renderLibraryItems() {
  $('item-scope').textContent = libraryScopeName === 'Recently added' ? tr(libraryScopeName) : libraryScopeName;
  $('results').replaceChildren();
  if (!libraryItems.length) { const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = tr('No items in this view.'); $('results').append(empty); }
  for (const item of libraryItems) {
    const row = document.createElement('button'); row.className = 'item-row'; row.onclick = action(() => open(item.key));
    const title = document.createElement('span'); title.className = 'item-title'; title.textContent = item.title || item.key;
    const meta = document.createElement('span'); meta.className = 'item-meta';
    const year = item.date?.match(/\b(?:19|20)\d{2}\b/)?.[0] || item.date || '';
    meta.textContent = [item.hasPdf ? 'PDF' : '', item.authors, year, item.type].filter(Boolean).join(' · ');
    if (item.hasPdf) meta.classList.add('pdf-mark'); row.append(title,meta); $('results').append(row);
  }
  $('more-items').hidden = libraryNextOffset == null;
}
function renderCollections() {
  $('collections').replaceChildren();
  const root = button('My Library', () => loadLibrary()); root.classList.toggle('active',!libraryScopeKey); $('collections').append(root);
  for (const collection of libraryCollections) {
    const entry = button(collection.name, () => loadCollection(collection)); entry.style.paddingLeft = `${10 + collection.depth * 16}px`;
    entry.title = collection.name; entry.classList.toggle('active',libraryScopeKey === collection.key); $('collections').append(entry);
  }
}
async function loadLibrary() {
  notice('Connecting to zotero-mcp…'); const data = await api('library');
  libraryCollections = data.collections; libraryItems = data.items; libraryScopeKey = null; libraryScopeName = 'Recently added'; libraryNextOffset = null;
  renderCollections(); renderLibraryItems(); notice('MCP connected. Browse a collection or search your Zotero library.');
}
async function loadCollection(collection, append = false) {
  notice('Loading Zotero collection…'); const offset = append ? libraryNextOffset || 0 : 0;
  const data = await api(`collection?key=${encodeURIComponent(collection.key)}&offset=${offset}`);
  libraryItems = append ? [...libraryItems,...data.items] : data.items; libraryScopeKey = collection.key; libraryScopeName = collection.name; libraryNextOffset = data.nextOffset;
  renderCollections(); renderLibraryItems(); notice('Zotero collection loaded.');
}
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
  const query = $('query').value.trim(); if (!query) return loadLibrary();
  notice('Searching Zotero…'); const result = await api('search', { query });
  libraryItems = result.items; libraryScopeKey = 'search'; libraryScopeName = language === 'zh-CN' ? `搜索：${query}` : `Search: ${query}`; libraryNextOffset = null;
  renderCollections(); renderLibraryItems(); notice('Search complete. Select an item to read.');
});
$('open-form').onsubmit = action(() => open($('key').value.trim().toUpperCase()));
$('connect').onclick = action(loadLibrary); $('refresh-library').onclick = action(loadLibrary);
$('more-items').onclick = action(async () => { const collection = libraryCollections.find(value => value.key === libraryScopeKey); if (collection && libraryNextOffset != null) await loadCollection(collection,true); });
$('read-page').onclick = action(async () => { if (!paper) throw new Error('Open a paper first.'); notice('Reading source page…'); paper = await api('open', { key: paper.key, page: Number($('page').value) }); render(); notice('Source page loaded.'); });
$('ask-form').onsubmit = action(async () => {
  if (!paper) throw new Error('Open a paper first.');
  await api('run', { key: paper.key, question: $('question').value, page: Number($('page').value) });
  $('question').value = ''; await refresh(); poll();
});
$('prepare').onclick = action(async () => {
  if (!paper) throw new Error('Open a paper first.');
  if (!confirm(language === 'zh-CN' ? `预读全部 ${paper.totalPages || '?'} 页？提取的原文会逐页发送给所配置的模型服务，可能产生 API 费用。可以暂停并继续。` : `Prepare all ${paper.totalPages || '?'} pages? Extracted text will be sent to your configured provider page by page. API charges may apply. You can pause and resume.`)) return;
  await api('run', { key: paper.key, page: 1, prepare: true }); await refresh(); poll();
});
$('pause').onclick = action(async () => { if (paper) { await api('pause', { key: paper.key }); notice('Pause requested. Completed preparation pages are kept.'); poll(); } });
$('use-selection').onclick = action(() => {
  const selection = window.getSelection(); const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || !$('source').contains(range.commonAncestorContainer) || !selection.toString().trim()) throw new Error('Select text in the source passage first.');
  $('question').value = `${language === 'zh-CN' ? `关于第 ${$('page').value} 页的这段文字：` : `About this passage on page ${$('page').value}:`}\n“${selection.toString().slice(0,4000)}”\n\n`; $('question').focus();
});
function tab(cards) { $('cards-pane').hidden = !cards; $('chat-pane').hidden = cards; $('cards-tab').classList.toggle('active',cards); $('chat-tab').classList.toggle('active',!cards); }
$('chat-tab').onclick = () => tab(false); $('cards-tab').onclick = () => tab(true);
function renderProviderPreset(fill) {
  const preset = providerPresets[$('provider-name').value]; if (!preset) return;
  $('model-options').replaceChildren(...preset.models.map(model => Object.assign(document.createElement('option'),{value:model})));
  if (fill) { $('base-url').value = preset.baseUrl; $('model-name').value = preset.models[0] || ''; }
  $('provider-help').replaceChildren(document.createTextNode(preset.docs ? `${preset.label} · ` : tr('Custom endpoint: enter a compatible URL and tool-capable model.')));
  if (preset.docs) { const link = document.createElement('a'); link.href = preset.docs; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = tr('Official documentation'); $('provider-help').append(link); }
}
$('provider-name').onchange = () => renderProviderPreset(true);
$('settings').onclick = action(async () => {
  if (demo) throw new Error('Demo mode uses a scripted provider. Open API mode on port 43140 to configure a real model.');
  const value = await api('settings'); providerPresets = value.presets;
  $('provider-name').replaceChildren(...Object.entries(providerPresets).map(([id,preset]) => Object.assign(document.createElement('option'),{value:id,textContent:preset.label})));
  $('provider-name').value = value.provider; renderProviderPreset(false);
  $('base-url').value = value.baseUrl; $('model-name').value = value.model; $('api-key').value = '';
  $('key-state').dataset.message = value.hasKey ? 'A key is already saved.' : 'No API key saved yet.'; $('key-state').textContent = tr($('key-state').dataset.message); $('settings-dialog').showModal();
});
$('settings-form').onsubmit = action(async () => { await api('settings',{ provider:$('provider-name').value, baseUrl:$('base-url').value, model:$('model-name').value, apiKey:$('api-key').value }); $('api-key').value = ''; $('settings-dialog').close(); notice('API settings saved locally.'); });
$('close-settings').onclick = () => $('settings-dialog').close(); $('close-evidence').onclick = () => $('evidence-dialog').close();
applyLanguage();
action(async () => { const boot = await (await fetch('/api/bootstrap')).json(); token = boot.token; demo = boot.demo; $('mode').textContent = tr(demo ? 'SCRIPTED DEMO' : 'LOCAL API MODE'); await recent(); await loadLibrary(); if (demo) { $('key').value = 'DEMO0001'; await open('DEMO0001'); } })();
