#!/usr/bin/env python3
"""Build 179 guard: hard social publish gate, proof tasks, quote delivery/acceptance tracking."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "functions/api/admin/social_post_dispatch.js": ["Build 179", "build179_hard_privacy_publish_gate", "blockPublishIfNotReady", "send_webhook", "mark_posted"],
    "functions/api/admin/local_seo_proof_tasks_save.js": ["Build 179", "local_seo_proof_tasks", "source_recommendation", "assigned_to_email"],
    "functions/api/admin/local_seo_proof_tasks_list.js": ["Build 179", "local_seo_proof_tasks", "tasks"],
    "functions/api/admin/quote_proposal_deliver.js": ["Build 179", "quote_proposal_drafts", "acceptance_url", "dispatchNotificationThroughProvider"],
    "functions/api/quote_proposal_respond.js": ["Build 179", "acceptance_token_hash", "accepted", "declined"],
    "quote-response.html": ["data-build179=\"quote-proposal-response-page\"", "quote_proposal_respond", "Accept quote", "Decline quote"],
    "quote-response/index.html": ["data-build179=\"quote-proposal-response-page\"", "quote_proposal_respond"],
    "admin-leads.html": ["data-build179=\"quote-delivery-acceptance\"", "quote_proposal_deliver", "Prepare/send email", "Customer response link"],
    "admin-leads/index.html": ["data-build179=\"quote-delivery-acceptance\"", "quote_proposal_deliver"],
    "admin-analytics.html": ["data-build179=\"local-proof-tasking\"", "local_seo_proof_tasks_save", "local_seo_proof_tasks_list", "Create task"],
    "admin-analytics/index.html": ["data-build179=\"local-proof-tasking\"", "local_seo_proof_tasks_save"],
    "functions/api/admin/quote_proposal_drafts_list.js": ["Build 179", "delivery_status", "acceptance_status", "customer_response_note"],
    "sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql": ["Build 179", "local_seo_proof_tasks", "acceptance_token_hash", "delivery_status"],
    "SUPABASE_SCHEMA.sql": ["Build 179 note", "local_seo_proof_tasks", "quote_proposal_respond"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 179", "quote acceptance", "local proof tasks"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 179 update", "hard social publish", "quote acceptance"],
}

def fail(msg: str) -> int:
    print(f"Build 179 check failed: {msg}")
    return 1

def main() -> int:
    for rel, markers in REQUIRED.items():
        path = ROOT / rel
        if not path.exists():
            return fail(f"missing {rel}")
        text = path.read_text(encoding="utf-8", errors="ignore")
        for marker in markers:
            if marker not in text:
                return fail(f"{rel} missing marker {marker!r}")
    print("Build 179 publish/tasks/quote acceptance guard passed.")
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
