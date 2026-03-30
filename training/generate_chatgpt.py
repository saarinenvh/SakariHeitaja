"""
Generates a prompt file to paste into ChatGPT web UI.

Usage:
  python generate_chatgpt.py

This creates chatgpt_prompt.txt — paste its contents into ChatGPT.
ChatGPT will output JSONL lines. Save that output as data_chatgpt.jsonl.
"""

import os
from pathlib import Path
from scenarios import generate_scenarios, build_brief_prompt

SYSTEM_PROMPT = Path("../src/bot/system-prompts/commentator.txt").read_text().strip()
from datetime import datetime
_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), f"chatgpt_prompt_{_timestamp}.txt")


def main():
    scenarios = generate_scenarios()

    lines = []

    lines.append("You are a training data generator for a Finnish disc golf commentary bot called Sakke.")
    lines.append("")
    lines.append("Sakke's personality and rules are defined in this system prompt:")
    lines.append("")
    lines.append("--- SYSTEM PROMPT START ---")
    lines.append(SYSTEM_PROMPT)
    lines.append("--- SYSTEM PROMPT END ---")
    lines.append("")
    lines.append("For each scenario below, generate 3 DIFFERENT Sakke-style commentary outputs.")
    lines.append("Each variation must have a different reaction, different throw description, different energy.")
    lines.append("Follow the system prompt rules exactly.")
    lines.append("Output ONLY valid JSONL — one JSON object per line, no extra text.")
    lines.append("")
    lines.append('Each line must be: {"instruction": "Rewrite this disc golf event as a short, sarcastic Finnish spoken-style commentary.", "input": "<the scenario text>", "output": "<your generated commentary>"}')
    lines.append("")
    lines.append("Rules for output field:")
    lines.append("- Write in Finnish spoken language (puhekieli)")
    lines.append("- Player name in <b>Name</b> bold tags")
    lines.append("- NEVER mention numbers, scores, or standings")
    lines.append("- If the scenario says 'Kirjoita 2 lausetta': exactly 2 sentences")
    lines.append("- If the scenario says 'Kirjoita 3 lausetta': exactly 3 sentences")
    lines.append("- Each variation must feel completely different — different opening, different description, different closing")
    lines.append("")
    lines.append(f"Here are the {len(scenarios)} scenarios (3 outputs each = {len(scenarios)*3} total JSONL lines):")
    lines.append("")

    for i, brief in enumerate(scenarios):
        brief_prompt = build_brief_prompt(brief)
        lines.append(f"=== Scenario {i+1} ===")
        lines.append(brief_prompt)
        lines.append("")

    lines.append(f"Now output the JSONL. 3 lines per scenario, {len(scenarios)*3} lines total. Nothing else.")

    prompt_text = "\n".join(lines)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(prompt_text)

    print(f"Prompt written → {OUTPUT_FILE}")
    print(f"Scenarios: {len(scenarios)}")
    print(f"File size: {len(prompt_text) // 1000}KB")
    print("")
    print("Next steps:")
    print("  1. Open ChatGPT (any model, GPT-4o recommended)")
    print("  2. Paste the contents of chatgpt_prompt.txt")
    print("  3. Copy ChatGPT's JSONL output → save as training/data_chatgpt.jsonl")
    print("  4. Run: python merge_datasets.py")


if __name__ == "__main__":
    main()
