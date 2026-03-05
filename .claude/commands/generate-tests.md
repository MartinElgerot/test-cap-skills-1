## description: Generate cds.test unit and integration tests for a CAP service

## Role

You are a senior CAP test engineer. Your role is to produce thorough, realistic `cds.test`
suites that cover CRUD, validation, and auth — never mocking CDS internals.

## Purpose

Generate a complete test file for an existing CAP service using the `cds.test` framework,
covering CRUD operations, validations, and auth scenarios.
Follows all conventions in CLAUDE.md and docs/conventions.md.

## Input

`$ARGUMENTS` — the service name and optional focus area.

Examples:

- `SalesOrderService`
- `ProductService focus on validation`
- `CustomerService focus on auth`

## Steps

1. **Read conventions** — read `CLAUDE.md` and `docs/conventions.md` before writing anything.
1. **Read existing files** before writing:
- `srv/<serviceName>.cds` — to understand exposed entities, path, and auth
- `srv/<serviceName>.ts` — to understand what hooks and logic exist
- `db/schema.cds` — to understand field names, types, and required fields
- `db/data/*.csv` — to understand available test data
1. **Parse the input** — extract from `$ARGUMENTS`:
- Service name
- Focus area: `validation`, `auth`, `crud`, or `all` (default: all)
1. **Build the test file** using this exact structure:

```typescript
import cds from '@sap/cds/lib';

const { GET, POST, PUT, DELETE, expect } = cds.test('.').in(__dirname + '/..');

// --- Auth helpers ---
const asAdmin  = { auth: { username: 'admin',  roles: ['admin']  } };
const asViewer = { auth: { username: 'viewer', roles: ['viewer'] } };

describe('<ServiceName>', () => {

  // ── CRUD ──────────────────────────────────────────────

  describe('READ', () => {
    it('should return a list of <EntityName>', async () => {
      const { status, data } = await GET('/odata/v4/<service-path>/<EntityName>', asViewer);
      expect(status).to.equal(200);
      expect(data.value).to.be.an('array');
    });

    it('should return a single <EntityName> by ID', async () => {
      const { status, data } = await GET('/odata/v4/<service-path>/<EntityName>(<test-uuid>)', asViewer);
      expect(status).to.equal(200);
      expect(data).to.have.property('ID');
    });
  });

  describe('CREATE', () => {
    it('should create a valid <EntityName>', async () => {
      const payload = { <field>: <value>, /* minimal valid payload */ };
      const { status, data } = await POST('/odata/v4/<service-path>/<EntityName>', payload, asAdmin);
      expect(status).to.equal(201);
      expect(data.ID).to.exist;
    });

    it('should reject CREATE without required field <field>', async () => {
      const payload = { /* omit required field */ };
      const { status } = await POST('/odata/v4/<service-path>/<EntityName>', payload, asAdmin);
      expect(status).to.equal(400);
    });
  });

  describe('UPDATE', () => {
    it('should update an existing <EntityName>', async () => {
      const { status } = await PUT('/odata/v4/<service-path>/<EntityName>(<test-uuid>)', { <field>: <newValue> }, asAdmin);
      expect(status).to.equal(200);
    });
  });

  describe('DELETE', () => {
    it('should delete an existing <EntityName>', async () => {
      const { status } = await DELETE('/odata/v4/<service-path>/<EntityName>(<test-uuid>)', asAdmin);
      expect(status).to.equal(204);
    });
  });

  // ── VALIDATION ────────────────────────────────────────

  describe('Validation', () => {
    // Generate one test per validation rule found in srv/<serviceName>.ts
    it('should reject <condition that triggers validation>', async () => {
      const payload = { /* payload that violates rule */ };
      const { status, data } = await POST('/odata/v4/<service-path>/<EntityName>', payload, asAdmin);
      expect(status).to.equal(400);
      expect(data.error.message).to.include('<expected error text>');
    });
  });

  // ── AUTH ──────────────────────────────────────────────

  describe('Auth', () => {
    it('should reject unauthenticated READ', async () => {
      const { status } = await GET('/odata/v4/<service-path>/<EntityName>');
      expect(status).to.equal(401);
    });

    it('should reject viewer role on CREATE', async () => {
      const { status } = await POST('/odata/v4/<service-path>/<EntityName>', {}, asViewer);
      expect(status).to.equal(403);
    });

    it('should reject viewer role on DELETE', async () => {
      const { status } = await DELETE('/odata/v4/<service-path>/<EntityName>(<test-uuid>)', asViewer);
      expect(status).to.equal(403);
    });
  });

});
```

1. **Adapt tests to actual service:**
- Replace all placeholders with real field names, paths, and values from the read files
- Use UUIDs from `db/data/*.csv` as test IDs where available
- Generate one validation test per `req.error()` or `req.reject()` call found in the handler
- If "readonly" service: omit CREATE, UPDATE, DELETE tests
1. **Show the full test file.**
1. **Confirm before writing** — ask: *"Shall I write this to `test/<serviceName>.test.ts`? (y/n)"*
- If yes: write the file
- If no: stop and ask what to adjust

## Output

|File                         |Action          |
|-----------------------------|----------------|
|`test/<serviceName>.test.ts` |Create test file|

## Guardrails

- Never mock `cds` internals — use `cds.test` end-to-end style
- Never hardcode UUIDs that don't exist in test data
- Always test both success and failure paths
- Always include at least one auth rejection test
- Never use `require()` — always use ESM `import`
- If `$ARGUMENTS` is empty, ask: *"Which service should I generate tests for?"*
