import subprocess
from pathlib import Path


def test_casos_unitarios_frontend_del_pdf():
    repo_root = Path(__file__).resolve().parents[2]
    test_file = repo_root / "tests" / "unit_tests" / "frontend_unit_tests.mjs"

    result = subprocess.run(
        ["node", "--test", str(test_file)],
        cwd=repo_root,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stdout + result.stderr
