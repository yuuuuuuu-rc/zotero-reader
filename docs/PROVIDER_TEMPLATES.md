# Model provider templates

Reviewed against provider documentation on 2026-09-23. Templates use each provider's OpenAI-compatible Chat Completions endpoint so the same bounded paper-reading harness can be retained. Endpoint and model fields remain editable because account access, regions and model availability change.

| Template | Default base URL | Suggested tool-capable models | Final-answer strategy |
| --- | --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | `gpt-5.6`, `gpt-5.4-mini` | strict JSON Schema plus final-answer tool |
| Claude | `https://api.anthropic.com/v1` | `claude-sonnet-4-6`, `claude-opus-5-5` | final-answer tool; its compatibility layer ignores `response_format` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-flash`, `deepseek-v4-pro` | JSON object plus final-answer tool; thinking disabled for a portable tool loop |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-3.8-flash`, `gemini-3.1-pro-preview` | strict JSON Schema plus final-answer tool |
| Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen3.8-max`, `qwen-plus` | final-answer tool; endpoint and key must belong to the same region |
| GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-5`, `glm-4.5-air` | final-answer tool |
| OpenRouter | `https://openrouter.ai/api/v1` | provider-qualified model IDs | strict JSON Schema plus final-answer tool; choose a model supporting tools and structured output |
| Custom | user supplied | user supplied | final-answer tool with tolerant JSON fallback |

The harness offers `read_page` only for the selected Zotero paper and `submit_research_answer` for the final typed result. A provider can either call the final-answer tool or return the equivalent JSON. The server still validates citations and rejects unknown tools, out-of-scope pages and malformed note proposals.

## Sources

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Anthropic OpenAI SDK compatibility](https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/openai-sdk)
- [DeepSeek Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/) and [tool calls](https://api-docs.deepseek.com/guides/tool_calls/)
- [Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
- [Alibaba Cloud Model Studio OpenAI compatibility](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)
- [Zhipu OpenAI compatibility](https://docs.bigmodel.cn/cn/guide/develop/openai/introduction)
- [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs) and [tool calling](https://openrouter.ai/docs/guides/features/tool-calling)

These presets do not enable provider-hosted web search. The current harness exposes only local Zotero page reading; web search remains a separate, future capability with its own privacy and citation rules.
