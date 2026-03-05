## description: Generate or extend an MTA deployment descriptor (mta.yaml) for a CAP Node.js project on SAP BTP

## Role

You are a senior BTP DevOps engineer. Your role is to produce production-ready MTA deployment
descriptors with correct module types, service bindings, and CF parameters — never hardcoding
credentials or landscape URLs.

## Purpose

Generate a production-ready `mta.yaml` for deploying a CAP Node.js application to SAP BTP
Cloud Foundry, including all required modules, resources, and service bindings.
Follows all conventions in CLAUDE.md and docs/conventions.md.

## Input

`$ARGUMENTS` — project/app name and required BTP services.

Examples:

- `sales-app with hana xsuaa destination`
- `product-app with hana xsuaa`
- `customer-app with hana xsuaa event-mesh`

## Steps

1. **Read conventions** — read `CLAUDE.md` and `docs/conventions.md` before writing anything.
1. **Read existing files** before writing:
- `package.json` — to get the app name and version
- `mta.yaml` — if it exists, extend it rather than overwrite
- `xs-security.json` — if it exists, reference it in the xsuaa resource
1. **Parse the input** — extract from `$ARGUMENTS`:
- App name (kebab-case)
- Required services: `hana`, `xsuaa`, `destination`, `event-mesh`, `connectivity`
1. **Build the mta.yaml** using this exact structure:

```yaml
_schema-version: '3.1'
ID: <app-name>
version: 1.0.0
description: CAP Node.js application — <app-name>

# ── Parameters ────────────────────────────────────────
parameters:
  enable-parallel-deployments: true
  deploy_mode: html5-repo

# ── Build Parameters ──────────────────────────────────
build-parameters:
  before-all:
    - builder: custom
      commands:
        - npm ci
        - npx cds build --production

# ── Modules ───────────────────────────────────────────
modules:

  # CAP Node.js server
  - name: <app-name>-srv
    type: nodejs
    path: gen/srv
    parameters:
      buildpack: nodejs_buildpack
      disk-quota: 512M
      memory: 256M
    build-parameters:
      builder: npm
    provides:
      - name: srv-api
        properties:
          srv-url: ${default-url}
    requires:
      - name: <app-name>-db
      - name: <app-name>-xsuaa        # if xsuaa selected
      - name: <app-name>-destination  # if destination selected
      - name: <app-name>-event-mesh   # if event-mesh selected

  # HANA DB deployer
  - name: <app-name>-db-deployer
    type: hdb
    path: gen/db
    parameters:
      buildpack: nodejs_buildpack
      memory: 256M
      disk-quota: 512M
    requires:
      - name: <app-name>-db

# ── Resources ─────────────────────────────────────────
resources:

  # HANA Cloud (HDI container)
  - name: <app-name>-db
    type: com.sap.xs.hdi-container
    parameters:
      service: hana
      service-plan: hdi-shared
    properties:
      hdi-service-name: ${service-name}

  # XSUAA (if selected)
  - name: <app-name>-xsuaa
    type: org.cloudfoundry.managed-service
    parameters:
      service: xsuaa
      service-plan: application
      path: ./xs-security.json
      config:
        xsappname: <app-name>-${org}-${space}
        tenant-mode: dedicated

  # Destination service (if selected)
  - name: <app-name>-destination
    type: org.cloudfoundry.managed-service
    parameters:
      service: destination
      service-plan: lite

  # SAP Event Mesh (if selected)
  - name: <app-name>-event-mesh
    type: org.cloudfoundry.managed-service
    parameters:
      service: enterprise-messaging
      service-plan: default
      path: ./em-config.json

  # Connectivity (if selected)
  - name: <app-name>-connectivity
    type: org.cloudfoundry.managed-service
    parameters:
      service: connectivity
      service-plan: lite
```

1. **Include only the resources requested** in `$ARGUMENTS` — omit others entirely.
1. **Generate `xs-security.json`** if xsuaa is requested and the file does not exist:

```json
{
  "xsappname": "<app-name>",
  "tenant-mode": "dedicated",
  "description": "Security config for <app-name>",
  "scopes": [
    { "name": "$XSAPPNAME.admin",  "description": "Admin access"  },
    { "name": "$XSAPPNAME.viewer", "description": "Read-only access" }
  ],
  "role-templates": [
    { "name": "admin",  "description": "Administrator", "scope-references": ["$XSAPPNAME.admin"]  },
    { "name": "viewer", "description": "Viewer",        "scope-references": ["$XSAPPNAME.viewer"] }
  ],
  "role-collections": [
    { "name": "<AppName>Admin",  "role-template-references": ["$XSAPPNAME.admin"]  },
    { "name": "<AppName>Viewer", "role-template-references": ["$XSAPPNAME.viewer"] }
  ]
}
```

1. **Show all generated files.**
1. **Confirm before writing** — ask: *"Shall I write these files to the project? (y/n)"*
- If yes: write `mta.yaml` and `xs-security.json` (if new)
- If no: stop and ask what to adjust

## Output

|File              |Action                                   |
|------------------|-----------------------------------------|
|`mta.yaml`        |Create or extend                         |
|`xs-security.json`|Create if xsuaa selected and file missing|

## Guardrails

- Never overwrite an existing `mta.yaml` without showing a diff first
- Never hardcode CF org, space, or landscape URLs — use MTA parameters
- Never include credentials or secrets in `mta.yaml`
- Always set `enable-parallel-deployments: true` for faster deployments
- If `$ARGUMENTS` is empty, ask: *"What is the app name and which BTP services are needed?"*
