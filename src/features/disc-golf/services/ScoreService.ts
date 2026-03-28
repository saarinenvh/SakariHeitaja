import { TrackedPlayer, Change } from "../../../types/metrix";
import { ScoreRow } from "../../../db/repositories/ScoreRepository";
import * as scoreRepo from "../../../db/repositories/ScoreRepository";
import * as courseRepo from "../../../db/repositories/CourseRepository";

export async function saveResults(
  players: TrackedPlayer[],
  chatId: number,
  courseId: number,
  competitionId: number
): Promise<void> {
  for (const player of players) {
    await scoreRepo.addResult(player.id, chatId, courseId, competitionId, player.Diff, player.Sum ?? 0);
  }
}

export async function saveSuperScore(change: Change, chatId: number, competitionId: number, courseName: string): Promise<void> {
  const { holeResult, playerId } = change;
  if (holeResult.Diff > -2) return;

  const course = await courseRepo.findByName(courseName);
  if (!course) return;

  const date = new Date().toISOString().slice(0, 10);

  if (parseInt(holeResult.Result) === 1) {
    await scoreRepo.addAce(date, playerId, chatId, course.id, competitionId);
  } else if (holeResult.Diff === -3) {
    await scoreRepo.addAlbatross(date, playerId, chatId, course.id, competitionId);
  } else if (holeResult.Diff === -2) {
    await scoreRepo.addEagle(date, playerId, chatId, course.id, competitionId);
  }
}

export async function getByCourseName(name: string, chatId: number): Promise<ScoreRow[]> {
  return scoreRepo.findByCourseName(name, chatId);
}

export async function getByCourseId(id: string | number, chatId: number): Promise<ScoreRow[]> {
  return scoreRepo.findByCourseId(id, chatId);
}
