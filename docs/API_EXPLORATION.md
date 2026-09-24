# API Route Exploration — 2026-09-23

## Result

A separate local application now connects to zotero-mcp over stdio, reads PDF text and runs a bounded paper-specific model/tool loop. The browser mirrors Zotero's collection hierarchy and item list, with search as a secondary route, plus source evidence, discussion, citations and editable local note drafts. It does not depend on Inkleaf or ChatGPT.

The first harness is an explicit, small state machine in `lib/harness.mjs`. LangGraph remains an option if future branching and scheduling justify it; adding a framework now would not replace the required domain checks.

## Dependency findings

- Selected upstream: [54yyyu/zotero-mcp](https://github.com/54yyyu/zotero-mcp), PyPI version 0.13.0. Reference source inspected at commit `62335504262f4239961c4e782e342bd3bab4d5b2`.
- The unbounded upstream dependency resolution initially installed FastMCP 4. The MCP connection failed in this combination. Pinning FastMCP to the tested 3.4.7 release established a successful connection with the JavaScript MCP SDK 1.30.1. This is an observed compatibility result, not a claim that all FastMCP 4 configurations fail.
- The adapter allowlists `zotero_get_collections`, `zotero_get_collection_items`, `zotero_get_recent`, `zotero_search_items`, `zotero_get_item_metadata`, and `zotero_read_pdf_pages`; other upstream tools are rejected. The model sees only a selected-paper `read_page` tool.
- Local mode does read through upstream's Zotero database access. Initial HTTP probing did not respond, but actual MCP search, metadata and PDF extraction succeeded. The application does not modify Zotero's database.

## Verified on this computer

- Connected to the installed upstream MCP process and discovered the required tools.
- Loaded 26 real Zotero collections, 50 recent items, and collection-specific items; search and direct item opening were also verified in the browser.
- Read a real paper's metadata and 4,133 characters from page 1 of a 13-page PDF. No model received that content in this verification.
- Twelve automated tests passed, including evidence-backed tool use, invalid citations/tools, paper scope, preparation recovery, cancellation, evidence versioning, Zotero projection, concurrent local saves, HTTP protections, note editing and provider retries.
- Browser demo verified a question that invokes a page-read tool, a clickable page-2 evidence citation, editable note acceptance, and persistence after reload.

The provider transport was exercised against a local HTTP fixture. A real external model has not yet been invoked, and live model quality/provider compatibility is not certified. The user supplies provider settings through the new application's Settings screen.

## State and recovery

Each selected paper has one local state file. A job changes from running to complete, failed or paused. Preparation checkpoints each page; restarting the server marks interrupted jobs paused. Retrying preparation skips the completed checkpoints. Saves to the same paper are serialized, and Windows sharing violations are retried before a safe copy fallback is used. Conversation failure leaves previous answers and accepted cards intact. Cancellation is checked again before committing a model result.

Study records contain summaries, evidence interpretation and unresolved questions; they are not hidden model reasoning. They are excluded from the public paper response. Reader cards can be edited and accepted separately. This preview keeps up to 30 study revisions and 20 revisions of each edited card.

Evidence snapshots preserve the page text actually used for an answer. Detected changes to a re-read page invalidate preparation, but the prototype does not yet fingerprint whole attachments or automatically detect every replacement. Complete version reconciliation is still required before production use across multiple libraries.

## Next implementation stages

1. Validate one real provider with a known paper, including a follow-up correction and private-memory revision.
2. Improve evidence retrieval beyond page navigation, with extraction-coverage reporting and attachment selection.
3. Add note publication with upstream capability detection, version checks and duplicate-write reconciliation.
4. Add external research and multimodal page inspection as independently enabled capabilities.
5. Build the separate ChatGPT bridge against the shared evidence/note contract.

The repository is published at [yuuuuuuu-rc/zotero-reader](https://github.com/yuuuuuuu-rc/zotero-reader). Dependencies, credentials and personal research data remain excluded from tracked files.
