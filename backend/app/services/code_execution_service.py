"""
CodeSage AI — Code Execution Service
Supports Judge0 API (primary) with graceful fallback messaging.
"""

import logging
import httpx
import asyncio
from typing import Optional, Dict

from app.core.config import settings

logger = logging.getLogger("codesage.execution")

# ── Judge0 Language ID Map ────────────────────────────────────────────────────
JUDGE0_LANGUAGES = {
    "python":     71,
    "python3":    71,
    "javascript": 63,
    "typescript": 74,
    "java":       62,
    "cpp":        54,
    "c":          50,
    "c#":         51,
    "csharp":     51,
    "go":         60,
    "rust":       73,
    "ruby":       72,
    "swift":      83,
    "kotlin":     78,
    "php":        68,
    "r":          80,
    "bash":       46,
    "sql":        82,
}

JUDGE0_STATUS = {
    1: "In Queue",
    2: "Processing",
    3: "Accepted",
    4: "Wrong Answer",
    5: "Time Limit Exceeded",
    6: "Compilation Error",
    7: "Runtime Error (SIGSEGV)",
    8: "Runtime Error (SIGXFSZ)",
    9: "Runtime Error (SIGFPE)",
    10: "Runtime Error (SIGABRT)",
    11: "Runtime Error (NZEC)",
    12: "Runtime Error (Other)",
    13: "Internal Error",
    14: "Exec Format Error",
}


async def _execute_locally(code: str, language: str, stdin: str, timeout: int) -> Dict:
    """Fallback engine to compile and run supported languages locally on the host."""
    import tempfile
    import os
    import subprocess
    import sys
    import time
    import shutil
    import re

    lang = language.lower()
    supported_langs = ["python", "python3", "javascript", "typescript", "cpp", "c", "java"]
    if lang not in supported_langs:
        return {
            "status": "error",
            "stdout": "",
            "stderr": f"Local execution not configured for '{language}'. Please configure JUDGE0_API_KEY in .env.",
            "execution_time": 0,
            "memory": 0,
            "verdict": "Unsupported Local Language",
        }

    temp_dir = None
    bin_path = None
    path = None

    try:
        start_time = time.time()
        if lang == "java":
            # For Java, the main class name must match the filename
            match = re.search(r'public\s+class\s+(\w+)', code)
            class_name = match.group(1) if match else "Main"
            temp_dir = tempfile.mkdtemp()
            path = os.path.join(temp_dir, f"{class_name}.java")
            with open(path, 'w', encoding='utf-8') as f:
                f.write(code)

            # Compile
            c_proc = subprocess.run(["javac", path], capture_output=True, text=True, errors='replace')
            if c_proc.returncode != 0:
                return {
                    "status": "error",
                    "stdout": "",
                    "stderr": c_proc.stderr,
                    "execution_time": 0,
                    "memory": 0,
                    "verdict": "Compilation Error",
                    "message": "Local Java compilation failed."
                }
            cmd = ["java", "-cp", temp_dir, class_name]

        elif lang in ["cpp", "c"]:
            # Need to compile C/C++ source
            fd, path = tempfile.mkstemp(suffix=f".{lang}")
            os.close(fd)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(code)

            bin_path = path + (".exe" if os.name == 'nt' else ".bin")
            compiler = "g++" if lang == "cpp" else "gcc"
            c_proc = subprocess.run([compiler, "-O3", "-o", bin_path, path], capture_output=True, text=True, errors='replace')
            if c_proc.returncode != 0:
                return {
                    "status": "error",
                    "stdout": "",
                    "stderr": c_proc.stderr,
                    "execution_time": 0,
                    "memory": 0,
                    "verdict": "Compilation Error",
                    "message": f"Local compiler ({compiler}) failed."
                }
            cmd = [bin_path]

        else:
            # Scripting languages (Python, JS)
            suffix = ".py" if lang in ["python", "python3"] else ".js"
            fd, path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(code)

            if lang in ["python", "python3"]:
                cmd = [sys.executable, path]
            elif lang == "javascript":
                cmd = ["node", path]
            elif lang == "typescript":
                cmd = ["ts-node", path]

        # Run process with stdin
        proc = subprocess.run(
            cmd,
            input=stdin,
            capture_output=True,
            text=True,
            timeout=timeout,
            errors='replace'
        )
        elapsed = time.time() - start_time

        stdout = proc.stdout
        stderr = proc.stderr
        status = "success" if proc.returncode == 0 else "error"
        verdict = "Accepted" if proc.returncode == 0 else "Runtime Error"

        return {
            "status": status,
            "stdout": stdout,
            "stderr": stderr,
            "execution_time": round(elapsed, 3),
            "memory": 0,
            "verdict": verdict,
            "message": "Executed locally on your machine (fallback engine)."
        }

    except subprocess.TimeoutExpired:
        return {
            "status": "timeout",
            "stdout": "",
            "stderr": f"Execution timed out after {timeout} seconds.",
            "execution_time": timeout,
            "memory": 0,
            "verdict": "Time Limit Exceeded",
            "message": "Executed locally (fallback engine)."
        }
    except Exception as e:
        return {
            "status": "error",
            "stdout": "",
            "stderr": f"Failed to execute process locally: {e}",
            "execution_time": 0,
            "memory": 0,
            "verdict": "Local Runner Error",
        }
    finally:
        # Cleanup
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        if path and os.path.exists(path) and lang != "java":
            try: os.remove(path)
            except Exception: pass
        if bin_path and os.path.exists(bin_path):
            try: os.remove(bin_path)
            except Exception: pass


