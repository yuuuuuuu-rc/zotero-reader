# Zotero Research Companion (working title)

Status: working API-route exploration, version 0.1.0. The user selected zotero-mcp as the foundation on 2026-09-23.

This project is separate from Inkleaf. It will have its own repository, configuration, storage and launch entry. The user will supply the GitHub repository URL later; no remote has been configured and nothing has been published from this folder.

See [architecture and reuse decision](docs/ARCHITECTURE_AND_REUSE.md) and [exploration results](docs/API_EXPLORATION.md).

## Start on Windows

Requirements: Node.js 22 or newer, [uv](https://docs.astral.sh/uv/), and Zotero with a local library. Setup uses an isolated Python environment inside this project. It does not install plugins into Zotero.

1. On a new computer, run `setup-windows.cmd` once. Dependencies are already installed on the development computer.
2. Run `start-windows.cmd`, or `npm start`.
3. Open **Settings**, enter your OpenAI-compatible base URL, a tool-capable model name and API key.
4. Search for a Zotero paper by title or author, then select **Read <item key>**. You can also paste an eight-character item key.
5. Read source pages and ask a question. Click page citations to inspect the exact extracted evidence used by the answer.
6. Review **Note cards**, edit a draft and choose **Accept / save edits**. Cards are currently saved locally, not published to Zotero.

API workspace: <http://127.0.0.1:43140>.

For Gemini, use `https://generativelanguage.googleapis.com/v1beta/openai` and a model name available to your account. No model is selected automatically. The provider must support Chat Completions function calling and return the requested JSON answer shape. Other provider-specific features are not implied by endpoint compatibility.

Opening and selecting source text does not call the model. **Discuss with AI** sends the current evidence, selected reader cards, recent discussion and private study summary to the configured provider. **Prepare paper** sends available PDF text page by page and can incur many requests. **Pause** stops further model work; clicking **Prepare paper** again resumes completed checkpoints. API failures appear in the progress area.

## Try without credentials

Run `demo-windows.cmd` or `npm run demo`, then open <http://127.0.0.1:43141>. A three-page synthetic paper and scripted provider demonstrate the real tool loop, source citations, note editing and preparation. It is clearly labeled **SCRIPTED DEMO**; its responses are not AI-generated. Demo data and live data are separate.

## What the harness currently enforces

- Only three upstream MCP read tools are available to the application. The model gets one tool: read a numbered page of the selected paper.
- Maximum five model steps per question, three page calls per step, request timeout and bounded transient-error retries.
- Evidence IDs derived from the returned page text; invented or missing IDs reject the response. This validates provenance, not the truth of an interpretation.
- Atomic local saves, per-paper task exclusion, cancellation checks and page-by-page preparation checkpoints.
- Separate reader cards and private AI study records with revision history; private records are omitted from browser API responses.

## Local data

On Windows, live data is in `%LOCALAPPDATA%\ZoteroResearch\live`; demo data is in `%LOCALAPPDATA%\ZoteroResearch\demo`.

- `settings.json`: provider endpoint, model and API key; not inside Git. This preview stores the key in a local file, not an encrypted credential vault.
- `papers/<item-key>.json`: cached evidence, conversations, cards, preparation progress and private study revisions. Back up this directory for your research work.

Private study records are hidden from the interface, not encrypted from the computer owner. Do not publish these data directories. Set `ZR_DATA_DIR` to override the storage location, `ZR_PORT` to choose a port, or `ZR_ZOTERO_DB_PATH` if upstream discovery cannot locate a custom Zotero database. The preview assumes one personal Zotero library; switching databases requires a separate data directory.

## Verification

```powershell
npm test
npm run check:zotero
node scripts/check-zotero.mjs --search "a title keyword"
```

The last command checks live search, metadata and the first PDF page without calling a model. No Zotero writes are exposed.

## Current boundaries

This is an exploration of API orchestration, not the full proposed product. It shows extracted PDF text rather than a graphical PDF viewer. Preparation supports up to 200 pages and up to 18,000 characters of evidence per page; scans, formula layout and figures are not interpreted. Upstream may choose the primary PDF when a parent reference has multiple attachments; open a specific attachment key when necessary.

Zotero note publication, group-library identity, full attachment-version reconciliation, external web search, graphical sticky-note layout, and ChatGPT connection are not implemented. ChatGPT is reserved for a separate mode and is not a dependency of this one. A real paid model response has not been verified during development; tests use a mock HTTP provider and the scripted demo.
