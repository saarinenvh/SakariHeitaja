"""
Merge all generated JSONL datasets into a single training file.
Deduplicates by (input, output) pair.

Usage:
  python merge_datasets.py
"""

import json
import os
import glob

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "training_data.jsonl")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def main():
    source_files = sorted(
        glob.glob(os.path.join(DATA_DIR, "*.jsonl")) +
        glob.glob(os.path.join(DATA_DIR, "*.json"))
    )
    if not source_files:
        print("No data_*.jsonl files found. Run generate_chatgpt.py and/or generate_eurollm.py first.")
        return

    seen = set()
    entries = []

    for path in source_files:
        source_name = os.path.basename(path)
        count = 0
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                entry = json.loads(line)
                key = (entry.get("input", ""), entry.get("output", ""))
                if key not in seen:
                    seen.add(key)
                    entries.append(entry)
                    count += 1
        print(f"  {source_name}: {count} entries")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for entry in entries:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"\nTotal: {len(entries)} unique entries → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
