# Database Migration System

Specify a safe, zero-downtime database migration system for schema and data changes.

## Instructions

Write a specification for performing database migrations without service interruption.

## Learning Goals

- Specify backward-compatible migrations
- Define rollback procedures
- Handle data transformation
- Document safety checks

## Migration Types

1. **Schema Changes** - Add/drop tables, columns, indexes
2. **Data Migrations** - Transform existing data
3. **Constraint Changes** - Add foreign keys, unique constraints
4. **Index Changes** - Create, drop, or rebuild indexes

## Safety Requirements

- All migrations must be backward compatible (old code works with new schema)
- Rollback script required for every migration
- Data integrity checks before and after migration
- Dry-run capability to preview changes
- Automatic backups before destructive changes

## Zero-Downtime Pattern

1. Deploy new schema (backward compatible)
2. Deploy new code that uses new schema
3. Run data migration (if needed)
4. Remove old schema elements (cleanup)

## Example Structure

```markdown
### Requirement: Backward-Compatible Schema Changes
The system SHALL perform schema changes without downtime.

#### Scenario: Adding a new column
- **GIVEN** a table "users" exists
- **WHEN** adding nullable column "phone_number"
- **THEN** the system executes: ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)
- **AND** old application code continues to work
- **AND** new code can read/write the column

#### Scenario: Renaming a column
- **GIVEN** column "email" needs to be renamed to "email_address"
- **WHEN** executing migration
- **THEN** step 1: Add new column "email_address"
- **AND** step 2: Copy data from "email"
- **AND** step 3: Deploy code using "email_address"
- **AND** step 4: Remove old "email" column
```

## Definition of Done

✅ **At least 10 scenarios** covering different migration types  
✅ **All 4 migration types** (Schema, Data, Constraint, Index)  
✅ **Backward compatibility** required for all changes  
✅ **Rollback procedures** documented  
✅ **Zero-downtime pattern** (expand-contract)  
✅ **Safety checks** (dry-run, backups)  
✅ **Data integrity** verification before/after  
✅ **Validates successfully** with `sdd test`
