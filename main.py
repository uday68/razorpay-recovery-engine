#!/usr/bin/env python3
"""
Razorpay AI Revenue Recovery Engine - single-command local launcher.

Usage:
    python run_project.py

What it does:
    1. Validates required local tools.
    2. Detects project manifests.
    3. Creates a local .venv if needed.
    4. Installs Python packages from requirements/pyproject when present.
    5. Installs frontend packages with npm when node_modules is absent/incomplete.
    6. Downloads Go modules with `go mod download`.
    7. Starts Docker Compose infrastructure.
    8. Starts FastAPI, Go executor, recovery worker, and frontend.
    9. Prefixes all process output into one combined stream.
   10. Ctrl+C shuts down all child processes and Docker Compose services.

Notes:
    - Docker itself is NOT installed by this script.
    - The script never invents telemetry or application data.
    - Service startup failures are shown explicitly.
    - Existing project files are not overwritten.
"""

from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


ROOT = Path(__file__).resolve().parent
PYTHON_VENV = ROOT / ".venv"
IS_WINDOWS = os.name == "nt"

PYTHON_BIN = (
    PYTHON_VENV / "Scripts" / "python.exe"
    if IS_WINDOWS
    else PYTHON_VENV / "bin" / "python"
)
PIP_BIN = (
    PYTHON_VENV / "Scripts" / "pip.exe"
    if IS_WINDOWS
    else PYTHON_VENV / "bin" / "pip"
)

STOP_EVENT = threading.Event()
CHILDREN: List["ManagedProcess"] = []


@dataclass
class ManagedProcess:
    name: str
    process: subprocess.Popen


def python_command(*args: str) -> List[str]:
    return [sys.executable, *args]


def detect_manifests(repo: Path) -> Dict[str, Optional[Path]]:
    return {
        "python": next(
            (
                p
                for p in (
                    repo / "requirements.txt",
                    repo / "backend" / "requirements.txt",
                    repo / "pyproject.toml",
                )
                if p.exists()
            ),
            None,
        ),
        "node": (repo / "frontend" / "package.json")
        if (repo / "frontend" / "package.json").exists()
        else None,
        "go": (repo / "backend" / "go-executor" / "go.mod")
        if (repo / "backend" / "go-executor" / "go.mod").exists()
        else None,
        "docker_compose": next(
            (
                p
                for p in (
                    repo / "docker-compose.yml",
                    repo / "docker-compose.yaml",
                    repo / "compose.yml",
                    repo / "compose.yaml",
                )
                if p.exists()
            ),
            None,
        ),
    }


def format_line(name: str, line: str) -> str:
    label = name.upper()
    timestamp = time.strftime("%H:%M:%S")
    return f"[{timestamp}] [{label}] {line.rstrip()}"


def print_header(title: str) -> None:
    print("\n" + "=" * 88)
    print(title)
    print("=" * 88)


def command_exists(command: str) -> bool:
    return shutil.which(command) is not None


def run_checked(
    command: Sequence[str],
    cwd: Path = ROOT,
    label: Optional[str] = None,
) -> None:
    shown = " ".join(f'"{x}"' if " " in x else x for x in command)
    print(format_line(label or "BOOT", f"RUN: {shown}"))
    result = subprocess.run(command, cwd=str(cwd), text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"Command failed with exit code {result.returncode}: {shown}"
        )


def ensure_python_venv() -> None:
    if PYTHON_BIN.exists() and PIP_BIN.exists():
        return

    print(format_line("BOOT", "Creating Python virtual environment: .venv"))
    run_checked([sys.executable, "-m", "venv", str(PYTHON_VENV)], label="BOOT")


def ensure_python_dependencies(manifest: Optional[Path]) -> None:
    if manifest is None:
        print(format_line("BOOT", "No Python manifest found; skipping pip install."))
        return

    ensure_python_venv()

    # Upgrade pip first so dependency resolution is less brittle.
    run_checked(
        [str(PIP_BIN), "install", "--upgrade", "pip"],
        label="PYTHON",
    )

    if manifest.name == "requirements.txt":
        run_checked(
            [str(PIP_BIN), "install", "-r", str(manifest)],
            label="PYTHON",
        )
        return

    if manifest.name == "pyproject.toml":
        run_checked(
            [str(PIP_BIN), "install", "-e", str(ROOT)],
            label="PYTHON",
        )
        return

    run_checked(
        [str(PIP_BIN), "install", "-r", str(manifest)],
        label="PYTHON",
    )


