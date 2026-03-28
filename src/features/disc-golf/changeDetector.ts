import { MetrixApiResponse, MetrixHoleResult, TrackedPlayer, Change, HoleEntry } from "../../types/metrix";

interface NormalizedHole {
  Result: string;
  Diff: string | number;
  PEN: number;
  Played: boolean;
  Index: number;
}

function getChangedHole(prevResults: HoleEntry[], newResults: HoleEntry[]): number {
  const normalize = (results: HoleEntry[]): NormalizedHole[] =>
    results.map((item, index) =>
      Array.isArray(item)
        ? { Result: "", Diff: "", PEN: 0, Played: false, Index: index }
        : { ...(item as MetrixHoleResult), Played: true, Index: index }
    );

  const oldHoles = normalize(prevResults);
  const newHoles = normalize(newResults);

  for (let i = 0; i < newHoles.length; i++) {
    if (newHoles[i].Result !== oldHoles[i]?.Result) return i;
  }
  return -1;
}

export function detectChanges(
  prevData: MetrixApiResponse,
  newData: MetrixApiResponse,
  trackedPlayers: TrackedPlayer[]
): Change[] {
  const changes: Change[] = [];

  for (const tracked of trackedPlayers) {
    const prevPlayer = prevData.Competition.Results.find(r => r.Name === tracked.Name);
    const newPlayer = newData.Competition.Results.find(r => r.Name === tracked.Name);

    if (!prevPlayer || !newPlayer) continue;
    if (!("Sum" in prevPlayer)) continue;
    if (prevPlayer.Sum === newPlayer.Sum) continue;

    const hole = getChangedHole(
      prevPlayer.PlayerResults ?? [],
      newPlayer.PlayerResults ?? []
    );

    if (hole === -1) continue;

    const holeResult = newPlayer.PlayerResults?.[hole];
    if (!holeResult || Array.isArray(holeResult)) continue;

    changes.push({
      playerName: tracked.Name,
      playerId: tracked.id,
      prevPlayer,
      newPlayer,
      hole,
      holeResult,
    });
  }

  return changes;
}

export function hasCompetitionEnded(trackedPlayers: TrackedPlayer[]): boolean {
  if (trackedPlayers.length === 0) return false;
  return trackedPlayers.every(player => {
    if (!player.PlayerResults || player.PlayerResults.length === 0) return false;
    return player.PlayerResults.every(hole => !Array.isArray(hole));
  });
}
