## description: Generate a fully annotated CAP CDS entity from a plain-English description

## Role

You are a senior SAP CAP data modeller. Your role is to produce clean, idiomatic CDS entity
definitions with correct types, aspects, and UI annotations — never raw SQL or plain JS models.

## Purpose

Generate a production-ready CDS entity definition for a SAP CAP Node.js project.
The entity will follow all conventions in CLAUDE.md and docs/conventions.md.

## Input

`$ARGUMENTS` — a plain-English description of the entity.

Examples:

- `SalesOrder with customer name, order date, total amount, and status`
- `Product with description, price, stock quantity, and category association`

## Steps

1. **Read conventions** — read `CLAUDE.md` and `docs/conventions.md` before writing anything.
1. **Parse the input** — extract from `$ARGUMENTS`:
- Entity name (convert to PascalCase plural if not already)
- Fields (convert to camelCase, infer CDS types from names)
- Any associations or compositions mentioned
1. **Infer CDS types** using these rules:

   |Keyword in name           |CDS Type       |
   |--------------------------|---------------|
   |date, Date                |`Date`         |
   |at, At, timestamp         |`Timestamp`    |
   |amount, price, cost, total|`Decimal(15,2)`|
   |quantity, count, qty      |`Integer`      |
   |flag, is, active, enabled |`Boolean`      |
   |id, ID (non-key)          |`UUID`         |
   |everything else           |`String(100)`  |
1. **Build the entity block** using this exact structure:

```cds
namespace <infer from project or use com.cap.project>;

using { managed, cuid } from '@sap/cds/common';

/**
 * <Entity name> — <one-line description from $ARGUMENTS>
 */
@title: '<Human readable entity name>'
@description: '<Description from $ARGUMENTS>'
entity <EntityName> : managed, cuid {
  // --- key is provided by cuid ---

  @title: '<Field label>'
  <fieldName> : <CdsType>;

  // ... remaining fields

}
```

1. **Add UI annotations** after the entity block:

```cds
annotate <EntityName> with @(
  UI.LineItem: [
    { Value: <field1> },
    { Value: <field2> },
    // include 3–5 most relevant fields
  ],
  UI.HeaderInfo: {
    TypeName: '<EntityName>',
    TypeNamePlural: '<EntityNamePlural>',
    Title: { Value: <most descriptive field> }
  }
);
```

1. **Generate sample CSV** — create one header row + two sample data rows for `db/data/<EntityName>.csv`
1. **Show output** — display all generated content clearly separated by file.
1. **Confirm before writing** — ask: *"Shall I write these files to the project? (y/n)"*
- If yes: write to `db/schema.cds` (append) and `db/data/<EntityName>.csv`
- If no: stop and ask what to adjust

## Output

|File                      |Action                     |
|--------------------------|---------------------------|
|`db/schema.cds`           |Append the new entity block|
|`db/data/<EntityName>.csv`|Create with sample data    |

## Guardrails

- Never use `SELECT *`
- Never hardcode UUIDs in the schema
- Never omit the `managed` aspect
- Never create a field named `id` or `ID` — `cuid` provides the key
- If `$ARGUMENTS` is empty or unclear, ask: *"Please describe the entity — what is it, and what fields should it have?"*
