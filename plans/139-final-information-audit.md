# 139: Final information audit

## Goal

Verify that the agent and documentation cleanup did not remove useful project knowledge.

## Status

- Data knowledge: done
- Operational knowledge: done
- Design and user preferences: done
- Integration and verification: done

## Contracts

- Do not restore stale instructions or duplicate current code.
- Preserve useful facts in code, tests, concise root instructions, or specialist runbooks.
- Do not delete anything during this audit.

## Blockers

- None.

## Follow-up

- Reconcile the migration journal and snapshots, then add a cold-schema verification gate. The journal currently omits migrations 0006, 0009, 0022, and 0024 through 0029.

## Log

- root: Started a conservative review of every removed information category.
- data audit: Removed DIP and schema-drift notes are now encoded in code. The migration journal remains incomplete, so the database setup documentation needs a warning until reconciliation.
- workflow audit: Preserve the preview URL, read-only validated server boundaries, and the prohibition on fabricated public records. Other removed role instructions are redundant or stale.
- design audit: Keep the mocks and designer role deleted. Preserve only at-a-glance political storytelling, existing visualization approval, semantic color, and the rejection of decorative left-edge rails.
- root: Restored the five useful rules, corrected the database bootstrap guidance, verified agent generation, TypeScript, references, and diff hygiene.