async def execute_code(
    code: str,
    language: str,
    stdin: str = "",
    timeout: int = 10,
) -> Dict:
    """Execute code via Judge0 API, or fallback locally if no key is configured."""
    lang_id = JUDGE0_LANGUAGES.get(language.lower())

    if not lang_id:
        return {
            "status": "error",
            "stdout": "",
            "stderr": f"Language '{language}' is not supported.",
            "execution_time": 0,
            "memory": 0,
            "verdict": "Unsupported Language",
        }

    if not settings.JUDGE0_API_KEY:
        # Gracefully run locally for supported fallback languages
        return await _execute_locally(code, language, stdin, timeout)

    try:
        return await _execute_judge0(code, lang_id, stdin, timeout)
    except Exception as e:
        logger.error(f"Code execution failed: {e}")
        return {
            "status": "error",
            "stdout": "",
            "stderr": str(e),
            "execution_time": 0,
            "memory": 0,
            "verdict": "Execution Error",
        }


async def _execute_judge0(code: str, lang_id: int, stdin: str, timeout: int) -> Dict:
    """Submit to Judge0 and poll for result."""
    import base64

    headers = {
        "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "Content-Type": "application/json",
    }

    payload = {
        "source_code": base64.b64encode(code.encode()).decode(),
        "language_id": lang_id,
        "stdin": base64.b64encode(stdin.encode()).decode() if stdin else "",
        "cpu_time_limit": timeout,
        "memory_limit": 256000,
        "base64_encoded": True,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        # Submit
        submit_resp = await client.post(
            f"{settings.JUDGE0_API_URL}/submissions?base64_encoded=true&wait=false",
            json=payload,
            headers=headers,
        )
        submit_resp.raise_for_status()
        token = submit_resp.json()["token"]

        # Poll for result (max 15 attempts)
        for _ in range(15):
            await asyncio.sleep(1)
            result_resp = await client.get(
                f"{settings.JUDGE0_API_URL}/submissions/{token}?base64_encoded=true",
                headers=headers,
            )
            result = result_resp.json()
            status_id = result.get("status", {}).get("id", 1)

            if status_id > 2:  # Done
                def decode(b64: Optional[str]) -> str:
                    if not b64:
                        return ""
                    import base64 as b
                    try:
                        return b.b64decode(b64).decode("utf-8", errors="replace")
                    except Exception:
                        return b64

                stdout = decode(result.get("stdout"))
                stderr = decode(result.get("stderr")) or decode(result.get("compile_output"))
                exec_time = float(result.get("time") or 0)
                memory = int(result.get("memory") or 0)

                return {
                    "status": "success" if status_id == 3 else "error",
                    "stdout": stdout,
                    "stderr": stderr,
                    "execution_time": exec_time,
                    "memory": memory,
                    "verdict": JUDGE0_STATUS.get(status_id, "Unknown"),
                    "token": token,
                }

    return {
        "status": "timeout",
        "stdout": "",
        "stderr": "Execution timed out waiting for Judge0 response.",
        "execution_time": timeout,
        "memory": 0,
        "verdict": "Timeout",
    }
