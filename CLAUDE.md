# CLAUDE.md — CAP Skills Project

## Project Purpose

This project contains reusable `.claude/commands/` skill files for SAP CAP (Node.js) development.
Each skill is a markdown command file invoked via slash commands in Claude Code.

## Project Structure

```
.claude/
  commands/         # Slash command skill files (*.md)
docs/
  conventions.md    # CAP coding conventions reference
CLAUDE.md           # This file — always read before executing any command
```

## General Rules (apply to ALL commands)

- Always read CLAUDE.md before proceeding with any task
- Never hardcode credentials, tokens, or client secrets in any output
- Never read `.env` or `default-env.json` files
- Use only CAP TypeScript patterns (ESM import/export default, .ts files) — no plain Express handlers
- Follow the naming conventions defined in docs/conventions.md
- Ask one clarifying question if input is ambiguous — do not guess
- Show a diff and ask for confirmation before modifying existing files
- Stop and explain if a required file or context is missing

## Suggested Workflow

Follow this order when building a new feature or service:

|Step|Command                                                 |Purpose                                    |
|----|--------------------------------------------------------|-------------------------------------------|
|1   |`/init-project <name>`                                  |Bootstrap project structure — run once only|
|2   |`/generate-entity <description>`                        |Define the data model                      |
|3   |`/generate-service <name> exposing <entities>`          |Expose entities as OData service           |
|4   |`/generate-handler <service> <logic>`                   |Add validation and business logic          |
|4a  |`/generate-external-service <name> from <spec>`         |Wire in an external OData or REST service  |
|4b  |`/generate-mashup <entity> enriched with <façade>`      |Enrich local entity with external fields   |
|5   |`/generate-annotations <entity>`                        |Add Fiori UI annotations                   |
|6   |`/generate-tests <service>`                             |Write tests before marking done            |
|7   |`/review-cap <service>`                                 |Review for clean core and security issues  |
|8   |`/generate-mta <app> with <services>`                   |Prepare BTP deployment descriptor          |
|9   |`/update-conventions <rule>`                            |Capture any new agreed patterns            |


> Always run `/review-cap` before raising a PR or deploying to BTP.

## Skill File Conventions

- Each command file must have a `## Role`, `## Purpose`, `## Input`, `## Steps`, and `## Output` section
- Use `$ARGUMENTS` for all user-supplied input — never hardcode entity or service names
- Keep each command single-responsibility
- Reference this CLAUDE.md at the start of every command execution
- Chain to the next workflow step at the end of `## Output` (e.g., *"Run `/generate-handler` next"*)
- Inject external specs by checking them into `docs/` and referencing them with `@docs/<spec-file>.md` in the prompt
- Personal / experimental skills belong in `~/.claude/commands/` (local only, never committed)
- Team-shared skills belong in `.claude/commands/` in the repository and must be committed alongside application code

## Skill Authoring & Iteration

- Always test a new skill on a throwaway branch first — never run destructive skills on `main`
- Test edge-case `$ARGUMENTS` values: empty input, mixed case, extra whitespace, very long strings
- Refine the `## description` field until the skill appears correctly in the slash command picker
- After agreeing a new pattern during a session, immediately capture it with `/update-conventions`
