import { generate, loadPrompt } from "../../shared/llm/ollamaClient";
import { generateComment, generateFlavor } from "./commentary";
import { Change, MetrixPlayerResult } from "../../types/metrix";
import Logger from "js-logger";

let systemPrompt: string | null = null;

function getSystemPrompt(): string {
  if (!systemPrompt) systemPrompt = loadPrompt("commentator.txt");
  return systemPrompt;
}

function addPlusSign(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}


function getStandingLabel(player: MetrixPlayerResult, results: MetrixPlayerResult[]): string | null {
  const leader = results.find(r => r.OrderNumber === 1);
  if (!leader) return null;
  if (player.OrderNumber === 1) {
    const tiedAtTop = results.filter(r => r.OrderNumber === 1).length > 1;
    return tiedAtTop ? "tasatilanteessa johdossa muiden kanssa" : "johtaa kisaa";
  }
  const gap = player.Diff - leader.Diff;
  if (gap === 0) return "tasatilanteessa johtajasta";
  if (player.OrderNumber <= 3 && gap <= 2) return "aivan johtajan takana";
  return null;
}

function ordinalTo(n: number): string {
  const map: Record<number, string> = {
    1: "kärkeen", 2: "toiseksi", 3: "kolmanneksi", 4: "neljänneksi",
    5: "viidenneksi", 6: "kuudenneksi", 7: "seitsemänneksi", 8: "kahdeksanneksi",
    9: "yhdeksänneksi", 10: "kymmenenneksi",
  };
  return map[n] ?? `sijalle ${n}`;
}

function getPositionDeltaLabel(prev: number, next: number): string | null {
  if (prev === next) return null;
  const verb = prev > next ? "nousi" : "putosi";
  return `${verb} ${ordinalTo(next)}`;
}

function buildContext(change: Change, competitionName: string, results: MetrixPlayerResult[]): string {
  const { newPlayer, prevPlayer } = change;
  const draft        = generateFlavor(change);
  const standing     = getStandingLabel(newPlayer, results);
  const positionMove = getPositionDeltaLabel(prevPlayer.OrderNumber, newPlayer.OrderNumber);

  return [
    `Kisa: ${competitionName}`,
    `Pelaaja: ${newPlayer.Name}`,
    ``,
    `Luonnos kommentista:`,
    `"${draft}"`,
    ``,
    positionMove ? `Sijoitusmuutos: ${positionMove}` : null,
    standing     ? `Kisatilanne: pelaaja ${standing}` : null,
    ``,
    `Muokkaa luonnosta Sakke-tyylisemmäksi puhekielellä. ` +
    `Käytä VAIN pelaajan nimeä "${newPlayer.Name}" — älä keksi tai lisää muita nimiä. ` +
    `Jos sijoitusmuutos on annettu, muodosta siitä luonnollinen lause kommentin sisälle — älä listaa sitä erikseen. ` +
    `Reagoi myös kisatilanteeseen jos se on annettu. ` +
    `Pidä kommentti lyhyenä (1–2 lausetta). Älä lisää lukuja tai sijoituksia. Tulosta vain valmis kommentti.`,
  ].filter(line => line !== null).join("\n");
}

function buildStructuredTail(change: Change): string {
  const { newPlayer } = change;
  return `tällä hetkellä tuloksessa <b>${addPlusSign(newPlayer.Diff)}</b> ja sijalla <b>${newPlayer.OrderNumber}</b>`;
}

export async function generateLlmComment(change: Change, competitionName: string, results: MetrixPlayerResult[]): Promise<string> {
  try {
    const context = buildContext(change, competitionName, results);
    const flavor = await generate(
      [
        { role: "system", content: getSystemPrompt() },
        { role: "user",   content: context },
      ],
      { temperature: 0.85, num_predict: 100 },
    );

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
