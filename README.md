# CAP Skills

Reusable [Claude Code](https://docs.anthropic.com/en/docs/claude-code) slash-command skills for [SAP CAP](https://cap.cloud.sap/) (TypeScript) development.

Each skill is a `.md` file in `.claude/commands/` that Claude Code picks up as a `/slash-command`. Together they cover the full CAP feature lifecycle — from project bootstrap through BTP deployment.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed (`npm i -g @anthropic-ai/claude-code`)
- Node.js >= 18
- `@sap/cds-dk` >= 7 (`npm i -g @sap/cds-dk`)

## Installation

Clone this repo into your CAP project (or add it as a git submodule):

```bash
git clone <repo-url> .claude-cap-skills
cp -r .claude-cap-skills/.claude .
cp -r .claude-cap-skills/docs .
```

Or simply copy the `.claude/commands/` folder and `docs/` into your existing CAP project. The skills are active as soon as Claude Code finds them under `.claude/commands/`.

## Available Skills

| Command | Purpose |
|---------|---------|
| `/init-project <name>` | Bootstrap project structure — run once only |
| `/generate-entity <description>` | Define the data model |
| `/generate-service <name> exposing <entities>` | Expose entities as OData service |
| `/generate-handler <service> <logic>` | Add validation and business logic |
| `/generate-external-service <name> from <spec>` | Wire in an external OData or REST service |
| `/generate-mashup <entity> enriched with <facade>` | Enrich local entity with external fields |
| `/generate-annotations <entity>` | Add Fiori UI annotations |
| `/generate-tests <service>` | Write tests before marking done |
| `/review-cap <service>` | Review for clean core and security issues |
| `/generate-mta <app> with <services>` | Prepare BTP deployment descriptor |
| `/update-conventions <rule>` | Capture any new agreed patterns |

## Recommended Workflow

```
/init-project          →  /generate-entity  →  /generate-service
→  /generate-handler   →  /generate-tests   →  /review-cap
→  /generate-mta
```

Always run `/review-cap` before raising a PR or deploying to BTP.

## Project Structure

```
.claude/
  commands/         # Slash command skill files (*.md)
docs/
  conventions.md    # CAP TypeScript coding conventions
CLAUDE.md           # Instructions for Claude — read before every command
README.md           # This file
```

## Conventions

All generated code follows the rules in [`docs/conventions.md`](docs/conventions.md):

- TypeScript with `export default (srv: cds.ApplicationService)` handlers
- `cds.Request` typing on all hook parameters — no untyped `any`
- `cds.error()` for user-facing errors
- `@requires` and `@restrict` on every service
- `tsc --noEmit` required in CI

## Contributing a New Skill

1. Create a feature branch — never author skills directly on `main`
2. Add your skill to `.claude/commands/<skill-name>.md` with `## Role`, `## Purpose`, `## Input`, `## Steps`, and `## Output` sections
3. Use `$ARGUMENTS` for all user-supplied input
4. Test edge cases: empty input, mixed case, extra whitespace
5. If you agree a new pattern during the session, run `/update-conventions` to capture it
6. Commit the skill file alongside any related application code changes

Personal or experimental skills belong in `~/.claude/commands/` (local only, never committed).
