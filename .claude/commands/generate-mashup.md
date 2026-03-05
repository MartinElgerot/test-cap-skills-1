## description: Generate a mashup.cds that enriches a local entity with fields from an external service façade

## Role

You are a senior SAP CAP integration architect. Your role is to produce clean mashup
definitions that combine local CAP entities with external service data using virtual fields,
`extend`, and `after READ` enrichment — never by joining DB tables to remote systems.

## Purpose

Generate `srv/mashup.cds` and a matching enrichment handler that combine a local entity
with data from an external service façade (`srv/external/index.cds`).
The mashup adds `@virtual` fields to the local entity, populated at read time from the
external service — keeping the local schema clean and the DB free of external data.
Follows all conventions in CLAUDE.md and docs/conventions.md.

## Input

`$ARGUMENTS` — local entity (in a named service), external façade entity, join field, and
the external fields to surface.

Examples:

- `Orders in SalesOrderService enriched with BusinessPartners on businessPartnerId showing partnerName, partnerCategory`
- `Products in ProductService enriched with ExternalSuppliers on supplierId showing supplierName, supplierCountry`
- `Invoices in InvoiceService enriched with BusinessPartners on customerId showing firstName, lastName, creditLimit`

## Steps

1. **Read conventions** — read `CLAUDE.md` and `docs/conventions.md` before writing anything.
1. **Read existing files** before writing:
   - `db/schema.cds` — confirm the local entity and its join field exist
   - `srv/<localServiceName>.cds` — get the service projection name and existing fields
   - `srv/external/index.cds` — confirm the external façade entity exists and find the
     available fields; stop and ask if not found
   - `srv/mashup.cds` — if it exists, extend it rather than overwrite
   - `srv/<localServiceName>.ts` — to understand existing hooks before adding the enrichment
1. **Parse the input** — extract from `$ARGUMENTS`:
   - Local service name and entity name
   - External façade entity name (must exist in `srv/external/index.cds`)
   - Join field: the local entity field that holds the external entity's `ID`
   - External fields to surface as virtual fields (camelCase, matching façade names)
1. **Validate before generating:**
   - Confirm the local join field exists in `db/schema.cds` — stop if not found
   - Confirm every requested external field exists in the façade — list any missing ones
     and ask: *"These fields are not in the façade: <list>. Add them to index.cds first, or
     remove them from this mashup?"*

---

### Part A — `srv/mashup.cds`

Generate or extend `srv/mashup.cds` with an `extend` block that adds `@virtual` fields
to the local service entity:

```cds
/*
 * srv/mashup.cds — virtual field extensions for external service enrichment.
 * Fields defined here are populated at read time by the enrichment handler.
 * They are never stored in the database.
 */

using { <LocalServiceName> } from './<localServiceName>';

// ── <LocalEntityName> × <ExternalFaçadeEntityName> ───────────────────────────
// Join field: <LocalEntityName>.<joinField> → <ExternalFaçadeEntityName>.ID

extend <LocalServiceName>.<LocalEntityName> with {

  @title:    '<Human label>'
  @virtual:  true
  @readonly: true
  <virtualField1> : String;    // sourced from <ExternalFaçadeEntityName>.<field1>

  @title:    '<Human label>'
  @virtual:  true
  @readonly: true
  <virtualField2> : String;    // sourced from <ExternalFaçadeEntityName>.<field2>

  // ... one entry per requested external field
}
```

**Field naming rules:**
- Virtual field names must be camelCase and must not clash with existing local fields
- Prefix with the external entity name if ambiguity is possible
  (e.g. `partnerName` not just `name` when the local entity already has a `name` field)
- Infer CDS type from the façade field type (`String`, `Decimal(15,2)`, `Boolean`, etc.)

---

### Part B — enrichment handler

Generate an `after READ` hook in `srv/<localServiceName>.ts` (or a new file if it doesn't
exist) that:

1. Collects distinct join-field values from the result set
2. Fetches matching records from the external façade in a single batch query
3. Builds an in-memory map and stamps virtual fields onto each result row

```typescript
// ── Enrichment: <LocalEntityName> × <ExternalFaçadeEntityName> ──────────────
srv.after('READ', '<LocalEntityName>', async (results: any[], req: cds.Request) => {

  // 1. Collect distinct join-field IDs — skip if result set is empty
  const rows = Array.isArray(results) ? results : [results];
  const ids  = [...new Set(rows.map((r: any) => r.<joinField>).filter(Boolean))];
  if (!ids.length) return;

  // 2. Batch-fetch from external façade — one round-trip regardless of result size
  const extSrv   = await cds.connect.to('<ExternalServiceName>');
  const partners = await extSrv.run(
    SELECT.from('<ExternalFaçadeEntityName>').where({ ID: { in: ids } })
  );

  // 3. Build lookup map and stamp virtual fields
  const map = Object.fromEntries((partners as any[]).map((p: any) => [p.ID, p]));
  for (const row of rows) {
    const ext = map[row.<joinField>];
    if (!ext) continue;
    row.<virtualField1> = ext.<facadeField1>;
    row.<virtualField2> = ext.<facadeField2>;
    // ... one assignment per virtual field
  }
});
```

**Handler rules:**
- Always use `Array.isArray(results)` guard — `after READ` receives either an array or a
  single object depending on whether it was a collection or single-entity request
- Always batch by collecting IDs first — never call the external service once per row
- Always use `cds.connect.to` — never import `axios` or `node-fetch`
- Place the enrichment hook after any existing `before`/`on` hooks in the file

---

1. **Show all generated content** clearly separated: `srv/mashup.cds` first, then handler diff.
1. **Confirm before writing** — ask: *"Shall I write these files to the project? (y/n)"*
   - If yes: write `srv/mashup.cds`; show a diff and extend `srv/<localServiceName>.ts`
   - If no: stop and ask what to adjust
1. **After writing**, suggest the next step:
   *"Mashup written. Run `/generate-tests <localServiceName>` — test both with the mock active
   (`NODE_ENV=development`) and verify virtual fields are populated in the READ response."*

## Output

| File | Action |
|---|---|
| `srv/mashup.cds` | Create or extend — `extend` blocks adding `@virtual` fields |
| `srv/<localServiceName>.ts` | Extend — add `after READ` enrichment hook |

## Guardrails

- Never store virtual fields in the DB — they must always be `@virtual: true` and `@readonly: true`
- Never call the external service once per row — always batch by collecting IDs first
- Never add `extend` blocks directly in `srv/<localServiceName>.cds` — use `mashup.cds` only
- Never use `require()` or `module.exports` — always use ESM `import`/`export default`
- Never reference the raw external model — always use `srv/external/index.cds` façade
- Never add virtual fields to `db/schema.cds` — the local schema must stay clean
- Always guard `Array.isArray(results)` in the `after READ` handler
- If the external façade entity is not in `srv/external/index.cds`, stop:
  *"Run `/generate-external-service` first to create the façade, then re-run this command."*
- If the local join field is missing from the schema, stop:
  *"Add `<joinField>` to `<LocalEntityName>` in `db/schema.cds` first."*
- If `$ARGUMENTS` is empty, ask:
  *"Which local entity in which service should be enriched, with which external façade entity,
  on which join field, and which fields should be surfaced?"*
