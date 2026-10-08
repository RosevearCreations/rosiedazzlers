#!/usr/bin/env python3
"""Non-mutating repository cleanup contract; run during source acceptance."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RETIRED=["data/build260_go_live_blockers.json","data/build262_cpu_source_audit.json","data/build262_ui_health_routes.json","data/markdown_sanity_build245.json","data/markdown_sanity_build246.json","data/markdown_sanity_build247.json","data/markdown_sanity_build249.json"]
RETAINED=["data/app_modules.json","data/build267_app_modules.json","data/markdown_sanity_build236.json","docs/digital-asset-intelligence-platform/README.md","scripts/release_hygiene_check.py","functions/api/admin/staff_mobile_remediation_closure_readiness.js","supabase/migrations/20260910171324_build373_fleet_account_operations.sql"]
def main():
    errors=[f"Retired snapshot remains: {p}" for p in RETIRED if (ROOT/p).exists()]
    errors += [f"Protected active dependency missing: {p}" for p in RETAINED if not (ROOT/p).is_file()]
    if errors:
        print("Repository cleanup contract: FAIL\\n"+"\\n".join(errors))
        return 1
    print(f"Repository cleanup contract: PASS ({len(RETIRED)} obsolete snapshots absent; {len(RETAINED)} critical assets retained)")
    return 0
if __name__=="__main__": raise SystemExit(main())
