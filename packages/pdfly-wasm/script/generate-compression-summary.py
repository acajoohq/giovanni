"""
Reads test-report/compression-results.xml and writes a markdown summary to:
  - test-report/compression-summary.md
  - $GITHUB_STEP_SUMMARY (when running in GitHub Actions)
"""

import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

REPORT_DIR = Path(__file__).parent.parent / "test-report"
XML_PATH = REPORT_DIR / "compression-results.xml"
MD_PATH = REPORT_DIR / "compression-summary.md"


def fmt_bytes(b: int) -> str:
    if b < 1024:
        return f"{b} B"
    if b < 1024 * 1024:
        return f"{b / 1024:.1f} KB"
    return f"{b / 1024 / 1024:.2f} MB"


def main() -> None:
    if not XML_PATH.exists():
        print(f"No report found at {XML_PATH}, skipping summary.", file=sys.stderr)
        return

    root = ET.parse(XML_PATH).getroot()

    lines = [
        "## Compression Results\n",
        "| File | Original | default | web | archive |",
        "|------|----------|---------|-----|---------|",
    ]

    for f in root.findall("file"):
        name = f.get("name", "")
        orig = fmt_bytes(int(f.get("originalBytes", "0")))
        cells = []
        for preset in ("default", "web", "archive"):
            r = next((r for r in f.findall("result") if r.get("preset") == preset), None)
            if r is None:
                cells.append("—")
            elif r.get("status") == "wasm-abort":
                cells.append("⚠️ skip")
            else:
                pct = float(r.get("percentageSaved", "0"))
                sign = "-" if pct > 0 else "+"
                cells.append(f"{fmt_bytes(int(r.get('compressedBytes', '0')))} ({sign}{abs(pct):.1f}%)")
        lines.append(f"| {name} | {orig} | {' | '.join(cells)} |")

    content = "\n".join(lines) + "\n"

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    MD_PATH.write_text(content, encoding="utf-8")
    print(f"Written {MD_PATH}")

    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if step_summary:
        with open(step_summary, "a", encoding="utf-8") as fh:
            fh.write(content)
        print(f"Appended to $GITHUB_STEP_SUMMARY")


if __name__ == "__main__":
    main()
