#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
ROLLBACK_SHA = "4464e758e02332138bca039149ecbb9ff475988c"
ROLLBACK_TREE = "a4e279eae6cb7136d309278b568fa5769a70d796"
errors = []

def run(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)

def git(*args):
    proc = run(*args)
    if proc.returncode:
        errors.append(f"git {' '.join(args)} failed: {proc.stderr.strip()}")
        return ""
    return proc.stdout.strip()

# Build 290's rollback invariant is historical and must remain provable even as the
# Development branch grows beyond old workflow checkout depths. If the caller has a
# shallow repository, obtain complete history before checking the accepted Build 289
# anchor. Never convert an unavailable ancestry proof into success.
shallow = run("rev-parse", "--is-shallow-repository")
if shallow.returncode:
    errors.append(f"could not determine repository history depth: {shallow.stderr.strip()}")
elif shallow.stdout.strip().lower() == "true":
    expanded = run("fetch", "--no-tags", "--prune", "--unshallow", "origin")
    if expanded.returncode:
        errors.append(f"could not obtain complete history for rollback ancestry proof: {expanded.stderr.strip()}")

probe = run("cat-file", "-e", f"{ROLLBACK_SHA}^{{commit}}")
if probe.returncode:
    fetched = run("fetch", "--no-tags", "origin", ROLLBACK_SHA)
    if fetched.returncode:
        errors.append(f"could not fetch accepted Build 289 restore anchor: {fetched.stderr.strip()}")

tree = git("rev-parse", f"{ROLLBACK_SHA}^{{tree}}")
if tree != ROLLBACK_TREE:
    errors.append(f"accepted Build 289 tree mismatch: {tree}")

proc = run("merge-base", "--is-ancestor", ROLLBACK_SHA, "HEAD")
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
print("- accepted Build 289 remains a verified ancestor of the candidate")
print("- rollback method is a forward restore commit; no force/ref rewind")
print("- Production main remains outside the rollback procedure")
