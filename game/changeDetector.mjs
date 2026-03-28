/**
 * changeDetector — pure functions, no side effects, no I/O.
 *
 * Compares previous and new Metrix API snapshots and returns
 * a list of player changes to be processed by the orchestrator.
 */

/**
 * Returns the index of the hole that changed for a player, or -1 if none.
 */
export function getChangedHole(prevResults, newResults) {
  if (!prevResults || !newResults) return -1;

  const normalize = (results) =>
    results.map((item, index) =>
      Array.isArray(item)
        ? { Result: "", Diff: "", PEN: 0, Played: false, Index: index }
        : { ...item, Played: true, Index: index }
    );

  const oldHoles = normalize(prevResults);
  const newHoles = normalize(newResults);

  for (let i = 0; i < newHoles.length; i++) {
    if (newHoles[i].Result !== oldHoles[i].Result) return i;
  }

  return -1;
}

/**
 * Compares two API snapshots and returns an array of change objects
 * for tracked players whose score changed.
 *
 * Each change: { playerName, prevPlayer, newPlayer, hole, holeResult }
 */
export function detectChanges(prevData, newData, trackedPlayers) {
  const changes = [];

  for (const tracked of trackedPlayers) {
    const prevPlayer = prevData.Competition.Results.find(
      n => n.Name === tracked.Name
    );
    const newPlayer = newData.Competition.Results.find(
      n => n.Name === tracked.Name
    );

    if (!prevPlayer || !newPlayer) continue;

    // Skip players who haven't started yet
    if (!Object.keys(prevPlayer).includes("Sum")) continue;

    // No score change
    if (prevPlayer.Sum === newPlayer.Sum) continue;

    const hole = getChangedHole(
      prevPlayer.PlayerResults,
      newPlayer.PlayerResults
    );

    if (hole === -1) continue;

    changes.push({
      playerName: tracked.Name,
      playerId: tracked.id,
      prevPlayer,
      newPlayer,
      hole,
      holeResult: newPlayer.PlayerResults[hole],
    });
  }

  return changes;
}

/**
 * Returns true if all tracked players have completed every hole.
 */
export function hasCompetitionEnded(trackedPlayers) {
  if (trackedPlayers.length === 0) return false;
  return trackedPlayers.every(n => {
    if (!n.PlayerResults || n.PlayerResults.length === 0) return false;
    return n.PlayerResults.every(hole => !Array.isArray(hole));
  });
}
