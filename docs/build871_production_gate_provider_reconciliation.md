# Rosie Dazzlers 871 — Provider Status and Production Gate Reconciliation

This versioned document describes how to distinguish a GitHub-hosted Cloudflare Pages check from the independent runtime acceptance evidence for a protected `main` release. It does not change the application, SQL schema, customer data, payment processing, deployment settings or branch-protection policy.

## Independent release authority

1. Preserve `dev` → protected `main` pull request ancestry and verify the final merge commit exactly matches the deployed production artifact.
2. Require the existing source, business-acceptance, deploy-time Functions, immutable Pages URL, canonical-domain runtime HTTP smoke and operator release-health gates.
3. Confirm Cloudflare's project metadata has `production_branch=main`, the exact deployment commit and `environment=production`, terminal `latest_stage.status=success` and `uses_functions=true`.
4. Require Cloudflare's *own GitHub check* for the exact new commit to complete successfully before claiming that **all** checks are GREEN.
5. A Cloudflare deployment may report success while a GitHub check remains `in_progress` because of asynchronous provider reporting. Such a discrepancy is an **external check HOLD**, never evidence that source or customer transactions are faulty and never permission to ignore/alter the provider's check.
6. An independently verified rollout is still not evidence of genuine customer delivery, provider refund issuance, or a live original-device trial.

## What changes here

This commit is an audit-only release reconciliation change. It intentionally allows the existing Git-integrated Cloudflare Pages flow to process a new Git commit and issue its own check on the new protected release. No CI skip flags, provider token access, unilateral status changes, force pushes, production-deployment deletion or Direct Upload are used.

When complete, the newest `main` SHA, successful provider check, independent exact-SHA acceptance and release health are the promotion evidence. If the provider's external check stalls again, retain the HOLD and investigate the integration in Cloudflare's **Workers & Pages → rosiedazzlers → Deployments** page.

## Authority reference

- [Cloudflare Pages GitHub integration and checks](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- [Cloudflare Pages debugging and deployment build logs](https://developers.cloudflare.com/pages/configuration/debugging-pages/)
- [Build 871 implementation and private original-Supabase migration](build871_delivery_consent_refund_awareness.md)

Do not modify Build 871's customer-consent, quote delivery, or refund settlement behavior as part of status troubleshooting.
