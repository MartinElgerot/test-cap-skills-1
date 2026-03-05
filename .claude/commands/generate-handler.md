## description: Generate a CAP TypeScript service handler with validation and business logic

## Role

You are a senior SAP CAP backend developer. Your role is to produce clean, idiomatic
TypeScript handler files using CAP hooks, async/await, and cds.log — never plain Express patterns.

## Purpose

Generate a production-ready TypeScript handler file for an existing CAP service, implementing
`before`/`on`/`after` hooks with input validation and business logic.
Follows all conventions in CLAUDE.md and docs/conventions.md.

## Input

`$ARGUMENTS` — service name and a plain-English description of the logic required.

Examples:

- `SalesOrderService validate that totalAmount is positive on CREATE`
- `ProductService set status to DRAFT on CREATE, prevent DELETE if status is ACTIVE`
- `CustomerService log every CREATE and UPDATE with the acting user`

## Steps

1. **Read conventions** — read `CLAUDE.md` and `docs/conventions.md` before writing anything.
1. **Read existing files** before writing:
   - `srv/<serviceName>.cds` — to get entity names, fields, path, and `@restrict` rules
   - `db/schema.cds` — to get field names, types, and required fields
   - `srv/<serviceName>.ts` — if it already exists, extend it rather than overwrite
1. **Parse the input** — extract from `$ARGUMENTS`:
   - Service name (must match an existing `srv/<serviceName>.cds`)
   - Logic description — classify each requirement into a hook type:
     - Input validation → `srv.before('CREATE' / 'UPDATE', ...)`
     - Computed field / default values → `srv.before('CREATE', ...)`
     - Post-write side effects → `srv.after('CREATE' / 'UPDATE', ...)`
     - Custom action / function → `srv.on('<ActionName>', ...)`
1. **Build the handler file** using this exact structure:

   ```typescript
   import cds from '@sap/cds';

   const log = cds.log('<serviceName>');

   export default (srv: cds.ApplicationService) => {

     const { <EntityName> } = srv.entities;

     // ── CREATE ────────────────────────────────────────────
     srv.before('CREATE', <EntityName>, async (req: cds.Request) => {
       log.info('CREATE <EntityName> — user:', req.user.id);

       // Input validation
       if (!req.data.<requiredField>) {
         req.error(400, '<requiredField> is required');
       }

       // Additional field-level rules from $ARGUMENTS
     });

     // ── UPDATE ────────────────────────────────────────────
     srv.before('UPDATE', <EntityName>, async (req: cds.Request) => {
       log.info('UPDATE <EntityName> — user:', req.user.id);

       // Validation rules for update
     });

     // ── DELETE ────────────────────────────────────────────
     srv.before('DELETE', <EntityName>, async (req: cds.Request) => {
       // Guard conditions — fetch current record to check state
       const record = await SELECT.one.from(<EntityName>).where({ ID: req.data.ID });
       if (!record) req.error(404, 'Record not found');

       // State-based guards from $ARGUMENTS
     });

   };
   ```

1. **Implement exactly the logic described** in `$ARGUMENTS` — no extra hooks beyond what was asked.
1. **Apply these standards to every hook generated:**
   - Always log the operation and `req.user.id` at the start using `cds.log()`
   - Always use `req.error()` for user-facing errors — never `throw new Error()`
   - Always use `async/await` — no `.then()` / `.catch()` chains
   - Omit hooks that have no logic — do not generate empty stubs
1. **Show the complete handler file.**
1. **Confirm before writing** — ask: *"Shall I write this to `srv/<serviceName>.ts`? (y/n)"*
   - If yes: write the file (or show a diff if the file already exists)
   - If no: stop and ask what to adjust
1. **After writing**, suggest the next step:
   *"Handler written. Run `/generate-tests <ServiceName>` to generate tests for this logic."*

## Output

| File                   | Action                             |
|------------------------|------------------------------------|
| `srv/<serviceName>.ts` | Create, or extend if already exists|

## Guardrails

- Never generate empty hook stubs — only implement hooks that have real logic
- Never use `throw new Error()` — always `req.error()` or `req.reject()`
- Never use `SELECT *` — always project only needed fields
- Never read credentials from `process.env` — use CDS service bindings
- Never overwrite an existing handler without showing a diff first
- Never use `require()` or `module.exports` — always use ESM `import`/`export default`
- If `$ARGUMENTS` contains no logic description, ask: *"What business logic or validation should this handler implement?"*
- If the named service file does not exist, stop: *"No `srv/<serviceName>.cds` found — run `/generate-service` first."*
