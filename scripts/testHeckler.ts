import dotenv from "dotenv";
dotenv.config();

import { generate, loadPrompt } from "../src/shared/llm/ollamaClient";

const testCases = [
  {
    label: "Sakke mentioned by name",
    recent: [
      "Ville teki taas bogin",
      "No eipä yllätä",
      "Aki pelaa hyvin tänään",
      "Ei saatana",
      "Kuka vie kortit",
    ],
    trigger: "Sakke mitä sä sanot tähän?",
  },
  {
    label: "Reaction to bad shot with context",
    recent: [
      "Riki heitti suoraan OB",
      "HAHAHAHA",
      "Kolmas kerta",
      "Ei saa olla totta",
      "Jotain pitäis tehä noille heitoille",
    ],
    trigger: "Sakke kommentoi",
  },
  {
    label: "No prior context",
    recent: [],
    trigger: "hei sakke",
  },
];

async function main() {
  const systemPrompt = loadPrompt("heckler.md");
  console.log(`Model: ${process.env.OLLAMA_MODEL ?? "gemma3"}`);
  console.log(`URL:   ${process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"}\n`);

  for (const tc of testCases) {
    console.log(`--- ${tc.label} ---`);

    const recentLines = tc.recent.length > 0
      ? ["Recent messages:", ...tc.recent.map((m, i) => `${i + 1}. "${m}"`), ""]
      : [];

    const context = [
      ...recentLines,
      `Trigger message:\n"${tc.trigger}"`,
      "",
      "Write a very short Sakke-style reaction. Max three sentences",
    ].join("\n");

    const start = Date.now();
    try {
      const result = await generate(
        [
          { role: "system", content: systemPrompt },
          { role: "user",   content: context },
        ],
        { temperature: 1.0, num_predict: 60 },
      );
      console.log(`Response (${Date.now() - start}ms):\n${result}\n`);
    } catch (err: any) {
      console.error(`FAILED: ${err.message}\n`);
    }
  }
}

main();
