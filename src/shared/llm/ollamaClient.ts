import { readFileSync } from "fs";
import { join } from "path";
import Logger from "js-logger";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaOptions {
  temperature?: number;
  num_predict?: number;
}

const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const model   = process.env.OLLAMA_MODEL   ?? "gemma3";

export async function generate(messages: OllamaMessage[], options: OllamaOptions = {}): Promise<string> {
  const start = Date.now();

  const body = {
    model,
    messages,
    stream: false,
    options: {
      temperature: options.temperature ?? 0.8,
      num_predict: options.num_predict ?? 120,
    },
  };

  const truncated = messages.at(-1)?.content.slice(0, 80) ?? "";
  Logger.debug(`LLM request → model=${model} url=${baseUrl} input="${truncated}..."`);

  const res = await fetch(`${baseUrl}/api/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json() as { message?: { content?: string } };
  const text = json?.message?.content?.trim() ?? "";

  if (!text) throw new Error("Ollama returned empty response");

  // Strip wrapping quotes some models add around their output
  // Covers ASCII quotes and common Unicode curly/low quotes
  const result = text
    .replace(/^[\u0022\u0027\u201C\u201D\u201E\u2018\u2019]+/, "")
    .replace(/[\u0022\u0027\u201C\u201D\u2018\u2019]+$/, "")
    .trim() || text;

  const ms = Date.now() - start;
  Logger.debug(`LLM response ← ${ms}ms "${result.slice(0, 80)}..."`);

  return result;
}

export function loadPrompt(filename: string): string {
  const filePath = join(__dirname, "../../bot/system-prompts", filename);
  return readFileSync(filePath, "utf-8").trim();
}
