import { generate, loadPrompt, loadContext } from "../shared/llm/ollamaClient";
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

const MATCH_PLAY_KEYWORDS = ["reikäpeli", "match play", "matchplay", "bracket", "vastustaj", "eliminoi", "pudonneet", "pudonnut", "kaavio", "turnauskaavio"];

function isMatchPlayQuestion(text: string): boolean {
  return MATCH_PLAY_KEYWORDS.some(kw => text.toLowerCase().includes(kw));
}

export async function llmAnswer(question: string, senderName?: string): Promise<string | null> {
  try {
    let userContent = senderName ? `[Kysyjä: ${senderName}]\n${question}` : question;

    if (isMatchPlayQuestion(question)) {
      try {
        const bracket = await fetchBracket();
        Logger.info(`Bracket fetched (${bracket.length} chars): ${bracket.slice(0, 300)}`);
        userContent += `\n\n[Bracket data]\n${bracket}`;
      } catch (err: any) {
        Logger.warn(`Bracket fetch failed: ${err.message}`);
      }
    }

    const answer = await generate(
      [
        { role: "system", content: getSystemPrompt() },
        { role: "user",   content: userContent },
      ],
      { temperature: 0.6, num_predict: 350, num_ctx: 4096 },
    );
    return answer;
  } catch (err: any) {
    Logger.warn(`LLM asker failed: ${err.message}`);
    return null;
  }
}
