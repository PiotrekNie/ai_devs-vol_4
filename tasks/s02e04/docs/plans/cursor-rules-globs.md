# Plan: Globs in `.cursor/rules/*.mdc`

## Scope

- **Canonical plan in the repository:** the same plan content maintained in [`docs/plans/cursor-rules-globs.md`](cursor-rules-globs.md) (Markdown for humans and PRs). The copy in `.cursor/plans/` does not replace the repo file for review / change history.
- Normalise `globs` in [`.cursor/rules/eversis-accessibility.mdc`](../../.cursor/rules/eversis-accessibility.mdc) (after verifying the format in Cursor).
- **Documentation:** brief explanation — `alwaysApply: true` (no globs), file-scoped rules (YAML list `globs`), prompt-attached rules (empty `globs`, attach with `@`) — in [`documentation/cursor-collection.md`](../../documentation/cursor-collection.md) and/or the skills [`eversis-creating-agents`](../../.cursor/skills/eversis-creating-agents/SKILL.md) / [`eversis-creating-instructions`](../../.cursor/skills/eversis-creating-instructions/SKILL.md), without artificial duplication.
- **[`README.md`](../../README.md):** concise update — mention of `.mdc` frontmatter consistent with the framework doc.
- **[`CHANGELOG.md`](../../CHANGELOG.md):** *Added* / *Changed* entries under the deployment date + mirrored to [`website/src/pages/changelog.md`](../../website/src/pages/changelog.md).
- **Website:** after changing [`documentation/cursor-collection.md`](../../documentation/cursor-collection.md) — `npm run build` in `website/` and commit [`website/docs/framework-reference.md`](../../website/docs/framework-reference.md).

## Assessment of the original suggestion

- **Diagnosis (empty globs + Composer):** partially correct. For rules with `alwaysApply: false` Cursor can select context via `description`; explicit `globs` increase the predictability of auto-attachment. `globs: []` alone does not "break" anything — it means "do not bind this rule to any file pattern".
- **`eversis-project-stack.mdc`:** no need to add `globs` — the file has `alwaysApply: true`, the rule is always active.
- **Proposed `/*.{tsx,jsx,html}`:** needs correction — the missing `**/` limits matching to files at the repo root; the correct pattern is `**/*.{tsx,jsx,html}`.
- **`eversis-accessibility.mdc`:** globs already existed as a single comma-separated string. Normalised to a YAML list following the [`scoped-conventions.template.md`](../../.cursor/skills/eversis-creating-instructions/assets/scoped-conventions.template.md) template.

## Status of remaining rules

| File | Frontmatter | Note |
|------|-------------|------|
| `eversis-agent-core.mdc`, `eversis-testing-and-terminal.mdc`, `eversis-project-stack.mdc` | `alwaysApply: true` | No change — `globs` not needed. |
| `eversis-engineering-manager.mdc`, `eversis-code-reviewer.mdc` | `globs: []`, `alwaysApply: false` | Intentional — rules attached on demand via `@eversis-implement` / `@eversis-review`. Adding globs to e.g. `.tsx` would change their semantics. |

## Implementation steps

1. Create `docs/plans/cursor-rules-globs.md` + `docs/plans/README.md`.
2. Verify in Cursor: YAML list vs comma-separated string for `globs` in `.mdc`; choose the **list** (per template).
3. Update `eversis-accessibility.mdc`: `globs` as a YAML list, recursive patterns `**/...`, keep `.vue`/`.svelte`.
4. Add guidance on `alwaysApply` vs `globs` list vs empty `globs + @` in `documentation/cursor-collection.md` and/or the skills.
5. Update `README.md` — mention / link to the plan.
6. Add entries in `CHANGELOG.md` + mirror to `website/src/pages/changelog.md`.
7. `npm run build` in `website/` as the quality gate; mandatory after changing `cursor-collection.md`.

## Risks

- Adding `globs` to **all** rules with `alwaysApply: false` may unintentionally activate heavy instructions (e.g. review) on every edit of matching files.
- Brace expansion in `globs` — confirm with a single test in the current Cursor version; when in doubt, use an explicit list of patterns.
