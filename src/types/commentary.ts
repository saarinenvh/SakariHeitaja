export type CommentaryBrief = {
  playerName: string;
  holeNumber: number;
  holeScoreLabel: string;
  eventQuality: "good" | "neutral" | "bad";
  ob: boolean;
  positionChange: "moved_up" | "moved_down" | "no_change";
  standingImpact?: string;
  competitionPhase: "early" | "mid" | "late";
  pressureMoment: boolean;
  styleMode: "safe" | "chaos";
  playerProfile?: string;
};
