import Logger from "js-logger";

const TOURNAMENT_URL = process.env.CHALLONGE_TOURNAMENT_URL ?? "https://challonge.com/yvept9b5";

export async function fetchBracket(): Promise<string> {
  // Try JSON endpoint first
  try {
    const jsonUrl = TOURNAMENT_URL.replace(/\/?$/, ".json");
    const res = await fetch(jsonUrl, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    });

    if (res.ok) {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("json")) {
        const data = await res.json() as any;
        return formatJsonBracket(data);
      }
    }
  } catch (err: any) {
    Logger.debug(`Challonge JSON endpoint failed: ${err.message}, trying HTML`);
  }

  // Fall back to HTML — bracket data is embedded in a script tag
  const res = await fetch(TOURNAMENT_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Challonge fetch ${res.status}`);

  const html = await res.text();
  return extractFromHtml(html);
}

function formatJsonBracket(data: any): string {
  // Support both old Challonge API format and _initialStoreState['TournamentStore'] format
  const t = data?.tournament ?? data;
  const tournamentName = t?.name ?? data?.tournament?.name ?? "Tournament";

  const lines: string[] = [`=== Match Play Bracket: ${tournamentName} ===`, ""];

  // New format: matches_by_round is an object keyed by round number string
  // Each value is an array of match objects with player1/player2 as nested objects
  if (data?.matches_by_round) {
    const matchesByRound: Record<string, any[]> = data.matches_by_round;
    const roundKeys = Object.keys(matchesByRound)
      .map(Number)
      .sort((a, b) => a - b);

    for (const round of roundKeys) {
      const label = round > 0 ? `Winners Round ${round}` : `Losers Round ${Math.abs(round)}`;
      lines.push(`${label}:`);
      for (const m of matchesByRound[String(round)]) {
        const p1 = m.player1?.display_name ?? m.player1?.name ?? "TBD";
        const p2 = m.player2?.display_name ?? m.player2?.name ?? "TBD";
        if (m.state === "complete") {
          const winnerId = m.winner_id;
          const winner = (m.player1?.id === winnerId ? p1 : m.player2?.id === winnerId ? p2 : "?");
          const scores = Array.isArray(m.scores) ? m.scores.map((s: any) => `${s.player1_score}-${s.player2_score}`).join(", ") : "";
          lines.push(`  ${p1} vs ${p2} → Winner: ${winner}${scores ? ` (${scores})` : ""}`);
        } else if (m.state === "open") {
          lines.push(`  ${p1} vs ${p2} ← CURRENT MATCH`);
        } else {
          lines.push(`  ${p1} vs ${p2} (upcoming)`);
        }
      }
      lines.push("");
    }

    Logger.debug(`Challonge _initialStoreState bracket parsed`);
    return lines.join("\n");
  }

  // Old format: flat matches array with player1_id/player2_id
  const participants: any[] = t?.participants ?? [];
  const matches: any[] = t?.matches ?? [];

  const nameById = new Map<number, string>();
  for (const p of participants) {
    const part = p?.participant ?? p;
    nameById.set(part.id, part.name ?? part.display_name ?? `Player ${part.id}`);
  }

  const name = (id: number | null) => (id ? nameById.get(id) ?? "TBD" : "TBD");

  const rounds = new Map<number, any[]>();
  for (const m of matches) {
    const match = m?.match ?? m;
    const r = rounds.get(match.round) ?? [];
    r.push(match);
    rounds.set(match.round, r);
  }

  for (const [round, ms] of [...rounds.entries()].sort(([a], [b]) => a - b)) {
    lines.push(`Round ${round}:`);
    for (const m of ms) {
      const p1 = name(m.player1_id);
      const p2 = name(m.player2_id);
      if (m.state === "complete") {
        lines.push(`  ${p1} vs ${p2} → Winner: ${name(m.winner_id)} (${m.scores_csv})`);
      } else if (m.state === "open") {
        lines.push(`  ${p1} vs ${p2} ← CURRENT MATCH`);
      } else {
        lines.push(`  ${p1} vs ${p2} (upcoming)`);
      }
    }
    lines.push("");
  }

  Logger.debug(`Challonge JSON bracket parsed`);
  return lines.join("\n");
}

function extractFromHtml(html: string): string {
  // Challonge embeds bracket data in script tags as JSON
  const patterns = [
    // Current Challonge format (as of 2026): TournamentStore in _initialStoreState
    /window\._initialStoreState\s*\[\s*['"]TournamentStore['"]\s*\]\s*=\s*(\{[\s\S]*?\});\s*\n/,
    // Older formats
    /var\s+bracket_data\s*=\s*(\{[\s\S]*?\});/,
    /Challonge\.bracket\s*=\s*(\{[\s\S]*?\});/,
    /gon\.bracket\s*=\s*(\{[\s\S]*?\});/,
    /window\.BRACKET_DATA\s*=\s*(\{[\s\S]*?\});/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try {
        const data = JSON.parse(match[1]);
        Logger.debug(`Challonge HTML bracket data extracted via pattern: ${pattern.source.slice(0, 30)}`);
        return formatJsonBracket(data);
      } catch {
        continue;
      }
    }
  }

  // Last resort: return a chunk of the page and let the LLM figure it out
  // Strip scripts/styles and take meaningful text
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  Logger.debug(`Challonge: returning raw text extract (no structured data found)`);
  return `Challonge bracket page content:\n${text}`;
}
