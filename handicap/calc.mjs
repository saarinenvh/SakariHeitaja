import { getData } from "../async/functions.mjs";
import { karkkila, kisis, hamis, kaatis } from "./handicaps.mjs";

let counted = false;
let baseUrl = `https://discgolfmetrix.com/api.php?content=result&id=`;

const competitions = [karkkila, kaatis, kisis, hamis];
const points = [
  100,
  90,
  83,
  75,
  70,
  65,
  60,
  55,
  53,
  50,
  48,
  45,
  43,
  40,
  38,
  35,
  33,
  30,
  28,
  25,
  23,
  20
];
const handicaps = [
  { score: 890, handicap: -1 },
  { score: 880, handicap: -2 },
  { score: 870, handicap: -3 },
  { score: 860, handicap: -4 },
  { score: 850, handicap: -5 },
  { score: 840, handicap: -6 },
  { score: 830, handicap: -7 },
  { score: 820, handicap: -8 },
  { score: 810, handicap: -9 },
  { score: 800, handicap: -10 },
  { score: 790, handicap: -11 },
  { score: 780, handicap: -12 },
  { score: 770, handicap: -13 },
  { score: 760, handicap: -14 },
  { score: 750, handicap: -15 },
  { score: 740, handicap: -16 },
  { score: 730, handicap: -17 },
  { score: 720, handicap: -18 }
];

class HandicappedScores {
  async countScores() {
    this.countHandicaps();
    for (let competition of competitions) {
      if (!counted) {
        for (let competitionId of competition.competitionIds) {
          const changes = await getData(`${baseUrl}${competitionId}`).then(
            newData => {
              try {
                if (newData.Competition != null) {
                  for (let player of competition.players) {
                    let playerData = newData.Competition.Results.find(
                      n => n.Name == player.name
                    );
                    player["score"] = player["score"] + playerData.Sum;
                    player["handicappedScore"] =
                      player["handicappedScore"] +
                      playerData.Sum +
                      player.handicap;
                  }
                }
              } catch (e) {
                console.log(e);
                return "Virhe laskiessa tasoituksia";
              }
            }
          );
        }
      }
      competition.players = [...competition.players].sort(
        (first, second) => first.handicappedScore - second.handicappedScore
      );
      this.rankPlayers(competition);
    }
    counted = true;
  }

  getHandicappedResults(args, chatId) {
    let text = undefined;

    switch (args) {
      case "kaatis":
        text = this.createCompetitionMessage(
          competitions.find(n => n.competitionName == "Kaatis")
        );
        break;
      case "karkkila":
        text = this.createCompetitionMessage(
          competitions.find(n => n.competitionName == "Karkkila")
        );
        break;
      case "kisis":
        text = this.createCompetitionMessage(
          competitions.find(n => n.competitionName == "Kisis")
        );
        break;
      case "hamis":
        text = this.createCompetitionMessage(
          competitions.find(n => n.competitionName == "Hamis")
        );
        break;
      case "all":
        console.log("asdf");
        text = "";
        for (let competition of competitions) {
          text += this.createCompetitionMessage(competition) + "\n";
        }
        text += this.createOverallMessage();
        break;
      case "overall":
        text = this.createOverallMessage();
        break;
      default:
        break;
    }
    return text;
  }

  createCompetitionMessage(competition) {
    let text = `***** ${competition.competitionName} ***** \n\n`;
    text += `<code>${this.fillString("Sija, Nimi", 22)} ${this.fillString(
      "Tulos",
      5
    )} ${this.fillString("Pisteet", 7)}</code>\n`;
    competition.players.forEach(
      n =>
        (text += `<code>${this.fillString(
          n.rank + ". " + n.name,
          22
        )} ${this.fillString(
          n.handicappedScore.toString(),
          5
        )} ${this.fillString(n.points.toString() + "pst", 7)} </code>\n`)
    );
    return text;
  }

  createOverallMessage() {
    let overallText = "";
    let overall = this.countOverall(competitions);
    overall = [...overall].sort(
      (first, second) => second.points - first.points
    );
    overallText = "**** FGS Sankaritour 2019 - Kokonaistilanne **** \n\n";
    overallText += `<code>${this.fillString(
      "Sija, Nimi",
      22
    )} ${this.fillString("Pisteet", 7)}</code>\n`;
    overall.forEach(
      (n, index) =>
        (overallText += `<code>${this.fillString(
          (index + 1).toString() + ". " + n.name,
          22
        )} ${this.fillString(n.points + "pst", 7)}\n</code>`)
    );
    return overallText;
  }

  fillString(s, n) {
    const diff = n - s.length;
    return `${s + this.createEmptySpace(diff)}`;
  }

  createEmptySpace(n) {
    let text = "";
    for (let i = 0; i < n; i++) {
      text += "\t";
    }
    return text;
  }

  rankPlayers(competition) {
    // Check same scores
    for (let i = 0; i < competition.players.length; i++) {
      if (
        i - 1 > 0 &&
        competition.players[i - 1].handicappedScore ==
          competition.players[i].handicappedScore
      ) {
        competition.players[i]["rank"] = competition.players[i - 1].rank;
        // countSharedPoints()
      } else {
        competition.players[i]["rank"] = i + 1;
      }
      competition.players[i]["points"] = points[i];
    }
    this.findSameRanksAndSharePoints(competition);
  }

  findSameRanksAndSharePoints(competition) {
    let rankObj = {};

    // groups players by rank
    for (let i = 0; i < competition.players.length; i++) {
      rankObj[i + 1] = competition.players.filter(n => n.rank == i + 1);
    }

    // finds all groups that are larger than 1 and calculates the shared score
    for (let key of Object.keys(rankObj)) {
      if (rankObj[key].length > 1) {
        const totalScore = rankObj[key].reduce(
          (sum, obj) => sum + obj.points,
          0
        );
        const points = Math.floor(totalScore / rankObj[key].length);
        for (let player of rankObj[key]) {
          competition.players.find(n => n.name == player.name).points = points;
        }
      }
    }
  }

  countHandicaps() {
    for (let competition of competitions) {
      for (let player of competition.players) {
        player["rating"] = Math.floor(player["rating"] / 10) * 10;
        if (player["rating"] >= 900) {
          player["handicap"] = 0;
        } else if (player["rating"] < 720) {
          player["handicap"] = -18;
        } else {
          player["handicap"] = handicaps.find(
            n => n.score == player.rating
          ).handicap;
        }
      }
    }
  }

  countOverall(competitions) {
    let text = "";
    let rankObj = {};
    for (let competition of competitions) {
      for (let player of competition.players) {
        if (!Object.keys(rankObj).includes(player.name)) {
          rankObj[player.name] = { name: player.name, points: [] };
        }
        rankObj[player.name]["points"].push(player.points);
      }
    }
    return Object.entries(this.filterBestScoresAndSum(rankObj)).map(n => n[1]);
  }

  filterBestScoresAndSum(obj) {
    for (let key of Object.keys(obj)) {
      if (obj[key].points.length > 3) {
        let min = Math.min(...obj[key].points);
        obj[key].points = obj[key].points.filter(e => e != min);
      }
      obj[key].points = obj[key].points.reduce((sum, obj) => sum + obj, 0);
    }
    return obj;
  }
}

export default new HandicappedScores();
