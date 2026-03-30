export interface MetrixHoleResult {
  Result: string;
  Diff: number;
  PEN: number;
}

export type HoleEntry = MetrixHoleResult | [];

export interface MetrixPlayerResult {
  Name: string;
  Sum?: number;
  Diff: number;
  OrderNumber: number;
  ClassName: string;
  Group?: string;
  DNF?: string | null;
  PlayerResults?: HoleEntry[];
}

export interface MetrixCompetition {
  Name: string;
  Date: string;
  CourseName: string;
  Results: MetrixPlayerResult[];
}

export interface MetrixApiResponse {
  Competition: MetrixCompetition;
}

export type TrackedPlayer = MetrixPlayerResult & { id: number };

export interface Change {
  playerName: string;
  playerId: number;
  prevPlayer: MetrixPlayerResult;
  newPlayer: MetrixPlayerResult;
  hole: number;
  holeResult: MetrixHoleResult;
}
