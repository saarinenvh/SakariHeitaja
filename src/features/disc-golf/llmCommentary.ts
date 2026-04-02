import { generate, loadPrompt } from "../../shared/llm/ollamaClient";
import { generateComment } from "./commentary";
import { buildCommentaryBrief, buildPromptFromBrief } from "./commentaryBrief";
import { Change, MetrixPlayerResult } from "../../types/metrix";
import Logger from "js-logger";

let systemPrompt: string | null = null;

function getSystemPrompt(): string {
  if (!systemPrompt) {
    const base = loadPrompt("commentator.md");
    systemPrompt = base;
  }
  return systemPrompt;
}

function addPlusSign(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}


function holeScoreLabel(diff: number, result: string): string {
  if (parseInt(result) === 1) return "ässä";
  if (diff <= -3) return "albatrossi";
  if (diff === -2) return "kotka";
  if (diff === -1) return "birdie";
  if (diff === 0)  return "par";
  if (diff === 1)  return "bogi";
  if (diff === 2)  return "tuplabogi";
  return `+${diff}`;
}

function buildStructuredTail(change: Change): string {
  const { newPlayer, prevPlayer, holeResult } = change;
  const score = holeScoreLabel(holeResult.Diff, holeResult.Result);
  let meta = `${score} | ${newPlayer.Name} | ${addPlusSign(newPlayer.Diff)} | sija ${newPlayer.OrderNumber}`;

  if (newPlayer.OrderNumber !== prevPlayer.OrderNumber) {
    meta += newPlayer.OrderNumber < prevPlayer.OrderNumber ? " ↑" : " ↓";
  }

  return `\n<blockquote>${meta}</blockquote>`;
}

export async function generateLlmComment(change: Change, _competitionName: string, results: MetrixPlayerResult[], chatId: number): Promise<string> {
  try {
    const brief = buildCommentaryBrief(change, results, chatId);
    const context = buildPromptFromBrief(brief);

    const flavor = (await generate(
      [
        { role: "system", content: getSystemPrompt() },
        { role: "user",   content: context },
      ],
      { temperature: 0.85, num_predict: 100, num_ctx: 4096 },
    )).replace(/\n+/g, " ").trim();
    const PROMPT_LEAK_MARKERS = ["Pelaaja:", "Reaktiovihjeitä:", "Tulosnimivaihtoehtoja:", "Verbivaihtoehtoja:", "Kirjoita 2", "Kirjoita 3", "Kirjoita vain"];
    if (PROMPT_LEAK_MARKERS.some(m => flavor.includes(m))) {
      Logger.warn(`LLM commentary prompt leak detected, using fallback`);
      return generateComment(change, results);
    }

    return `${flavor} ${buildStructuredTail(change)}`;
  } catch (err: any) {
    Logger.warn(`LLM commentary failed, using fallback: ${err.message}`);
    return generateComment(change, results);
  }
}
