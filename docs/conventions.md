# CAP Node.js Coding Conventions

## Naming

|Element     |Convention                |Example               |
|------------|--------------------------|----------------------|
|Entity      |PascalCase, plural        |`SalesOrders`         |
|Field       |camelCase                 |`orderDate`           |
|Service     |PascalCase + "Service"    |`SalesOrderService`   |
|Handler file|camelCase, matches service|`salesOrderService.ts`|
|Namespace   |lowercase, dot-separated  |`com.acme.sales`      |

## CDS Entities

- Always include `managed` aspect for `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`
- Always define a `key ID : UUID` unless a natural key is explicitly specified
- Use `Association to` for lookups, `Composition of` for owned child entities
- Add `@title` and `@description` annotations on all entities and key fields
- Add `@readonly` on computed or system-managed fields

## CDS Services

- Expose entities via a service, never directly from the data model
- Use `@requires: 'authenticated-user'` as minimum auth on all services
- Define roles using `@restrict` with `grant` and `to` per operation

## Handler Files (TypeScript)

- Use `export default (srv: cds.ApplicationService) => { ... }` — never `require()` or `module.exports`
- Type hook parameters as `cds.Request`; never use untyped `req: any`
- Register hooks as `srv.before`, `srv.on`, `srv.after`
- Always use `async/await` — no raw Promises or callbacks
- Use `cds.error()` for user-facing errors, never `throw new Error()`
- Never use `SELECT *` — always project only needed fields

## TypeScript Setup

- Always generate `tsconfig.json` with `target: ES2021`, `strict: true`, `esModuleInterop: true`
- Always add `@sap/cds-types`, `typescript ^5`, and `ts-node ^10` to `devDependencies`
- Run tests via `mocha --require ts-node/register test/**/*.test.ts`
- Run `tsc --noEmit` (compile check) as part of CI — never skip type errors

## File Locations

|File type         |Location                           |
|------------------|-----------------------------------|
|Data model        |`db/schema.cds`                    |
|Service definition|`srv/*.cds`                        |
|Service handler   |`srv/*.ts`                         |
|Annotations       |`srv/annotations.cds` or co-located|
|Test data         |`db/data/*.csv`                    |
|Tests             |`test/*.test.ts`                   |
