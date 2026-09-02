# Build 302 — Statement Import Reliability Convergence Guard

**Baseline:** `1f950b9daf01a29abb6a46a93d7a0b12992e72b7` (accepted Build 301)

Build 302 resolved the planned statement-import reliability item against the actual surviving Finance authority. The accepted application no longer contains a statement-import parser or statement-import API. `accounting_statement_report.js` is report-only and fails closed on POST; bank reconciliation remains the separate reviewed reconciliation authority.

Because the old importer is retired, Build 302 does **not** recreate an obsolete route or invent a second Finance ingestion path. Instead it adds a release guard that prevents a hidden statement/bank import authority from reappearing without deliberate parser, validation, deterministic error, duplicate/retry and idempotency coverage.

No schema/database change, accounting-policy change, posting change, payment-provider mutation, or Production data mutation is part of Build 302.

**Next:** Build 303 — Finance Tax-support maintainability extraction.
