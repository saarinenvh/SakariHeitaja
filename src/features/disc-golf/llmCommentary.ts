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

function ordinalTo(n: number): string {
  const map: Record<number, string> = {
    1: "kärkeen", 2: "toiseksi", 3: "kolmanneksi", 4: "neljänneksi",
    5: "viidenneksi", 6: "kuudenneksi", 7: "seitsemänneksi", 8: "kahdeksanneksi",
    9: "yhdeksänneksi", 10: "kymmenenneksi",
  };
  return map[n] ?? `sijalle ${n}`;
}

function buildStructuredTail(change: Change): string {
  const { newPlayer, prevPlayer } = change;
  const base = `Tällä hetkellä tuloksessa <b>${addPlusSign(newPlayer.Diff)}</b> ja sijalla <b>${newPlayer.OrderNumber}</b>`;

  if (newPlayer.OrderNumber !== prevPlayer.OrderNumber) {
    const verb = prevPlayer.OrderNumber > newPlayer.OrderNumber ? "nousi" : "putosi";
    return `${base} — ${verb} ${ordinalTo(newPlayer.OrderNumber)}`;
  }
  return base;
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
    const PROMPT_LEAK_MARKERS = ["Pelaaja:", "Reaktiovihjeitä:", "Tulosnimivaihtoehtoja:", "Verbivaihtoehtoja:", "Kirjoita 2", "Kirjoita 3"];
    if (PROMPT_LEAK_MARKERS.some(m => flavor.includes(m))) {
      Logger.warn(`LLM commentary prompt leak detected, using fallback`);
      return generateComment(change, results);
    }

    const firstName = change.newPlayer.Name.split(" ")[0].toLowerCase();
    if (!flavor.toLowerCase().includes(firstName)) {
      Logger.warn(`LLM commentary missing player name, using fallback`);
      return generateComment(change, results);
    }

    return `${flavor} ${buildStructuredTail(change)}`;
  } catch (err: any) {
    Logger.warn(`LLM commentary failed, using fallback: ${err.message}`);
    return generateComment(change, results);
  }
}
