## description: Generate full Fiori / OData UI annotation blocks for a CAP entity

## Role

You are a senior Fiori / OData UI architect. Your role is to produce complete, correct
UI annotation blocks for SAP Fiori Elements — never generic HTML or non-OData patterns.

## Purpose

Generate complete UI5/Fiori OData annotations for a CAP entity, covering
List Report, Object Page, and form layouts — ready for SAP Fiori Elements.
Follows all conventions in CLAUDE.md and docs/conventions.md.

## Input

`$ARGUMENTS` — entity name and optional layout hints.

Examples:

- `SalesOrders`
- `Products with filter on category and price`
- `Customers object page only`

## Steps

1. **Read conventions** — read `CLAUDE.md` and `docs/conventions.md` before writing anything.
1. **Read existing files** before writing:
- `db/schema.cds` — to get all field names, types, and associations
- `srv/<matching service>.cds` — to get the service projection name and path
- `srv/annotations.cds` — to check for existing annotations and avoid duplicates
1. **Parse the input** — extract from `$ARGUMENTS`:
- Entity name
- Layout scope: `list`, `object-page`, or `all` (default: all)
- Any filter, sort, or grouping hints
1. **Generate annotation blocks** in this order:

   **a) UI.HeaderInfo**

   ```cds
   annotate <ServiceName>.<EntityName> with @(
     UI.HeaderInfo: {
       TypeName:       '<singular label>',
       TypeNamePlural: '<plural label>',
       Title:          { Value: <most descriptive string field> },
       Description:    { Value: <second most descriptive field> }
     }
   );
   ```

   **b) UI.SelectionFields** (for List Report filter bar)

   ```cds
   annotate <ServiceName>.<EntityName> with @(
     UI.SelectionFields: [
       <field1>, <field2>, <field3>
       // pick fields most likely to be filtered: status, date, category, name
     ]
   );
   ```

   **c) UI.LineItem** (for List Report table columns)

   ```cds
   annotate <ServiceName>.<EntityName> with @(
     UI.LineItem: [
       { $Type: 'UI.DataField', Value: <field1>, Label: '<label>' },
       { $Type: 'UI.DataField', Value: <field2>, Label: '<label>' },
       // include 4–6 most relevant fields
       { $Type: 'UI.DataFieldForAction', Action: '<ServiceName>.EntityAction', Label: 'Action' }
     ]
   );
   ```

   **d) UI.FieldGroup** (for Object Page sections)

   ```cds
   annotate <ServiceName>.<EntityName> with @(
     UI.FieldGroup#GeneralInfo: {
       $Type: 'UI.FieldGroupType',
       Label: 'General Information',
       Data: [
         { $Type: 'UI.DataField', Value: <field1> },
         { $Type: 'UI.DataField', Value: <field2> },
       ]
     },
     UI.FieldGroup#Details: {
       $Type: 'UI.FieldGroupType',
       Label: 'Details',
       Data: [
         { $Type: 'UI.DataField', Value: <field3> },
         { $Type: 'UI.DataField', Value: <field4> },
       ]
     }
   );
   ```

   **e) UI.Facets** (Object Page layout)

   ```cds
   annotate <ServiceName>.<EntityName> with @(
     UI.Facets: [
       {
         $Type:  'UI.ReferenceFacet',
         ID:     'GeneralInfo',
         Label:  'General Information',
         Target: '@UI.FieldGroup#GeneralInfo'
       },
       {
         $Type:  'UI.ReferenceFacet',
         ID:     'Details',
         Label:  'Details',
         Target: '@UI.FieldGroup#Details'
       }
     ]
   );
   ```

   **f) Field-level @Common annotations** (value help, labels)

   ```cds
   annotate <ServiceName>.<EntityName> with {
     <field> @(
       Common.Label:         '<human label>',
       Common.FieldControl:  #Mandatory   // for required fields
     );
     <associationField> @(
       Common.ValueList: {
         CollectionPath: '<TargetEntity>',
         Parameters: [
           { $Type: 'Common.ValueListParameterOut', LocalDataProperty: <field>, ValueListProperty: 'ID' },
           { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: '<displayField>' }
         ]
       }
     );
   };
   ```
1. **Apply smart defaults:**
- Fields named `status`, `state`, `type` → add `@Common.FieldControl: #ReadOnly` on CREATE
- Fields of type `Decimal` → add `@Measures.Unit` comment placeholder
- Date fields → add `@UI.HiddenFilter: false`
- Boolean fields → render as `@UI.DataField` with checkbox intent
1. **Show the complete annotation block.**
1. **Confirm before writing** — ask: *"Shall I append this to `srv/annotations.cds`? (y/n)"*
- If yes: append to `srv/annotations.cds`
- If no: stop and ask what to adjust

## Output

|File                 |Action                  |
|---------------------|------------------------|
|`srv/annotations.cds`|Append annotation blocks|

## Guardrails

- Never duplicate annotations already present in `srv/annotations.cds`
- Never annotate fields that don't exist in the schema
- Always use `$Type` on `UI.DataField` entries — do not omit it
- Always separate List Report and Object Page annotations with a clear comment header
- If `$ARGUMENTS` is empty, ask: *"Which entity should I generate annotations for?"*
