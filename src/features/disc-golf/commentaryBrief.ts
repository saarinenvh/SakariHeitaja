import { Change, MetrixPlayerResult, HoleEntry } from "../../types/metrix";
import { CommentaryBrief } from "../../types/commentary";
import { getScoreType, scoreTexts, startTexts, verbs, descriptions } from "./commentary";
import { buildProfileSnippet } from "./playerProfiles";

function sample<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function getHoleScoreLabel(diff: number, result: string): string {
  if (parseInt(result) === 1) return "ässä (hole-in-one)";
  if (diff <= -3) return "albatrossi";
  if (diff === -2) return "kotka (eagle)";
  if (diff === -1) return "birdie";
  if (diff === 0)  return "par";
  if (diff === 1)  return "bogi";
  if (diff === 2)  return "tuplabogi";
  return `iso ylitys (+${diff})`;
}

function computeStandingImpact(
  prevOrder: number,
  nextOrder: number,
  nextPlayer: MetrixPlayerResult,
  results: MetrixPlayerResult[]
): string | undefined {
  const leader = results.find(r => r.OrderNumber === 1);
  if (!leader) return undefined;

  const tiedAtTop = results.filter(r => r.OrderNumber === 1).length > 1;

  if (nextOrder === 1) {
    if (prevOrder !== 1) return tiedAtTop ? "moved into shared lead" : "moved into solo lead";
    return tiedAtTop ? "tied for lead" : "still leading";
  }
  if (prevOrder === 1 && nextOrder > 1) return "dropped from lead";

  const gap = nextPlayer.Diff - leader.Diff;
  if (nextOrder <= 3 && gap <= 2) return "close behind leader";
  if (prevOrder > nextOrder && nextOrder <= 5) return "gained ground on leaders";
  return undefined;
}

function computeCompetitionPhase(playerResults: HoleEntry[], holeIndex: number): "early" | "mid" | "late" {
  const totalHoles = playerResults.length;
  if (totalHoles === 0) return "mid";
  const ratio = (holeIndex + 1) / totalHoles;
  if (ratio <= 0.35) return "early";
  if (ratio <= 0.70) return "mid";
  return "late";
}

const standingImpactFi: Record<string, string> = {
  "moved into solo lead":   "nousi yksin johtoon",
  "moved into shared lead": "nousi tasajohtonn",
  "dropped from lead":      "putosi johdosta",
  "tied for lead":          "tasatilanteessa johdossa",
  "still leading":          "johtaa edelleen",
  "close behind leader":    "aivan johtajan takana",
  "gained ground on leaders": "kirinyt lähemmäs kärkeä",
};

export function buildCommentaryBrief(change: Change, results: MetrixPlayerResult[], chatId: number): CommentaryBrief {
  const { newPlayer, prevPlayer, holeResult, hole } = change;
  const type = getScoreType(holeResult);

  const eventQuality: "good" | "neutral" | "bad" =
    ["ace", "eagle", "albatross", "birdie"].includes(type) ? "good"
    : type === "par" ? "neutral"
    : "bad";

  const positionChange: "moved_up" | "moved_down" | "no_change" =
    newPlayer.OrderNumber < prevPlayer.OrderNumber ? "moved_up"
    : newPlayer.OrderNumber > prevPlayer.OrderNumber ? "moved_down"
    : "no_change";

  const standingImpactEn = computeStandingImpact(prevPlayer.OrderNumber, newPlayer.OrderNumber, newPlayer, results);
  const standingImpact = standingImpactEn ? standingImpactFi[standingImpactEn] ?? standingImpactEn : undefined;

  const competitionPhase = computeCompetitionPhase(newPlayer.PlayerResults ?? [], hole);
  const pressureMoment = competitionPhase === "late" && (newPlayer.OrderNumber <= 3 || prevPlayer.OrderNumber <= 3);
  const styleMode: "safe" | "chaos" = (pressureMoment || !!standingImpact) ? "safe" : "chaos";

  const reactionPool = eventQuality === "good" ? startTexts.good
    : eventQuality === "neutral" ? startTexts.neutral
    : startTexts.bad;

  const scoreSlangPool = type !== "worse"
    ? scoreTexts[type]
    : [`iso ylitys (+${holeResult.Diff})`];

  return {
    playerName: newPlayer.Name,
    holeNumber: hole + 1,
    holeScoreLabel: getHoleScoreLabel(holeResult.Diff, holeResult.Result),
    eventQuality,
    ob: holeResult.PEN > 0,
    positionChange,
    standingImpact,
    competitionPhase,
    pressureMoment,
    styleMode,
    reactionHints:   sample(reactionPool, 2),
    scoreSlangHints: sample(scoreSlangPool, 2),
    verbHints:       sample(verbs, 2),
    descriptionHints: sample(descriptions, 2),
    playerProfile: buildProfileSnippet(chatId, newPlayer.Name),
  };
}

export function buildPromptFromBrief(brief: CommentaryBrief): string {
  const lines: string[] = [
    `Pelaaja: ${brief.playerName}`,
    `Tulos: ${brief.holeScoreLabel}${brief.ob ? " + OB" : ""}`,
    `Tapahtuma: ${brief.eventQuality}`,
  ];

  if (brief.playerProfile) lines.push(`Pelaajan taustatiedot: ${brief.playerProfile}`);

  if (brief.positionChange === "moved_up")   lines.push("Sijoitusvaikutus: nousi sijoituksissa");
  if (brief.positionChange === "moved_down") lines.push("Sijoitusvaikutus: putosi sijoituksissa");

  if (brief.standingImpact) lines.push(`Kisatilanne: ${brief.standingImpact}`);
  if (brief.pressureMoment) lines.push("Vaihe: loppukiri, paine päällä");

  lines.push("");
  lines.push(`Reaktiovihjeitä (inspiraatioksi — älä kopioi suoraan, keksi oma): ${brief.reactionHints.join(", ")}`);
  lines.push(`Tulosnimivaihtoehtoja (inspiraatioksi — älä kopioi suoraan): ${brief.scoreSlangHints.join(", ")}`);
  lines.push(`Verbivaihtoehtoja (inspiraatioksi): ${brief.verbHints.join(", ")}`);

  const needsThirdSentence = !!(brief.standingImpact || brief.pressureMoment);
  lines.push("");
  lines.push(needsThirdSentence
    ? "Kirjoita 3 lausetta. Kolmas lause: lyhyt reaktio kisatilanteeseen."
    : "Kirjoita 2 lausetta."
  );

  return lines.join("\n");
}