def ensure_node_dependencies(manifest: Optional[Path]) -> None:
    if manifest is None:
        print(format_line("BOOT", "No frontend package.json found; skipping npm install."))
        return

    npm = shutil.which("npm")
    if npm is None:
        raise RuntimeError("npm is required but was not found on PATH.")

    frontend = manifest.parent
    node_modules = frontend / "node_modules"

    if node_modules.exists():
        print(format_line("NODE", "node_modules exists; skipping dependency download."))
        return

    print(format_line("NODE", "node_modules missing; installing frontend dependencies."))
    run_checked([npm, "ci" if (frontend / "package-lock.json").exists() else "install"], cwd=frontend, label="NODE")


def ensure_go_dependencies(manifest: Optional[Path]) -> None:
    if manifest is None:
        print(format_line("BOOT", "No Go module found; skipping go mod download."))
        return

    go = shutil.which("go")
    if go is None:
        raise RuntimeError("Go is required but was not found on PATH.")

    go_root = manifest.parent
    run_checked([go, "mod", "download"], cwd=go_root, label="GO")


def ensure_docker(manifest: Optional[Path]) -> None:
    if manifest is None:
        print(format_line("DOCKER", "No Docker Compose file found; skipping infrastructure startup."))
        return

    docker = shutil.which("docker")
    if docker is None:
        raise RuntimeError(
            "Docker is required because docker-compose.yml exists, but docker was not found."
        )

    run_checked(
        [docker, "compose", "-f", str(manifest), "up", "-d"],
        cwd=ROOT,
        label="DOCKER",
    )


