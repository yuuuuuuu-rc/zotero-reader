import { setTimeout as delay } from 'node:timers/promises';

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
        body: JSON.stringify({ model, messages, max_tokens: 2200, ...(tools?.length ? { tools, tool_choice: 'auto' } : {}) }),
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
  try { value = JSON.parse(clean); } catch { throw new Error('The model did not return a valid research answer. Try again with a tool-capable model.'); }
  if (typeof value.answer !== 'string' || !value.answer.trim() || typeof value.memory !== 'string') throw new Error('The model response is missing the answer or study record.');
  if (value.answer.length > 18000 || value.memory.length > 8000) throw new Error('The model exceeded the response size limit.');
  if (value.card != null && (typeof value.card.title !== 'string' || typeof value.card.body !== 'string' || value.card.body.length > 12000)) throw new Error('Invalid note proposal.');
  return value;
}
