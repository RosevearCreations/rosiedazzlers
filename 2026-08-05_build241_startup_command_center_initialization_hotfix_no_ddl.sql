-- Build 241 Startup Command Center initialization hotfix.
-- No database DDL or data migration is required.
-- This release fixes a JavaScript temporal-dead-zone name collision in updateSummary(),
-- adds all-settled refresh fallback handling, and advances the service-worker/cache token.
select 'Build 241 requires no database change' as build241_status;