def maybe_install_common_python_packages() -> None:
    """
    Safety net when a repository forgot to commit a Python dependency manifest.

    Only packages that are required by the known application architecture are added.
    This branch is deliberately conservative to avoid silently installing an
    arbitrary package list.
    """
    if not PYTHON_BIN.exists():
        return

    required = [
        "fastapi",
        "uvicorn",
        "psycopg[binary]",
        "numpy",
        "pandas",
        "scikit-learn",
        "joblib",
        "shap",
        "redis",
    ]

    missing: List[str] = []
    for import_name in (
        "fastapi",
        "uvicorn",
        "psycopg",
        "numpy",
        "pandas",
        "sklearn",
        "joblib",
        "shap",
        "redis",
    ):
        probe = subprocess.run(
            [str(PYTHON_BIN), "-c", f"import {import_name}"],
            cwd=str(ROOT),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if probe.returncode != 0:
            mapping = {
                "fastapi": "fastapi",
                "uvicorn": "uvicorn",
                "psycopg": "psycopg[binary]",
                "numpy": "numpy",
                "pandas": "pandas",
                "sklearn": "scikit-learn",
                "joblib": "joblib",
                "shap": "shap",
                "redis": "redis",
            }
            missing.append(mapping[import_name])

    if missing:
        print(format_line("PYTHON", f"Missing packages detected: {', '.join(missing)}"))
        run_checked(
            [str(PIP_BIN), "install", *missing],
            label="PYTHON",
        )


def stream_output(managed: ManagedProcess) -> None:
    process = managed.process
    assert process.stdout is not None
    for line in iter(process.stdout.readline, ""):
        if not line:
            break
        print(format_line(managed.name, line), flush=True)
    process.stdout.close()


def start_process(
    name: str,
    command: Sequence[str],
    cwd: Path = ROOT,
    env: Optional[Dict[str, str]] = None,
) -> ManagedProcess:
    shown = " ".join(f'"{x}"' if " " in x else x for x in command)
    print(format_line("BOOT", f"START {name}: {shown}"))

    proc_env = os.environ.copy()
    if env:
        proc_env.update(env)

    process = subprocess.Popen(
        list(command),
        cwd=str(cwd),
        env=proc_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        text=True,
        bufsize=1,
        universal_newlines=True,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if IS_WINDOWS else 0,
    )

    managed = ManagedProcess(name=name, process=process)
    CHILDREN.append(managed)

    thread = threading.Thread(
        target=stream_output,
        args=(managed,),
        daemon=True,
        name=f"log-{name}",
    )
    thread.start()
    return managed


def stop_process(managed: ManagedProcess) -> None:
    proc = managed.process
    if proc.poll() is not None:
        return

    print(format_line("BOOT", f"Stopping {managed.name}..."))

    try:
        if IS_WINDOWS:
            proc.send_signal(signal.CTRL_BREAK_EVENT)
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.terminate()
        else:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    except Exception as exc:
        print(format_line("BOOT", f"Could not gracefully stop {managed.name}: {exc}"))


def stop_all() -> None:
    STOP_EVENT.set()

    for managed in reversed(CHILDREN):
        stop_process(managed)

    docker_compose = detect_manifests(ROOT)["docker_compose"]
    docker = shutil.which("docker")
    if docker and docker_compose:
        try:
            run_checked(
                [docker, "compose", "-f", str(docker_compose), "down"],
                cwd=ROOT,
                label="DOCKER",
            )
        except Exception as exc:
            print(format_line("DOCKER", f"Compose shutdown warning: {exc}"))


def handle_signal(signum: int, _frame: object) -> None:
    print(format_line("BOOT", f"Received signal {signum}; shutting down..."))
    stop_all()


def wait_for_services() -> None:
    """
    Keep the launcher alive while child processes run.
    Any unexpected process termination is printed immediately.
    """
    while not STOP_EVENT.is_set():
        dead = [m for m in CHILDREN if m.process.poll() is not None]
        for managed in dead:
            code = managed.process.returncode
            print(format_line("BOOT", f"{managed.name} exited with code {code}."))

        if dead:
            # If a core service exits immediately, keep the other services alive
            # long enough to make the failure visible rather than hiding it.
            time.sleep(0.5)

        time.sleep(0.5)


def start_application_services() -> None:
    python = str(PYTHON_BIN if PYTHON_BIN.exists() else sys.executable)
    go = shutil.which("go")
    npm = shutil.which("npm")

    if not go:
        raise RuntimeError("Go is required to start the executor/worker.")
    if not npm:
        raise RuntimeError("npm is required to start the frontend.")

    go_root = ROOT / "backend" / "go-executor"
    frontend = ROOT / "frontend"

    print_header("STARTING APPLICATION SERVICES")

    start_process(
        "API",
        [
            python,
            "-m",
            "uvicorn",
            "backend.api.app:app",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
        ],
    )

    start_process(
        "EXECUTOR",
        [go, "run", "."],
        cwd=go_root,
    )

    worker_main = go_root / "cmd" / "recovery-worker" / "main.go"
    if worker_main.exists():
        start_process(
            "WORKER",
            [go, "run", "./cmd/recovery-worker"],
            cwd=go_root,
        )
    else:
        print(format_line("BOOT", "Recovery worker entrypoint not found; skipping worker."))

    start_process(
        "FRONTEND",
        [npm, "run", "dev", "--", "--host", "0.0.0.0"],
        cwd=frontend,
    )


def print_urls() -> None:
    print_header("PROJECT URLS")
    print("  Control Tower : http://localhost:5173")
    print("  FastAPI       : http://localhost:8000")
    print("  FastAPI Docs  : http://localhost:8000/docs")
    print("  Go Executor   : http://localhost:8080")
    print("")
    print("  Press Ctrl+C once to stop all services and Docker Compose.")
    print("")


def main() -> int:
    signal.signal(signal.SIGINT, handle_signal)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, handle_signal)

    print_header("RAZORPAY AI REVENUE RECOVERY ENGINE")
    print(format_line("BOOT", f"Repository: {ROOT}"))

    manifests = detect_manifests(ROOT)

    if not command_exists("docker") and manifests["docker_compose"]:
        raise RuntimeError("docker-compose configuration detected, but Docker is missing.")

    ensure_python_dependencies(manifests["python"])
    if manifests["python"] is not None:
        ensure_python_venv()
        maybe_install_common_python_packages()

    ensure_node_dependencies(manifests["node"])
    ensure_go_dependencies(manifests["go"])
    ensure_docker(manifests["docker_compose"])

    start_application_services()
    print_urls()
    wait_for_services()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        stop_all()
        raise SystemExit(130)
    except Exception as exc:
        print(format_line("ERROR", str(exc)))
        stop_all()
        raise SystemExit(1)
