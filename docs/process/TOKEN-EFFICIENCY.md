# Token & context efficiency (detail)

> Short always-on rules live in `.cursor/rules/token-efficiency.mdc`.  
> This file is the longer reference — `@` it only when needed.

## The two percentages

| UI | What it measures | Resets / fills when |
| --- | --- | --- |
| **Under the chat input** (e.g. “9% of 256k”) | How full **this chat’s model context window** is (history, rules, @files, tool outputs, images) | Grows as the **conversation** grows; new chat ≈ empty context |
| **Settings → usage** (e.g. “1% Cursor models”) | How much of your **Pro plan included usage** you’ve spent this billing period | Grows with **billable model usage** across all chats; resets on billing cycle |

So seeing **9% context** and **1% plan** at once is normal: you can burn a fat chat window while barely touching monthly quota — or the opposite (many short Agent runs with tools).

### Why context climbs fast

Every Agent turn typically resends: system/rules + prior messages + tool results. Large `@codebase` / MCP payloads / long handoffs compound this. High context % also **hurts answer quality** and can increase **plan** cost because each turn ships more input tokens.

### Why plan usage climbs

- Agent mode with many tool calls = many model invocations
- Long context on each of those calls
- Heavier models cost more against included usage than lighter ones
- Subagents (if used) multiply calls

## Maximize efficiency (checklist)

### Chat hygiene

1. **One concern per chat** (e.g. “provider availability API”, not “whole MVP”).
2. When input context is ~50%+ or the topic shifts → **New Chat**.
3. Point the new chat at `docs/CURSOR-BRIEF.md` + latest `SESSION-HANDOFF.md` instead of scrolling old threads.
4. Don’t paste the PRD into every prompt; link section headings.

### What you attach

5. `@file` beats pasting; `@` only files that matter for _this_ task.
6. Avoid `@Folders` / blanket codebase unless searching for something unknown.
7. Don’t attach huge logs or generated bundles.

### Rules & MCP

8. Keep **alwaysApply** rules tiny (ours are intentional). Long guides → `docs/`.
9. Disable unused **MCP** servers; their schemas can sit in context.
10. Prefer glob-scoped rules (`frontend.mdc`, `backend.mdc`) once the app exists, not everything always-on.

### Model & mode

11. Use **Ask / plan** for questions; **Agent** only when you want edits/commands.
12. Use a capable model for hard design; a cheaper/faster model for routine edits when quality allows.
13. Decline “explore the whole repo” when you already know the path.

### Project discipline (this repo)

14. Decisions live in `docs/DECISIONS.md` — don’t re-argue in chat.
15. Update `SESSION-HANDOFF.md` so continuity doesn’t depend on a 100-message thread.
16. Implement against **user stories / slices**, not open-ended “improve the app”.

## What we will not do by default

- Re-explain token metering unless you ask
- Re-read the entire docs tree at session start
- Expand scope beyond the stated slice
- Run parallel speculative investigations
