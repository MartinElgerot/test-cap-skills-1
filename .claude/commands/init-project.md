## description: Bootstrap a new CAP Node.js project with folder structure, CLAUDE.md, conventions, and starter files

## Role

You are a senior SAP CAP architect. Your role is to bootstrap clean, idiomatic CAP TypeScript
projects with correct structure, conventions, and tooling — never plain Express or non-CAP patterns.

## Purpose

Initialise a new SAP CAP TypeScript project with the correct folder structure,
a populated CLAUDE.md, coding conventions, and placeholder files.
Run this once at the start of a new project.

## Input

`$ARGUMENTS` — project name and optional description.

Examples:

- `sales-app`
- `product-management-app A product catalogue and inventory management system`

## Steps

1. **Parse the input** — extract from `$ARGUMENTS`:
- Project name (convert to kebab-case)
- Description (optional, use "CAP Node.js application" if not provided)
1. **Check if project already exists** — if `package.json` or `CLAUDE.md` already exists, stop and ask:
   *"A project already exists here. Do you want to reinitialise? This will not overwrite existing files. (y/n)"*
1. **Generate the following file set:**

   **`package.json`**

   ```json
   {
     "name": "<project-name>",
     "version": "1.0.0",
     "description": "<description>",
     "engines": { "node": ">=18" },
     "dependencies": {
       "@sap/cds": ">=7",
       "@sap/cds-dk": ">=7",
       "express": "^4"
     },
     "devDependencies": {
       "@cap-js/sqlite": "*",
       "@sap/cds-types": ">=7",
       "chai": "^4",
       "mocha": "^10",
       "ts-node": "^10",
       "typescript": "^5"
     },
     "scripts": {
       "start":   "cds-serve",
       "watch":   "cds watch",
       "test":    "mocha --require ts-node/register test/**/*.test.ts --timeout 10000",
       "compile": "tsc --noEmit",
       "build":   "cds build --production",
       "deploy":  "cf push"
     },
     "cds": {
       "requires": {
         "db": { "kind": "sqlite", "credentials": { "url": ":memory:" } }
       }
     }
   }
   ```

   **`tsconfig.json`**

   ```json
   {
     "compilerOptions": {
       "target": "ES2021",
       "module": "CommonJS",
       "moduleResolution": "node",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true
     },
     "include": ["srv/**/*.ts", "test/**/*.ts"]
   }
   ```

   **`.cdsrc.json`**

   ```json
   {
     "build": { "target": "gen" },
     "hana": { "deploy-format": "hdbtable" },
     "i18n": { "default_language": "en" },
     "log": { "levels": { "cds": "info" } }
   }
   ```

   **`db/schema.cds`**

   ```cds
   namespace com.<project-name-camel>;

   using { managed, cuid } from '@sap/cds/common';

   // Add your entities here using /generate-entity
   ```

   **`srv/services.cds`**

   ```cds
   // Add your services here using /generate-service
   ```

   **`srv/annotations.cds`**

   ```cds
   // Add your UI annotations here using /generate-annotations
   ```

   **`.gitignore`**

   ```
   node_modules/
   gen/
   .env
   default-env.json
   *.db
   mta_archives/
   ```

   **`CLAUDE.md`** — fully populated with project name, namespace, and all standard rules from the template.

   **`docs/conventions.md`** — copy of the standard CAP conventions doc.
1. **Create folder structure:**

   ```
   db/
     data/          # CSV test data files
   srv/
   test/
   .claude/
     commands/      # Skill files live here
   docs/
   ```
1. **Show the complete file list that will be created.**
1. **Confirm before writing** — ask: *"Shall I initialise the project with these files? (y/n)"*
- If yes: write all files
- If no: stop and ask what to adjust
1. **After writing**, print the getting-started guide:

   ```
   ✅ Project initialised: <project-name>

   Next steps:
   1. npm install
   2. /generate-entity    — create your first data entity
   3. /generate-service   — expose it as an OData service
   4. /generate-handler   — add business logic
   5. /generate-tests     — write tests
   6. npm run watch       — start the dev server
   ```

## Output

|File                 |Action|
|---------------------|------|
|`package.json`       |Create|
|`tsconfig.json`      |Create|
|`.cdsrc.json`        |Create|
|`db/schema.cds`      |Create|
|`srv/services.cds`   |Create|
|`srv/annotations.cds`|Create|
|`.gitignore`         |Create|
|`CLAUDE.md`          |Create|
|`docs/conventions.md`|Create|

## Guardrails

- Never overwrite files that already exist — skip and note them
- Always use `:memory:` SQLite for local dev — never point to a real HANA in dev config
- Never include credentials in any generated file
- If `$ARGUMENTS` is empty, ask: *"What is the project name?"*
