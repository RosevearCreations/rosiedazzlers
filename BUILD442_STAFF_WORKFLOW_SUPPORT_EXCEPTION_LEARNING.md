# Build 442 — Staff Workflow & Support Exception Learning

## Purpose
Review current staff task friction and support-exception evidence to identify repeated operator problems worth correcting without converting counts into unsupported root-cause claims.

## Implemented evidence workflow
The protected Administration surface \`/admin-staff-workflow-support-learning.html\` is manual-refresh and read-only. It composes two retained authorities:

- **Today Needs Attention** for the current bounded staff task queue; and
- **Support Exceptions** for current read-only diagnostic/reconciliation exceptions.

The Build 442 endpoint reduces those retained payloads to aggregate patterns before returning learning evidence. Customer names, customer email addresses, booking identifiers, raw exception identifiers, message contents and secret values are not returned.

## Repeated-pattern rule
A learning candidate requires at least two current items with the same normalized bounded pattern.

For staff tasks, the pattern is the retained source type plus normalized task title. For support exceptions, the pattern is source plus family plus state.

A repeated pattern means only that multiple current items share the same shape. It **does not prove root cause**, common ownership, causation or that one correction will resolve every item. The operator must open the owning workflow and verify the underlying evidence before changing process or state.

If no repeated pattern appears, Build 442 does not conclude that staff workflows are friction-free.

## Evidence status
The result is:

- \`observed\` when both retained sources are available;
- \`partial\` when at least one source is available and another is unavailable; or
- \`unavailable\` when no authorized source can be established.

A restricted source remains restricted. Missing provider/owner/observed evidence remains a truthful HOLD, owner action or unavailable state.

## Role and authority boundary
The page belongs to the existing Business Administration module. The endpoint requires both the existing booking-management boundary and the existing \`it.runtime.view\` action authority, so the cross-module learning view does not widen Operations or I.T. role ceilings.

Canonical Detailer, Operations, Booking, Staff, I.T. and Support Exception APIs remain authoritative. Build 442 creates no replacement business-state ledger.

## Mutation boundary
No role escalation, automatic completion, automatic exception correction, silent accounting/inventory posting, customer/provider outreach, provider transaction, schema/storage mutation or permanent polling is authorized.

The learning surface recommends bounded operator review only. Any consequential action remains inside the existing owning workflow with its existing permission and confirmation rules.

## Acceptance
The exact candidate must pass:

1. \`scripts/staff_workflow_support_exception_learning_check.py\`;
2. \`scripts/staff_workflow_support_exception_learning_test.mjs\`;
3. retained staff workflow, support exception, workflow evidence, accessibility and prior learning authorities;
4. Current Source Gate;
5. exact feature-preview acceptance;
6. exact Development deployment/runtime acceptance after non-force promotion to \`dev\`;
7. protected-main pull-request checks; and
8. independent exact resulting \`main\` Production deployment/runtime/business acceptance.

Source or runtime GREEN never closes a provider, owner or observed-evidence HOLD by inference.

## Next bounded release
**Build 443 — Service Economics & Commercial Capacity Review** begins only after this release is independently GREEN on protected \`main\`.
