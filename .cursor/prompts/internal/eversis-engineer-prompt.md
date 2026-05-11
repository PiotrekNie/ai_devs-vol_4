---
sidebar_position: 11
title: "Engineer prompt"
slug: engineer-prompt
prompt_role: "Prompt engineer"
prompt_description: "Design, optimize, audit, or review LLM application prompts for quality, security, and consistency."
upstream_agent: "eversis-prompt-engineer"
---
# eversis-engineer-prompt

:::info
Not invoked directly by users. To trigger prompt engineering, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [Prompt Engineer](../../agents/prompt-engineer).
:::

**Agent:** Prompt Engineer  
**File:** `.cursor/prompts/internal/eversis-engineer-prompt.md`

Designs, optimizes, audits, or reviews LLM application prompts for quality, security, and consistency.

## How It's Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies LLM prompt tasks in the plan and delegates them to the Prompt Engineer automatically.

## What It Does

### 1. Context Gathering

- Reads the provided prompt(s) or requirements.
- Identifies the LLM provider, model, and use case.
- Discovers existing prompt patterns and conventions in the project via `eversis-technical-context-discovering`.

### 2. Analysis

- Identifies issues — vague instructions, missing output format, injection vulnerabilities, no delimiter separation.
- Checks against anti-patterns from the `eversis-engineering-prompts` skill.

### 3. Optimization or Creation

- Applies prompt structure patterns from `eversis-engineering-prompts`.
- Adds constraints, output format specification, and security layers.
- Uses delimiter separation between system instructions and user input.

### 4. Security Check

- Verifies prompt injection defenses — delimiter separation, input sanitization guidance, output validation.
- Flags any missing security layers.

## Skills Loaded

- `eversis-engineering-prompts` — Prompt structure patterns, optimization techniques, security patterns, templates, evaluation approaches, and anti-patterns.
- `eversis-technical-context-discovering` — Project conventions and existing prompt patterns.

## Output

Each deliverable includes (sections omitted when not applicable):

1. **Tech Stack** — LLM provider, model, temperature, relevant framework.
2. **Prompt Template** — Complete prompt with system prompt, context/input sections, and output format specification.
3. **Integration Example** — Non-production example showing how to use the prompt (LangChain, OpenAI SDK, Anthropic SDK, etc.). Focuses on integration guidance — full application logic is left to the Software Engineer.
4. **Security Assessment** — For audits: vulnerability table with severity, CWE, location, impact, and fix. For creation/optimization: summary of security measures applied (three-layer defense).

---

## Executable prompt (attach in Cursor)

Your goal is to design, optimize, audit, or review LLM application prompts (system prompts, user prompt templates, RAG templates, agent instructions, classification prompts) for quality, security, and consistency.

## Required Skills

Before starting, load and follow these skills:
- `eversis-engineering-prompts` - for prompt structure patterns, optimization techniques, security patterns, templates, evaluation approaches, and anti-patterns
- `eversis-technical-context-discovering` - to understand the project's existing prompt patterns and conventions

## Workflow

1. **Gather context**: Read the provided prompt(s) or requirements. If a file is referenced, read it. Understand the LLM provider, model, and use case.
2. **Analyze**: Identify issues — vague instructions, missing output format, injection vulnerabilities, no delimiter separation, anti-patterns from the skill's anti-pattern table.
3. **Optimize or create**: Apply the relevant patterns from `eversis-engineering-prompts` — improve structure, add constraints, specify output format, add security layers.
4. **Security check**: Verify prompt injection defenses are in place — delimiter separation, input sanitization guidance, output validation. Flag any missing security layers.
5. **Return result**: Structure your deliverable using the output format below.

## Output Format

Structure every deliverable with these sections (omit sections that don't apply to the task type):

1. **Tech Stack** — LLM provider, model, temperature, relevant framework (if known)
2. **Prompt Template** — The complete prompt with system prompt, context/input sections, and output format specification. Use clear delimiters between sections.
**Integration Example** — Non-production example snippet or pseudocode showing how to use the prompt (e.g. with LangChain, OpenAI SDK, Anthropic SDK). Focus on integration guidance: expected inputs/outputs, where to plug in context formatting, input sanitization, and output validation. Leave full application logic and production-hardening to Software engineer.
4. **Security Assessment** — For audits: vulnerability table with severity, CWE, location, impact, and fix. For creation/optimization: summary of security measures applied (three-layer defense).
5. **Design Decisions** — Brief rationale for key architectural choices (delimiter strategy, temperature, few-shot vs zero-shot, output format, etc.).

<!-- Eversis port; upstream: eversis-engineer-prompt -->
