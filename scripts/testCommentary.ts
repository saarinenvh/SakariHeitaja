import dotenv from "dotenv";
dotenv.config();

import { generateLlmComment } from "../src/features/disc-golf/llmCommentary";
import { Change, MetrixPlayerResult } from "../src/types/metrix";

// Simulated full results for competition context
const results: MetrixPlayerResult[] = [
  { Name: "Ville", Diff: -3, OrderNumber: 1, ClassName: "MPO", Sum: 60 },
  { Name: "Petteri", Diff: -1, OrderNumber: 2, ClassName: "MPO", Sum: 62 },
  { Name: "Aki", Diff: +2, OrderNumber: 3, ClassName: "MPO", Sum: 65 },
  { Name: "Riki", Diff: +4, OrderNumber: 4, ClassName: "MPO", Sum: 67 },
];

function makeChange(overrides: Partial<Change>): Change {
  return {
    playerName: "Ville",
    playerId: 1,
    prevPlayer: { Name: "Ville", Diff: -2, OrderNumber: 2, ClassName: "MPO" },
    newPlayer:  { Name: "Ville", Diff: -3, OrderNumber: 1, ClassName: "MPO" },
    hole: 6,
    holeResult: { Result: "2", Diff: -1, PEN: 0 },
    ...overrides,
  } as Change;
}

const testCases: Array<{ label: string; change: Change }> = [
  {
    label: "Birdie — takes the lead",
    change: makeChange({}),
  },
  {
    label: "Double bogey with OB — drops from 2nd to 3rd",
    change: makeChange({
      playerName: "Aki",
      playerId: 3,
      prevPlayer: { Name: "Aki", Diff: 0, OrderNumber: 2, ClassName: "MPO" },
      newPlayer:  { Name: "Aki", Diff: +2, OrderNumber: 3, ClassName: "MPO" },
      hole: 11,
      holeResult: { Result: "5", Diff: 2, PEN: 1 },
    }),
  },
  {
    label: "Ace — already leading",
    change: makeChange({
      playerName: "Riki",
      playerId: 4,
      prevPlayer: { Name: "Riki", Diff: -2, OrderNumber: 1, ClassName: "MPO" },
      newPlayer:  { Name: "Riki", Diff: -4, OrderNumber: 1, ClassName: "MPO" },
      hole: 2,
      holeResult: { Result: "1", Diff: -2, PEN: 0 },
    }),
  },
];

async function main() {
  console.log(`Model: ${process.env.OLLAMA_MODEL ?? "gemma3"}`);
  console.log(`URL:   ${process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"}\n`);

  for (const tc of testCases) {
    console.log(`--- ${tc.label} ---`);
    const start = Date.now();
    try {
      const result = await generateLlmComment(tc.change, "Weekly Doubles", results);
      console.log(`Response (${Date.now() - start}ms):\n${result}\n`);
    } catch (err: any) {
      console.error(`FAILED: ${err.message}\n`);
    }
  }
}

main();
