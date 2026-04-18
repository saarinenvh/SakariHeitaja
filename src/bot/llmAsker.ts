import { generate, loadPrompt, loadContext, OllamaTool } from "../shared/llm/ollamaClient";
import { fetchBracket } from "../shared/challonge";
import Logger from "js-logger";

let systemPrompt: string | null = null;

function getSystemPrompt(): string {
  if (!systemPrompt) {
    const base = loadPrompt("asker.md");
    const context = loadContext(["seura_context.md", "sankaritour_context.md", "matchplay_context.md"]);
    systemPrompt = context ? `${base}\n\n---\n\n${context}` : base;
  }
  return systemPrompt;
}

const BRACKET_TOOL: OllamaTool = {
  type: "function",
  function: {
    name: "get_match_play_bracket",
    description: "Fetches the current match play tournament bracket. Use this when asked about match play standings, who is playing who, next opponents, eliminated players, or bracket results.",
    parameters: { type: "object", properties: {}, required: [] },
  },
};

async function toolHandler(name: string): Promise<string> {
  if (name === "get_match_play_bracket") {
    try {
      return await fetchBracket();
    } catch (err: any) {
      Logger.warn(`Bracket fetch failed: ${err.message}`);
      return "Could not fetch the bracket at this time.";
    }
  }
  return "Unknown tool.";
}

export async function llmAnswer(question: string, senderName?: string): Promise<string | null> {
  try {
    const userContent = senderName
      ? `[Kysyjä: ${senderName}]\n${question}`
      : question;

    const answer = await generate(
      [
        { role: "system", content: getSystemPrompt() },
        { role: "user",   content: userContent },
      ],
      { temperature: 0.6, num_predict: 350, num_ctx: 4096 },
      [BRACKET_TOOL],
      toolHandler,
    );
    return answer;
  } catch (err: any) {
    Logger.warn(`LLM asker failed: ${err.message}`);
    return null;
  }
}
