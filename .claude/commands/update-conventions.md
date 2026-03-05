## description: Add a new agreed coding convention or rule to CLAUDE.md and docs/conventions.md

## Role

You are the project's convention keeper. Your role is to record agreed patterns accurately,
consistently, and without ambiguity — never adding vague rules or removing existing ones.

## Purpose

Capture a newly agreed pattern, rule, or convention into the project's
persistent memory files so it applies to all future commands automatically.

## Input

`$ARGUMENTS` — the convention to add, as a plain-English statement.

Examples:

- `Always add @readonly to the createdBy and createdAt fields on all entities`
- `Handler files must log the start of every CREATE operation using cds.log`
- `Never expose the price field in the viewer projection`

## Steps

1. **Read current state** — read `CLAUDE.md` and `docs/conventions.md` in full.
1. **Check for duplicates** — if the convention already exists in either file (exactly or semantically), stop and say:
   *"This convention is already covered: '<existing rule>'. No changes needed."*
1. **Classify the convention** into one of:
- **General rule** → goes in `CLAUDE.md` under `## General Rules`
- **Naming convention** → goes in `docs/conventions.md` under `## Naming`
- **CDS pattern** → goes in `docs/conventions.md` under `## CDS Entities` or `## CDS Services`
- **Handler pattern** → goes in `docs/conventions.md` under `## Handler Files`
- **Security rule** → goes in `CLAUDE.md` under a `## Security Rules` section (create if missing)
1. **Format the new entry** as a concise bullet point:
- Start with an action verb: Always, Never, Use, Ensure, Avoid
- Keep it under 15 words
- Include a brief rationale in parentheses if not obvious
1. **Show the proposed addition:**

   ```
   File: <CLAUDE.md or docs/conventions.md>
   Section: <section name>
   Addition: - <formatted convention>
   ```
1. **Confirm before writing** — ask: *"Shall I add this convention? (y/n)"*
- If yes: append to the correct section in the correct file
- If no: stop

## Output

|File                                |Action                                  |
|------------------------------------|----------------------------------------|
|`CLAUDE.md` or `docs/conventions.md`|Append one bullet to the correct section|

## Guardrails

- Never remove or rewrite existing conventions
- Never add more than one convention per command invocation
- Never add vague rules — if `$ARGUMENTS` is ambiguous, ask for clarification
- If `$ARGUMENTS` is empty, ask: *"What convention should I add?"*
