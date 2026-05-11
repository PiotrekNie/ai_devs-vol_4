---
sidebar_position: 10
title: "Analyze materials"
slug: analyze-materials
prompt_role: "Business analyst"
prompt_description: "Process discovery workshop materials and create Jira-ready epics and user stories, or iterate on an existing Jira backlog."
upstream_agent: "eversis-business-analyst"
---
# eversis-analyze-materials

**Agent:** Business Analyst  
**File:** `.cursor/prompts/public/eversis-analyze-materials.md`

Processes discovery workshop materials and converts them into structured, Jira-ready epics and user stories. Can also import an existing Jira backlog for local iteration.

## Usage

```text
@eversis-analyze-materials
<workshop materials or Jira project key>
```

In **Cursor**, attach the file above (or open it and reference it with `@`) plus your ticket text and context.

## What It Does

### Standard Workflow (workshop materials provided)

1. **Process transcript** — Cleans raw transcript using the `eversis-transcript-processing` skill. Removes small talk, structures content by topics, extracts decisions and action items.
2. **Analyze additional materials** — Reviews Figma designs (via Figma MCP), existing codebase (via `eversis-codebase-analysing`), and other reference documents.
3. **Extract tasks** — Identifies epics and user stories from all processed materials using the `eversis-task-extracting` skill.
4. **Gate 1 — Task Review** — Presents extracted tasks for user validation. Iterates until approved.
5. **Quality review** — Runs analysis passes against the approved task list to find gaps, missing edge cases, and improvements.
6. **Gate 1.5 — Suggestion Review** — Presents quality review suggestions individually for accept/reject.
7. **Format for Jira** — Applies the benchmark template to all tasks using the `eversis-jira-task-formatting` skill.
8. **Gate 2 — Push Approval** — Presents final formatted tasks for user review before Jira push.
9. **Push to Jira** — Creates epics and stories in Jira with proper linking. Reports created issue keys.

### Import Mode (Jira project key provided)

When the user provides existing Jira issue keys or a project key instead of workshop materials, the agent skips transcript processing and task extraction. It fetches existing tasks from Jira, converts them into the local format, then proceeds to quality review and formatting.

## Skills Loaded

- `eversis-transcript-processing` — Clean and structure raw transcripts.
- `eversis-task-extracting` — Identify epics and user stories from materials.
- `eversis-task-quality-reviewing` — Analyze tasks for gaps and improvements.
- `eversis-jira-task-formatting` — Format tasks for Jira and manage push.
- `eversis-codebase-analysing` — Understand existing codebase when relevant.

## Output

A set of markdown files placed in `specifications/<workshop-name>/`:

```text
specifications/
  user-onboarding/
    cleaned-transcript.md       ← structured transcript
    extracted-tasks.md          ← epics and stories (updated after quality review)
    quality-review.md           ← quality review report
    jira-tasks.md               ← final Jira-ready tasks
```

## Input Flexibility

The command accepts various input types:

| Input | Behavior |
|---|---|
| Raw transcript text | Runs full workflow starting from transcript processing |
| Structured notes | Skips transcript processing, starts from task extraction |
| Figma links | Analyzes designs for functional requirements |
| Jira project key | Imports existing backlog for local iteration |
| Combination | Processes all available materials together |

:::tip
The three review gates are mandatory. No data is pushed to Jira without your explicit approval at each gate. Review each output carefully — the agent produces business-oriented tasks that stakeholders should be able to understand without technical knowledge.
:::

---

## Executable prompt (attach in Cursor)

Analyze the provided workshop materials (transcripts, Figma designs, PDF documents, codebase context, or other reference documents) and convert them into structured, Jira-ready epics and user stories. Alternatively, import an existing Jira backlog for local iteration and improvement.

