"""
Reads test-report/compression-results.xml and writes a markdown summary to:
  - test-report/compression-summary.md
  - $GITHUB_STEP_SUMMARY (when running in GitHub Actions)

Optional --baseline <path> compares current results against a previous XML file
and shows regression indicators in the table.
"""

import argparse
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


def parse_xml(path: Path) -> dict:
    """Return {(file_name, preset): {"compressedBytes": int} | {"status": "wasm-abort"}}"""
    root = ET.parse(path).getroot()
    results: dict = {}
    for f in root.findall("file"):
        name = f.get("name", "")
        for r in f.findall("result"):
            preset = r.get("preset", "")
            if r.get("status") == "wasm-abort":
                results[(name, preset)] = {"status": "wasm-abort"}
            else:
                results[(name, preset)] = {"compressedBytes": int(r.get("compressedBytes", "0"))}
    return results


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", type=Path, help="Path to baseline compression-results.xml for regression comparison")
    args = parser.parse_args()

    if not XML_PATH.exists():
        print(f"No report found at {XML_PATH}, skipping summary.", file=sys.stderr)
        return

    root = ET.parse(XML_PATH).getroot()
    baseline = parse_xml(args.baseline) if args.baseline and args.baseline.exists() else None

    title = "## Compression Results" + (" (vs master)" if baseline else "")
    lines = [
        f"{title}\n",
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
                cb = int(r.get("compressedBytes", "0"))
                pct = float(r.get("percentageSaved", "0"))
                sign = "-" if pct > 0 else "+"
                cell = f"{fmt_bytes(cb)} ({sign}{abs(pct):.1f}%)"

                if baseline is not None:
                    base = baseline.get((name, preset))
                    if base is None:
                        cell += " 🆕"
                    elif base.get("status") == "wasm-abort":
                        cell += " 🟢"  # was failing before, now works
                    else:
                        delta = cb - base["compressedBytes"]
                        if delta == 0:
                            cell += " ✅"
                        elif delta > 0:
                            cell += f" ⚠️ (+{fmt_bytes(delta)})"
                        else:
                            cell += f" 🟢 (-{fmt_bytes(abs(delta))})"

                cells.append(cell)
        lines.append(f"| {name} | {orig} | {' | '.join(cells)} |")

    if baseline is not None:
        lines.append("\n> ✅ unchanged &nbsp;|&nbsp; 🟢 improved &nbsp;|&nbsp; ⚠️ regression &nbsp;|&nbsp; 🆕 new fixture")

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
