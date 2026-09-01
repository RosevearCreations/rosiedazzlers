#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
ROLLBACK_SHA = "4464e758e02332138bca039149ecbb9ff475988c"
ROLLBACK_TREE = "a4e279eae6cb7136d309278b568fa5769a70d796"
errors = []

def git(*args):
    proc = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"git {' '.join(args)} failed: {proc.stderr.strip()}")
        return ""
    return proc.stdout.strip()

parent = git("rev-parse", "HEAD^")
if parent != ROLLBACK_SHA:
    errors.append(f"Build 290 must remain one atomic commit above accepted Build 289; HEAD^={parent}")

tree = git("rev-parse", f"{ROLLBACK_SHA}^{{tree}}")
if tree != ROLLBACK_TREE:
    errors.append(f"accepted Build 289 tree mismatch: {tree}")

proc = subprocess.run(["git", "merge-base", "--is-ancestor", ROLLBACK_SHA, "HEAD"], cwd=ROOT)
if proc.returncode:
    errors.append("accepted Build 289 is not an ancestor of the Build 290 candidate")

runbook = (ROOT / "BUILD290_ROLLBACK.md").read_text(encoding="utf-8", errors="ignore") if (ROOT / "BUILD290_ROLLBACK.md").exists() else ""
for token in [
    ROLLBACK_SHA,
    ROLLBACK_TREE,
    "forward restore commit",
    "git read-tree --reset -u",
    "git write-tree",
    "git push origin dev",
    "Do not move `main`",
    "No force push",
]:
    if token not in runbook:
        errors.append(f"BUILD290_ROLLBACK.md missing {token}")

if "--force" in runbook or "update-ref" in runbook:
    errors.append("rollback runbook must not instruct a force/ref rewind")

if errors:
    print("Build 290 rollback-readiness check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 290 rollback-readiness check: PASS")
print(f"- accepted rollback source SHA: {ROLLBACK_SHA}")
print(f"- accepted rollback source tree: {ROLLBACK_TREE}")
print("- candidate is an atomic descendant of Build 289")
print("- rollback method is a forward restore commit; no force/ref rewind")
print("- Production main remains outside the rollback procedure")
