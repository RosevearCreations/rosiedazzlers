"""CI-only, exact-checkout memoization for repeated successful nested source tests.

A nested source-authority checker can invoke the same deterministic Python/Node
source test hundreds of times. Every DISTINCT child command still executes and
any failure remains a failure. Only a confirmed successful execution inside
this GitHub SHA and runner is reused; external providers and side-effecting
commands are NEVER intercepted. Outside this opted-in CI, behavior is unchanged.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

_ORIGINAL_RUN = subprocess.run

def _eligible(params, kwargs):
    if os.environ.get("ROSIE_CI_DEDUP_SUBCHECKS") != "1" or os.environ.get("GITHUB_ACTIONS") != "true":
        return None
    if len(params) != 1 or not isinstance(params[0], (list, tuple)):
        return None
    argv = params[0]
    if len(argv) < 2 or not all(isinstance(x, (str, os.PathLike)) for x in argv):
        return None
    executable = Path(str(argv[0])).name.lower()
    if not (executable.startswith("python") or executable in ("node", "node.exe")):
        return None
    script = str(argv[1]).replace("\\", "/")
    if not (script.startswith("scripts/") and (script.endswith("_check.py") or script.endswith("_test.mjs"))):
        return None
    # Never memoize a different environment, stdin, or anything with side effects.
    if kwargs.get("env") is not None or kwargs.get("input") is not None or kwargs.get("stdin") is not None:
        return None
    if kwargs.get("shell") or kwargs.get("capture_output") is not True or kwargs.get("text") is not True:
        return None
    sha = os.environ.get("GITHUB_SHA", "")
    if len(sha) != 40 or any(c not in "0123456789abcdefABCDEF" for c in sha):
        return None
    cwd = Path(kwargs.get("cwd") or os.getcwd()).resolve()
    full = (cwd / script).resolve()
    if not full.is_file() or not full.is_relative_to(cwd):
        return None
    key = hashlib.sha256(json.dumps([sha, str(cwd), [str(a) for a in argv]],
                                  separators=(",", ":")).encode("utf-8")).hexdigest()
    return argv, key, sha

def _run(*args, **kwargs):
    match = _eligible(args, kwargs)
    if match is None:
        return _ORIGINAL_RUN(*args, **kwargs)
    argv, key, sha = match
    try:
        import fcntl
        cache_root = Path(os.environ["RUNNER_TEMP"]).resolve() / "rosie-ci-validated-source" / sha
        cache_root.mkdir(parents=True, exist_ok=True)
        lockfile = cache_root / (key + ".lock")
        with lockfile.open("a+") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            cachefile = cache_root / (key + ".json")
            if cachefile.is_file():
                data = json.loads(cachefile.read_text(encoding="utf-8"))
                if data.get("returncode") == 0:
                    return subprocess.CompletedProcess(argv, 0, data.get("stdout", ""), data.get("stderr", ""))
            result = _ORIGINAL_RUN(*args, **kwargs)
            if result.returncode == 0:
                out = result.stdout or ""
                err = result.stderr or ""
                if isinstance(out, str) and isinstance(err, str) and len(out) + len(err) < 200000:
                    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=cache_root,
                                                     prefix=key + "-", suffix=".tmp", delete=False) as file:
                        json.dump({"returncode": 0, "stdout": out, "stderr": err}, file)
                        tmp = Path(file.name)
                    tmp.replace(cachefile)
            return result
    except (OSError, ValueError, TypeError, KeyError, json.JSONDecodeError):
        # Cache infrastructure problems must never fabricate a passing check.
        return _ORIGINAL_RUN(*args, **kwargs)

subprocess.run = _run
