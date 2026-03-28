import { describe, it, expect } from "vitest";
import { generateComment, generateHeader } from "./commentary";
import { Change } from "../../types/metrix";

function makeChange(result: string, diff: number, pen = 0): Change {
  return {
    playerName: "Matti",
    playerId: 1,
    hole: 0,
    holeResult: { Result: result, Diff: diff, PEN: pen },
    prevPlayer: { Name: "Matti", Diff: diff - 1, Sum: 54, OrderNumber: 2, ClassName: "MPO" },
    newPlayer:  { Name: "Matti", Diff: diff,     Sum: 55, OrderNumber: 3, ClassName: "MPO" },
  };
}

describe("generateComment", () => {
  it("includes the player name", () => {
    const comment = generateComment(makeChange("3", 0));
    expect(comment).toContain("Matti");
  });

  it("includes current diff and order number", () => {
    const comment = generateComment(makeChange("3", 2));
    expect(comment).toContain("+2");
    expect(comment).toContain("3");  // OrderNumber
  });

  it("includes ace text for hole-in-one", () => {
    const comment = generateComment(makeChange("1", -3));
    expect(comment.toUpperCase()).toContain("ÄSS");
  });

  it("includes eagle text for diff -2", () => {
    const comment = generateComment(makeChange("2", -2));
    const upper = comment.toUpperCase();
    expect(upper.includes("EAGLE") || upper.includes("KOTKA")).toBe(true);
  });

  it("includes OB phrase when PEN > 0", () => {
    const comment = generateComment(makeChange("5", 2, 1));
    expect(comment.toUpperCase()).toContain("OB");
  });

  it("does not include OB phrase when PEN is 0", () => {
    const comment = generateComment(makeChange("3", 0, 0));
    expect(comment.toUpperCase()).not.toContain("OB");
  });

  it("returns a non-empty string for any valid input", () => {
    for (const [result, diff] of [["1", -3], ["2", -2], ["3", -1], ["4", 0], ["5", 1], ["6", 2], ["8", 4]] as const) {
      expect(generateComment(makeChange(result, diff)).length).toBeGreaterThan(0);
    }
  });
});

describe("generateHeader", () => {
  it("returns a non-empty string", () => {
    expect(generateHeader().length).toBeGreaterThan(0);
  });
});
