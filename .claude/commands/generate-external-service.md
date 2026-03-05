## description: Integrate an external OData or REST service into a CAP project using cds.connect.to

## Role

You are a senior SAP CAP integration architect. Your role is to produce clean, idiomatic
external service integrations using `cds.connect.to` and CAP's remote service patterns —
never raw HTTP clients, never hardcoded URLs or credentials.

## Purpose

Wire an external OData V2/V4 or REST service into an existing CAP project using a
three-layer approach:

1. **Raw model** (`srv/external/<Name>.cds`) — faithful import of the EDMX/OpenAPI definition
2. **Façade** (`srv/external/index.cds`) — simplified projection that renames technical fields
   to local CAP conventions; this is the only layer local services ever reference
3. **Binding + handler** — `.cdsrc.json` config and delegation handler using `cds.connect.to`

Follows all conventions in CLAUDE.md and docs/conventions.md.

## Input

`$ARGUMENTS` — external service name, spec file path, and optional usage hint.

Examples:

- `BusinessPartnerService from docs/BusinessPartner.edmx`
- `S4_SALESORDER from docs/SalesOrder_api.edmx used in SalesOrderService`
- `ExternalProductsAPI from docs/products-openapi.json as REST`

## Steps

1. **Read conventions** — read `CLAUDE.md` and `docs/conventions.md` before writing anything.
1. **Read existing files** before writing:
   - The spec file named in `$ARGUMENTS` (EDMX or OpenAPI JSON from `docs/`) — stop and ask if not found
   - `package.json` — to check the `cds.requires` block
   - `.cdsrc.json` — to check for existing remote service entries
   - `srv/external/index.cds` — if it exists, extend it rather than overwrite
   - `srv/<usageService>.cds` and `srv/<usageService>.ts` — if a usage service was named
1. **Parse the input** — extract from `$ARGUMENTS`:
   - External service name (PascalCase)
   - Spec file path
   - Spec format: EDMX → OData; `.json` with `openapi` key → REST
   - Usage hint: which local CAP service will call this external service (optional)

---

### Layer 1 — Raw model

1. **Generate `srv/external/<ExternalServiceName>.cds`** — a faithful CDS representation of
   the external service definition. Include all entity sets from the spec but annotate the
   file clearly as auto-derived:

   For **OData (EDMX)**:
   ```cds
   /* ⚠️  AUTO-DERIVED from <spec-file> — do not edit by hand.
      Reference srv/external/index.cds in all local services instead. */

   @cds.external: true
   service <ExternalServiceName> {

     @readonly entity <TechnicalEntityName> {
       key <TechnicalKeyField> : String;  // e.g. BusinessPartner
       <TechnicalField1>       : String;
       <TechnicalField2>       : String;
       // ... all fields from the spec
     }

     // repeat for each entity set in the EDMX
   }
   ```

   For **REST (OpenAPI)**:
   ```cds
   /* ⚠️  AUTO-DERIVED from <spec-file> — do not edit by hand. */

   @cds.external: true
   service <ExternalServiceName> {};
   // REST services carry no entity model — calls go via srv.send()
   ```

---

### Layer 2 — Façade (`index.cds`)

1. **Generate or extend `srv/external/index.cds`** — this is the single import point for all
   local CAP services. It:
   - Renames technical external keys to `ID`
   - Renames technical field names to camelCase matching local conventions
   - Projects only the fields this project actually needs
   - Adds `@readonly` on all projections unless write-back is explicitly required

   ```cds
   /*
    * srv/external/index.cds — façade over raw external service models.
    * Local CAP services MUST import from here, never from the raw model files.
    */

   using { <ExternalServiceName> } from './<ExternalServiceName>';

   /**
    * <LocalEntityName> — simplified projection of <ExternalServiceName>.<TechnicalEntityName>
    * Maps technical SAP field names to local camelCase conventions.
    */
   @readonly
   entity <LocalEntityName> as projection on <ExternalServiceName>.<TechnicalEntityName> {
     key <TechnicalKeyField>  as ID          : String,
     <TechnicalField1>        as <camelCaseLocalName1>,
     <TechnicalField2>        as <camelCaseLocalName2>
     // include only the fields referenced by this project
   }

   // Add one block per entity set needed from this external service
   ```

   **Naming rules for the façade:**
   - `<LocalEntityName>` — PascalCase plural matching local entity conventions (e.g. `BusinessPartners`)
   - Always alias the technical key to `ID` so it matches `cuid`-based local entities
   - Convert ALL_CAPS or PascalCase SAP field names to camelCase (e.g. `FirstName` → `firstName`)

---

### Layer 3 — Binding & handler

