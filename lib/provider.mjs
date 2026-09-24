import { setTimeout as delay } from 'node:timers/promises';

export const PROVIDER_PRESETS = Object.freeze({
  custom: { label: 'Custom OpenAI-compatible', baseUrl: '', models: [], format: 'tool', docs: '' },
  openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-5.6','gpt-5.4-mini'], format: 'json_schema', docs: 'https://developers.openai.com/api/docs/guides/structured-outputs' },
  anthropic: { label: 'Claude (Anthropic)', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-sonnet-4-6','claude-opus-5-5'], format: 'tool', docs: 'https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/openai-sdk' },
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', models: ['deepseek-flash','deepseek-v4-pro'], format: 'json_object', docs: 'https://api-docs.deepseek.com/api/create-chat-completion/' },
  gemini: { label: 'Gemini (Google)', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-3.8-flash','gemini-3.1-pro-preview'], format: 'json_schema', docs: 'https://ai.google.dev/gemini-api/docs/openai' },
  qwen: { label: 'Qwen (Alibaba Cloud)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen3.8-max','qwen-plus'], format: 'tool', docs: 'https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope' },
  glm: { label: 'GLM (Zhipu AI)', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-5','glm-4.5-air'], format: 'tool', docs: 'https://docs.bigmodel.cn/cn/guide/develop/openai/introduction' },
  openrouter: { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', models: ['openai/gpt-5.2','anthropic/claude-sonnet-4.6','google/gemini-3-flash-preview'], format: 'json_schema', docs: 'https://openrouter.ai/docs/guides/features/structured-outputs' },
});

const RESEARCH_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    answer: { type: 'string', description: 'Reader-facing answer with supplied evidence IDs.' },
    memory: { type: 'string', description: 'Concise private study summary, corrections and open questions.' },
    card: { anyOf: [
      { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, body: { type: 'string' } }, required: ['title','body'] },
      { type: 'null' },
    ] },
  }, required: ['answer','memory','card'],
};

export function inferProvider(value = '') {
  let host = '';
  try { host = new URL(value).hostname.toLowerCase(); } catch {}
  if (host === 'api.openai.com') return 'openai';
  if (host === 'api.anthropic.com') return 'anthropic';
  if (host === 'api.deepseek.com') return 'deepseek';
  if (host === 'generativelanguage.googleapis.com') return 'gemini';
  if (host.endsWith('aliyuncs.com') || host === 'maas.qwencloudapi.com') return 'qwen';
  if (host === 'open.bigmodel.cn') return 'glm';
  if (host === 'openrouter.ai') return 'openrouter';
  return 'custom';
}

export function providerRequest(settings, messages, tools) {
  const provider = PROVIDER_PRESETS[settings.provider] ? settings.provider : inferProvider(settings.baseUrl);
  const preset = PROVIDER_PRESETS[provider];
  const strictTools = ['openai','gemini','openrouter'].includes(provider);
  const compatibleTools = tools?.map(tool => {
    if (strictTools || !tool.function?.strict) return tool;
    const { strict: _strict, ...fn } = tool.function;
    return { ...tool, function: fn };
  });
  const body = { model: settings.model, messages, max_tokens: 2200, ...(compatibleTools?.length ? { tools: compatibleTools, tool_choice: 'auto' } : {}) };
  if (preset.format === 'json_schema') body.response_format = { type: 'json_schema', json_schema: { name: 'research_answer', strict: true, schema: RESEARCH_SCHEMA } };
  if (preset.format === 'json_object') body.response_format = { type: 'json_object' };
  // DeepSeek thinking tool calls require reasoning metadata on every following turn.
  // Non-thinking mode gives the broadest compatibility for this compact Chat Completions loop.
  if (provider === 'deepseek') body.thinking = { type: 'disabled' };
  return body;
}

export function baseURL(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) throw new Error('Use an API base URL without credentials or query parameters.');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) throw new Error('API endpoints require HTTPS (local testing may use HTTP).');
  let result = url.href.replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
  if (url.hostname === 'generativelanguage.googleapis.com' && !result.endsWith('/openai')) result += '/openai';
  return result;
}
export class Provider {
  constructor(settings) { this.settings = settings; }
  async complete(messages, tools, signal) {
    const { apiKey, model, baseUrl } = this.settings;
    if (!apiKey || !model || !baseUrl) throw new Error('Set an API base URL, model and API key first.');
    for (let attempt = 0; attempt < 3; attempt++) {
      signal?.throwIfAborted();
      const response = await fetch(`${baseURL(baseUrl)}/chat/completions`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(60000)]),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(providerRequest(this.settings, messages, tools)),
      });
      if (!response.ok) {
        await response.body?.cancel();
        if ([429,500,502,503,504].includes(response.status) && attempt < 2) { await delay(700 * 2 ** attempt, undefined, { signal }); continue; }
        throw new Error(`Model API returned HTTP ${response.status}. Check the endpoint, model and account limits.`);
      }
      const result = await response.json();
      const message = result.choices?.[0]?.message;
      if (!message) throw new Error('The API returned no assistant message.');
      return { message, tokens: Number(result.usage?.total_tokens) || 0 };
    }
  }
}

export function parseAnswer(content) {
  const clean = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let value;
  try { value = JSON.parse(clean); } catch {
    // Some compatible APIs wrap otherwise valid JSON in a short introduction.
    let start = -1, depth = 0, quoted = false, escaped = false;
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (quoted) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') quoted = false; continue; }
      if (char === '"') { quoted = true; continue; }
      if (char === '{') { if (!depth) start = i; depth++; }
      else if (char === '}' && depth && !--depth) { try { value = JSON.parse(clean.slice(start,i + 1)); break; } catch { start = -1; } }
    }
    if (!value) throw new Error('The model did not return a valid research answer. Check that the selected model supports tool calling.');
  }
  if (typeof value.answer !== 'string' || !value.answer.trim() || typeof value.memory !== 'string') throw new Error('The model response is missing the answer or study record.');
  if (value.answer.length > 18000 || value.memory.length > 8000) throw new Error('The model exceeded the response size limit.');
  if (value.card != null && (typeof value.card.title !== 'string' || typeof value.card.body !== 'string' || value.card.body.length > 12000)) throw new Error('Invalid note proposal.');
  return value;
}
