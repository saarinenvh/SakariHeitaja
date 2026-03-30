"""
Generate training data using OpenEuroLLM via Ollama.

Runs 50 diverse scenarios through the Finnish model.
This will be slow (~17s/example on CPU) — expected total ~15 min.

Usage:
  OLLAMA_BASE_URL=http://192.168.1.101:11434 python generate_eurollm.py
"""

import json
import os
import sys
import time
import random
import requests
from scenarios import generate_scenarios, build_brief_prompt

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://192.168.1.101:11434")
OLLAMA_MODEL = "jobautomation/OpenEuroLLM-Finnish:latest"

SYSTEM_PROMPT = open(
    os.path.join(os.path.dirname(__file__), "../src/bot/system-prompts/commentator.txt")
).read().strip()

INSTRUCTION = (
    "Rewrite this disc golf event as a short, sarcastic Finnish spoken-style commentary."
)

from datetime import datetime
_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "data", f"eurollm_{_timestamp}.jsonl")

# Take a random 50 from the full scenario list for EuroLLM
SAMPLE_SIZE = 50


def call_ollama(brief_prompt: str) -> str | None:
    body = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": brief_prompt},
        ],
        "stream": False,
        "options": {
            "temperature": 0.85,
            "num_predict": 100,
            "num_ctx": 512,
        },
    }
    try:
        res = requests.post(f"{OLLAMA_BASE_URL}/api/chat", json=body, timeout=120)
        res.raise_for_status()
        data = res.json()
        return data.get("message", {}).get("content", "").strip() or None
    except Exception as e:
        print(f"\n  [ERROR] {e}")
        return None


def main():
    scenarios = generate_scenarios()
    # Shuffle and sample for variety
    random.shuffle(scenarios)
    sampled = scenarios[:SAMPLE_SIZE]

    print(f"Generating {len(sampled)} entries via OpenEuroLLM ({OLLAMA_MODEL})...")
    print(f"Estimated time: ~{len(sampled) * 17 // 60} min\n")

    entries = []
    for i, brief in enumerate(sampled):
        brief_prompt = build_brief_prompt(brief)
        label = f"{brief['playerName']} — {brief['holeScoreLabel']}"
        print(f"  [{i+1}/{len(sampled)}] {label}", end=" ", flush=True)

        start = time.time()
        output = call_ollama(brief_prompt)
        elapsed = time.time() - start

        if output:
            # Basic validation: must include player first name
            first_name = brief["playerName"].split()[0].lower()
            if first_name not in output.lower():
                print(f"✗ (missing player name, {elapsed:.0f}s)")
                continue
            entries.append({
                "instruction": INSTRUCTION,
                "input": brief_prompt,
                "output": output,
            })
            print(f"✓ ({elapsed:.0f}s)")
        else:
            print(f"✗ ({elapsed:.0f}s)")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for entry in entries:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"\nSaved {len(entries)} entries → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