1. **Generate the `.cdsrc.json` binding entry:**

   For **OData** destinations (BTP):
   ```json
   {
     "requires": {
       "<ExternalServiceName>": {
         "kind": "odata-v4",
         "model": "srv/external/<ExternalServiceName>",
         "credentials": {
           "destination": "<DESTINATION_NAME>",
           "path": "/sap/opu/odata/sap/<SERVICE_PATH>"
         }
       }
     }
   }
   ```

   For **REST** destinations:
   ```json
   {
     "requires": {
       "<ExternalServiceName>": {
         "kind": "rest",
         "credentials": {
           "destination": "<DESTINATION_NAME>",
           "path": "/<api-base-path>"
         }
       }
     }
   }
   ```

   > `<DESTINATION_NAME>` must be configured in BTP Destination Service — never hardcode the URL.

1. **Update the local service CDS** to import from the façade, not the raw model:

   ```cds
   /* In srv/<localServiceName>.cds — add this using statement */
   using { <LocalEntityName> } from './external/index';

   service <LocalServiceName> {
     @readonly entity <LocalEntityName> as projection on <LocalEntityName>;
   }
   ```

1. **Generate the delegation handler** using the façade entity name:

   For **OData delegation** (full READ delegation to remote):
   ```typescript
   import cds from '@sap/cds';

   const log = cds.log('<localServiceName>');

   export default async (srv: cds.ApplicationService) => {

     // Connect once — CAP caches the connection
     const extSrv = await cds.connect.to('<ExternalServiceName>');

     // ── Delegate READ via index.cds façade ──────────────
     srv.on('READ', '<LocalEntityName>', async (req: cds.Request) => {
       log.info('Delegating READ <LocalEntityName> → <ExternalServiceName>');
       return extSrv.run(req.query);
     });

   };
   ```

   For **REST calls** (explicit send, no entity model):
   ```typescript
   import cds from '@sap/cds';

   const log = cds.log('<localServiceName>');

   export default async (srv: cds.ApplicationService) => {

     const extSrv = await cds.connect.to('<ExternalServiceName>');

     srv.before('CREATE', '<LocalEntityName>', async (req: cds.Request) => {
       log.info('Calling <ExternalServiceName> REST API');
       const result = await extSrv.send({
         method: 'GET',
         path:   '/<resource>',
         headers: { Accept: 'application/json' }
       });
       // enrich or validate req.data using result
     });

   };
   ```

1. **Generate a local mock** for `cds watch` and tests:

   Add to `package.json`:
   ```json
   {
     "cds": {
       "requires": {
         "[development]": {
           "<ExternalServiceName>": {
             "kind": "odata-v4",
             "model": "srv/external/<ExternalServiceName>"
           }
         }
       }
     }
   }
   ```

   Create `srv/external/data/<ExternalServiceName>-<TechnicalEntityName>.csv`
   with one header row using the **technical field names** (not the façade aliases):
   ```
   <TechnicalKeyField>,<TechnicalField1>,<TechnicalField2>
   <sample-value>,<sample-value-1>,<sample-value-2>
   ```

---

1. **Show all generated and modified files** clearly separated by file with labels.
1. **Confirm before writing** — ask: *"Shall I write these files to the project? (y/n)"*
   - If yes: write all new files; show a diff for every modified file
   - If no: stop and ask what to adjust
1. **After writing**, suggest the next step:
   *"External service wired via index.cds façade. Run `/generate-tests <localServiceName>` — use `NODE_ENV=development` to activate the local mock."*

## Output

| File | Action |
|---|---|
| `srv/external/<ExternalServiceName>.cds` | Create — raw EDMX/OpenAPI-derived model |
| `srv/external/index.cds` | Create or extend — façade with renamed, projected fields |
| `.cdsrc.json` | Extend — add `requires` binding entry |
| `package.json` | Extend — add `[development]` mock override |
| `srv/<localServiceName>.cds` | Extend — add `using` import from façade |
| `srv/<localServiceName>.ts` | Create or extend — delegation / REST handler |
| `srv/external/data/<ExternalServiceName>-<TechnicalEntityName>.csv` | Create — mock data using technical field names |

## Guardrails

- Never reference the raw model (`<ExternalServiceName>.cds`) from local services — always go via `index.cds`
- Never hardcode service URLs, usernames, or passwords — always use a BTP Destination reference
- Never read credentials from `process.env` — use CDS service bindings via `cds.connect.to`
- Never use `axios`, `node-fetch`, or `https` for remote calls — use `cds.connect.to` and `srv.send`
- Never use `require()` or `module.exports` — always use ESM `import`/`export default`
- Never import external models into `db/schema.cds` — all external CDS stays under `srv/external/`
- Never skip the `[development]` mock — external services must be testable without a live system
- Always alias the technical key field to `ID` in the façade
- Always rename ALL_CAPS / PascalCase SAP fields to camelCase in the façade
- Always add `@readonly` on façade projections unless write-back is explicitly required
- If the spec file is not found in `docs/`, stop: *"Please add the EDMX or OpenAPI spec to `docs/` first."*
- If `$ARGUMENTS` is empty, ask: *"What is the external service name and where is its spec file?"*