The file outcomes should be markdown files placed in `docs/specs/` (or your team's `specifications/` folder) under a folder named after the workshop topic in kebab-case format (e.g., `specifications/user-onboarding/`):
- `cleaned-transcript.md` — Cleaned and structured transcript
- `extracted-tasks.md` — Extracted epics and stories (updated after quality review)
- `quality-review.md` — Quality review report with all suggestions and decisions
- `jira-tasks.md` — Final Jira-ready tasks

## Required Skills

Before starting, load and follow these skills in order:
- `eversis-transcript-processing` - for cleaning and structuring raw transcripts
- `eversis-task-extracting` - for identifying epics and user stories from all materials
- `eversis-task-quality-reviewing` - for analyzing extracted tasks for gaps, edge cases, and improvements
- `eversis-jira-task-formatting` - for formatting tasks per the benchmark template and managing Jira push
- `eversis-codebase-analysing` - for understanding the existing codebase when relevant

## Workflow

Determine the entry point based on what the user provides:

**If the user provides existing Jira issue keys or a project key instead of workshop materials**, skip transcript processing and task extraction. Use the `eversis-jira-task-formatting` **Import Mode** to fetch and convert existing tasks into `jira-tasks.md`. Then proceed to quality review (Step 5) and formatting.

**Standard workflow (workshop materials provided):**

1. **Process transcript**: If a raw transcript is provided, clean it using the `eversis-transcript-processing` skill. Remove small talk, structure by topics, extract decisions and action items. Save as `cleaned-transcript.md`.
2. **Analyze additional materials**: Review Figma designs (using `figma` tool), read PDF documents (using `pdf-reader` tool), existing codebase (using `eversis-codebase-analysing` skill), and any other reference documents provided.
3. **Extract tasks**: Using the `eversis-task-extracting` skill, identify epics and user stories from all processed materials. Save as `extracted-tasks.md`.
4. **Review Gate 1**: Present the extracted task list to the user for validation. Ask if any tasks were missed, should be split, merged, or removed. Iterate until the user approves.
5. **Quality review**: Using the `eversis-task-quality-reviewing` skill, run all analysis passes against the approved task list. Build the domain model, identify gaps, and produce structured suggestions. This step runs automatically after Gate 1 approval — do not ask the user whether to run it.
6. **Review Gate 1.5**: Present all quality review suggestions to the user, grouped by epic and ordered by confidence. The user accepts or rejects each suggestion individually. Apply accepted suggestions to `extracted-tasks.md` and save the quality review report as `quality-review.md`.
7. **Confirm updated tasks**: After applying accepted suggestions, briefly summarize the changes made to `extracted-tasks.md` (new stories added, criteria added, stories modified). If the user wants to review the full updated task list, present it. Proceed when the user confirms.
8. **Format for Jira**: Using the `eversis-jira-task-formatting` skill, apply the benchmark template to format all tasks for Jira. Save as `jira-tasks.md`.
9. **Review Gate 2**: Present the final formatted tasks to the user. Confirm the target Jira project and get explicit approval before pushing.
10. **Push to Jira**: Create or update issues in Jira. For new tasks (no Jira key), create epics first, then stories linked to their parent epics. For tasks with existing Jira keys, update the corresponding issues. Present a sync summary before pushing. Report created/updated issue keys back to the user.

## Important

- Output must be **business-oriented** — no technical implementation details beyond what was explicitly discussed in the workshop.
- Use `Ask the user in chat` proactively whenever confidence is low about scope, priority, or intent.
- Both review gates are mandatory — no data is pushed to Jira without explicit user approval.
- The quality review step (Gate 1.5) runs automatically after Gate 1 approval. The user reviews and accepts/rejects individual suggestions, but does not need to opt-in to the review itself.
- When working with imported Jira tasks, the quality review step still applies — it can identify gaps in existing backlogs just as with newly extracted tasks.
- After import or initial creation, individual task changes trigger a "Push to Jira now?" prompt. Batch pushes follow the standard Gate 2 approval.
- If no transcript is provided (e.g., user provides structured notes or direct requirements), skip the transcript processing step and proceed directly to task extraction.

Follow the template structures and naming conventions from each skill strictly to ensure clarity and consistency.

<!-- Eversis port; upstream: eversis-analyze-materials -->
