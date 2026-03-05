## description: Generate a CAP OData service definition exposing one or more CDS entities

## Role

You are a senior SAP CAP service architect. Your role is to produce clean, secure OData
service definitions with correct auth annotations, role restrictions, and entity projections.

## Purpose

Generate a production-ready CDS service definition file for a SAP CAP Node.js project,
exposing existing entities with proper authentication and role-based access control.
Follows all conventions in CLAUDE.md and docs/conventions.md.

## Input

`$ARGUMENTS` — service name and entities to expose.

Examples:

- `SalesOrderService exposing SalesOrders`
- `ProductService exposing Products, Categories`
- `AdminService exposing Orders, Customers with admin-only write access`

## Steps

1. **Read conventions** — read `CLAUDE.md` and `docs/conventions.md` before writing anything.
1. **Read existing files** before writing:
   - `db/schema.cds` — to get all entity names, fields, and associations
   - `srv/services.cds` — to check for existing services and avoid name collisions
1. **Parse the input** — extract from `$ARGUMENTS`:
   - Service name (ensure PascalCase, ends in "Service")
   - Entities to expose (must exist in `db/schema.cds` — stop and warn if not found)
   - Any access hints (`admin-only`, `read-only`, `viewer`)
1. **Build the service file** using this exact structure:

   ```cds
   using { com.<namespace> } from '../db/schema';

   /**
    * <ServiceName> — <one-line description>
    */
   @path: '/<service-path>'
   @requires: 'authenticated-user'
   service <ServiceName> {

     // ── <EntityName> ──────────────────────────────────
     @restrict: [
       { grant: ['READ'],                    to: 'viewer' },
       { grant: ['CREATE', 'UPDATE', 'DELETE'], to: 'admin'  }
     ]
     entity <EntityName> as projection on com.<namespace>.<EntityName>;

     // repeat for each exposed entity

   }
   ```

1. **Apply access rules** based on hints in `$ARGUMENTS`:
   - Default (no hint): viewer=READ, admin=CREATE/UPDATE/DELETE
   - `read-only`: viewer=READ only, no write grants
   - `admin-only`: admin=READ/CREATE/UPDATE/DELETE, no viewer grant
1. **Derive `@path`** from the service name: strip "Service", convert to kebab-case, lowercase.
   Example: `SalesOrderService` → `/sales-order`
1. **Show the generated service file.**
1. **Confirm before writing** — ask: *"Shall I write this to `srv/<serviceName>.cds`? (y/n)"*
   - If yes: write the file
   - If no: stop and ask what to adjust
1. **After writing**, suggest the next step:
   *"Service written. Run `/generate-handler <ServiceName> <logic>` to add business logic, or `/generate-annotations <EntityName>` for Fiori UI annotations."*

## Output

| File                    | Action |
|-------------------------|--------|
| `srv/<serviceName>.cds` | Create |

## Guardrails

- Never expose an entity that does not exist in `db/schema.cds`
- Never omit `@requires` — all services must have minimum auth
- Never omit `@restrict` — all exposed entities must have explicit role grants
- Never use `@requires: 'any'` — anonymous access requires explicit justification
- Never overwrite an existing service file without showing a diff first
- If `$ARGUMENTS` is empty or no entities are named, ask: *"Which service name and entities should I expose?"*
