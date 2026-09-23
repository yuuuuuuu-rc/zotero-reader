# Independent Zotero Research Companion: Two Execution Modes

Date: 2026-09-23. Status: the user selected zotero-mcp and authorized API-route exploration. The original proposal below remains the target; see [exploration results](API_EXPLORATION.md) for what is actually implemented.

## Product boundary

Build an independent project, not an Inkleaf extension. Retain the agreed interaction goals: source-linked explanations, questions and evidence cards, whole-paper preparation, private editable AI study records, and deliberate publication of accepted notes to Zotero. Existing Inkleaf documents are background design references, not a runtime dependency or the destination repository.

The two modes below must each be installable, configurable and usable without the other. Shared evidence and note formats are allowed; neither mode should silently fall back to the other's credentials or inference service.

## Reuse gate

GitHub research found relevant existing projects. The reuse gate was resolved by the user's choice of zotero-mcp. API-mode exploration is authorized; ChatGPT integration remains a separate future step.

Findings below are repository/documentation review, not installation testing or a security audit. License identifiers were checked against GitHub metadata; dependency licenses and the exact selected revision still require review before incorporating code.

| Candidate | Documented fit | Missing or uncertain for this project | Proposed role |
|---|---|---|---|
| [54yyyu/zotero-mcp](https://github.com/54yyyu/zotero-mcp) — MIT | Zotero search, paper reading, annotations and writes; MCP clients including ChatGPT | Not our complete reading UI or persistent research harness. Current README says local reads use Zotero's SQLite database, so compatibility and data access need evaluation | Primary candidate for a shared Zotero tool adapter |
| [tomozzz/Zotero-Research-MCP](https://github.com/tomozzz/Zotero-Research-MCP) — AGPL-3.0 | Windows-oriented ChatGPT bridge, local PDF index and bounded page evidence through Secure MCP Tunnel | Read-only; no Zotero note publication. Requires suitable ChatGPT/workspace and tunnel access | Try directly for ChatGPT reading, or evaluate a fork for that mode |
| [jlegewie/beaver-zotero](https://github.com/jlegewie/beaver-zotero) — AGPL-3.0 | Zotero-native assistant with source citations, annotation, notes, research tools and bring-your-own-key use | Product includes backend/account service dependencies; a buildable plugin repository does not establish a fully self-hostable agent backend. Not the requested independent app form | Evaluate as an existing product before duplicating its interaction |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) — MIT | Stateful execution, persistence, resumable workflows and human intervention | General infrastructure, not a Zotero assistant or evidence-quality guarantee | Optional foundation for the API-mode harness |

The selected approach is component reuse: zotero-mcp supplies access, while this project implements the research-specific harness and interaction.

## Mode A: API-driven research harness

The application calls a configured provider using its own API credentials. It owns the conversation, progress, selected-paper scope and tool loop. Gemini or another provider can be supported through an adapter, subject to actual tool-calling capabilities.

Here, harness means the executable machinery surrounding the model: state, allowed tools, evidence assembly, controlled writes, memory and recovery. Prompts describe research behavior; the harness enforces operating boundaries.

Proposed turn sequence:

1. Resolve the selected paper, attachment fingerprint, question and reading goal.
2. Retrieve source passages, relevant reader cards and a bounded private study summary.
3. Let the model request permitted tools within a step, time and token budget.
4. Validate tool arguments and scope before execution; return structured evidence IDs.
5. Assemble an answer and check that cited IDs resolve to actual evidence. This checks traceability, not whether every interpretation is true.
6. Save the answer and update private AI study notes with revisions. Stage reader-facing note changes as proposals.
7. Publish accepted note changes through an idempotent, version-checked Zotero operation.

Suggested state: paper/attachment identity, scope, goal, evidence IDs, current question, study-memory revision, pending note proposals, job status, token usage and checkpoints. Store recoverable progress locally. Raw hidden model reasoning is not part of the state.

Start with a small tool set: find papers, read passages, inspect a page region when supported, read reader notes, update private study records, propose a card, search the web when enabled, and publish an accepted note. Tool-side rules enforce selected-library scope and write boundaries even if the model asks otherwise.

Preserve completed preparation sections after a timeout. Retry transient inference failures within a limit; reconcile an ambiguous external write before retrying. Serialize conflicting note edits. A cancelled run must not continue publishing in the background.

Use deterministic checks for evidence IDs and schemas, and realistic evaluation cases for interpretation quality. Important cases include fabricated page citations, missing tables, contradictory passages, cancelled writes, changed attachments and concurrent edits. LangGraph could supply persistence and interruption mechanics, while these domain rules remain ours. [Framework repository](https://github.com/langchain-ai/langgraph).

## Mode B: Continue in ChatGPT

ChatGPT owns inference and the chat interface. Our component supplies Zotero evidence and optional bounded note actions. This mode must not require the API-mode provider key or run that harness's inference jobs.

Two integration levels are distinct:

**Conversation handoff:** prepare a compact context package with paper identity, selected quotation, source location, reading goal and the user's question. A button opens ChatGPT and offers copying/exporting the package. This is a useful standalone baseline, but is not live access to Zotero and cannot automatically capture all replies or keep AI study records updated.

**Connected conversation:** expose the relevant capabilities through MCP so ChatGPT can retrieve passages during the conversation. Official documentation describes developer-mode connections through HTTPS or Secure MCP Tunnel, with availability dependent on account/workspace policy. Validate the user's access before selecting this as the required path. [Official connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).

Opening ChatGPT, creating a conversation with an attachment, automatically submitting a prompt, and receiving every reply back in the local application are different capabilities. The reviewed documentation does not establish a general external-app API guaranteeing all of them. Do not promise a silent one-click upload/chat/sync workflow or rely on an undocumented URL parameter as the core design.

A connected ChatGPT component can provide follow-up messages through the documented MCP Apps UI bridge. That is an in-ChatGPT interaction, not proof that an arbitrary local app can create and control a ChatGPT conversation. [Official UI integration guide](https://developers.openai.com/plugins/build/chatgpt-ui).

For connected note editing, offer explicit tools to retrieve study context, stage a note proposal and publish an accepted revision. Enforce data scope and revisions server-side. Do not promise an automatic memory-update hook after every ChatGPT answer: the host controls orchestration. A visible **Save discussion outcome** action is the reliable user-facing contract unless a supported automatic lifecycle can be demonstrated.

ChatGPT access and provider API access are configured independently. Any optional embedding, OCR or search service must disclose its own credentials and usage; it must not silently introduce an API-mode dependency into the ChatGPT path.

## Shared core and independent operation

| Concern | API mode | ChatGPT mode |
|---|---|---|
| Inference | Configured model API | ChatGPT host |
| Agent loop | Our harness | ChatGPT host orchestration |
| Zotero access | Shared adapter called by harness | Shared adapter exposed through MCP |
| Study-memory changes | Controlled post-answer step | Explicit tool/action; no guaranteed turn hook |
| Conversation storage | Local application | ChatGPT; only explicitly saved outcomes return locally |
| Write enforcement | Shared note service | Same note service behind MCP |
| Failure isolation | Works without ChatGPT connection | Works without API credentials |

The common core contains document identities, evidence anchors, storage, note revision handling and Zotero access. It has no dependency on a particular model. Namespace mode-specific conversations and private memory; accepted reader notes may be shared with revision checks. Switching modes transfers only an explicit context package, not an assumed full session history.

## Next decision

Validate API-mode research behavior with the user's chosen provider, then expand the note-publication path. The future GitHub URL is needed for publication, not for local exploration.

The original design review executed no software. The subsequent API exploration installs the selected MCP dependency in an isolated environment and runs read-only local checks. No tunnel, paid model call or Zotero write has been performed.
