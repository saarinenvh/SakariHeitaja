import { generate, loadPrompt, loadContext } from "../shared/llm/ollamaClient";
import Logger from "js-logger";

let systemPrompt: string | null = null;

function getSystemPrompt(): string {
  if (!systemPrompt) {
    const base = loadPrompt("asker.md");
    const context = loadContext(["seura_context.md", "sankaritour_context.md"]);
    systemPrompt = context ? `${base}\n\n---\n\n${context}` : base;
  }
  return systemPrompt;
}

export async function llmAnswer(question: string): Promise<string | null> {
  try {
    const answer = await generate(
      [
        { role: "system", content: getSystemPrompt() },
        { role: "user",   content: question },
      ],
      { temperature: 0.6, num_predict: 350, num_ctx: 4096 },
    );
    return answer;
  } catch (err: any) {
    Logger.warn(`LLM asker failed: ${err.message}`);
    return null;
  }
}
