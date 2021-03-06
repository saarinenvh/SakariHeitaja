import { getData } from "../async/functions.mjs";
import {
  narratives,
  scores,
  goodStart,
  badStart,
  neutralStart,
  verbs,
  outofbounds,
  throws
} from "../responses/game.mjs";
import { bot } from "../bot.mjs";
import * as queries from "../async/queries.mjs";
import * as Helpers from "../helpers/helpers.mjs";
import Logger from "js-logger";
import { loggerSettings } from "../logger.mjs";
Logger.useDefaults(loggerSettings);

class Game {
  constructor(id, metrixId, chatId, announced) {
    this.id = id;
    this.players = [];
    this.metrixId = metrixId;
    this.chatId = chatId;
    this.score = {};
    this.data = undefined;
    this.newRound = undefined;
    this.playersToFollow = [];
    this.baseUrl = `https://discgolfmetrix.com/api.php?content=result&id=`;
    this.following = true;
    this.competitionId;
    this.playersAnnounced = announced;
    this.saved = false;
    this.tickCounter = 2;
  }

  stopFollowing() {
    this.following = false;
  }

  // Find if the competition has started, if it has, query every 5s, otherwise count the start time
  countNextInterval(date) {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    let toStart = new Date(date) - now;
    if (toStart < 0) {
      return 5000;
    }
    return toStart;
  }

  async findChannelPlayers() {
    this.players = await queries.fetchPlayersLinkedToChat(this.chatId);
  }

  async initGameData() {
    await getData(`${this.baseUrl}${this.metrixId}`).then(newData => {
      // Init the first data and find players to follow, find if response has competitions
      if (
        !this.data &&
        Object.keys(newData).includes("Competition") &&
        newData.Competition != null
      ) {
        this.data = newData;
        this.findPlayersToFollow(this.chatId);
        Logger.info(
          `Started following game: ${this.data.Competition.Name} with id ${this.metrixId}`
        );
      }
    });

    setTimeout(n => {
      this.startFollowing();
    }, 5000);
    return this;
  }

  modifyCourseName(str) {
    let name = str.replace(/&rarr;/g, "");
    if (name.length > 38) {
      return `${name.slice(0, 37)}...`;
    } else {
      return name;
    }
  }

  async startFollowing() {
    // Condition for following the contest
    if (this.following) {
      // Async func to fetch data from metrix
      await getData(`${this.baseUrl}${this.metrixId}`).then(newData => {
        try {
          // Check if data exists and there are changes
          if (this.data && this.data != newData) {
            this.newRound = newData;
            const combinedComments = {};

            // Create comments for changed happened in this interval
            this.playersToFollow.forEach(n => {
              const comment = this.checkChangesAndComment(n.Name);
              if (
                comment &&
                !Object.keys(combinedComments).includes(comment.hole.toString())
              ) {
                combinedComments[comment.hole] = [];
              }
              if (comment) {
                combinedComments[comment.hole].push(comment.text);
              }
            });

            // Create message from comments created
            let str = `${this.getStartText()} \n`;
            Object.keys(combinedComments).forEach(n => {
              str = str.concat(
                `*********** Väylä numero ${parseInt(n) + 1} ***********\n`
              );

              str = str.concat(
                `<i><a href="https://discgolfmetrix.com/${
                  this.metrixId
                }">${this.modifyCourseName(
                  this.data.Competition.CourseName
                )}</a></i>\n\n`
              );
              combinedComments[n].forEach(i => {
                str = str.concat(`${i} \n\n`);
              });
            });
            if (Object.keys(combinedComments).length > 0) {
              bot.sendMessage(this.chatId, str, {
                parse_mode: "HTML",
                disable_web_page_preview: true
              });
              Logger.debug(
                `Changes in game ${this.data.Competition.Name}, ${this.metrixId}`
              );
            }

            // Update the "new data" as old
            this.data = this.newRound;
            this.findPlayersToFollow();
          } else {
            Logger.debug(
              `${this.data.Competition.Name} ${this.metrixId}: no changes`
            );
          }

          // Check if competition has ended
          if (this.hasCompetitionEnded()) {
            this.following = false;
            setTimeout(n => {
              bot.sendMessage(
                this.chatId,
                "Dodii, ne kisat oli sit siinä, tässä olis sit vielä lopputulokset!"
              );
            }, 1000);
            queries.markCompetitionFinished(this.id);
            queries.addCourse(this.data.Competition.CourseName);
            queries.fetchCourse(this.data.Competition.CourseName).then(i => {
              this.playersToFollow.forEach(n => {
                queries.addResults(
                  n.id,
                  this.chatId,
                  i[0].id,
                  this.id,
                  n.Diff,
                  n.Sum
                );
              });
            });

            Logger.info(
              `Game ${this.data.Competition.Name}, ${this.metrixId} is finished`
            );
            setTimeout(n => {
              this.createTopList();
            }, 2000);
          }
        } catch (e) {
          console.log(e);
        }
      });

      // Competition continues, keep fetching
      const nextTick = this.countNextInterval(this.data.Competition.Date);
      if (nextTick > 5000)
        Logger.info(
          `${this.data.Competition.Name} ${this.metrixId} will start ${this.data.Competition.Date}, time to start ${nextTick}`
        );
      setTimeout(n => {
        this.startFollowing();
        if (this.tickCounter == 0) {
          this.tickCounter = 3;
        }
        this.tickCounter -= 1;
      }, nextTick);
    }
  }

  hasCompetitionEnded() {
    let bool = this.playersToFollow.map(n =>
      n.PlayerResults.every(hole => !Array.isArray(hole))
    );
    return bool.every(n => n === true);
  }

  async findPlayersToFollow() {
    await this.findChannelPlayers();
    this.playersToFollow = [];

    // Check matching players
    this.data.Competition.Results.forEach(n => {
      const player = this.players.find(i => i.name === n.Name);
      if (player) {
        n["id"] = player.id;
        this.playersToFollow.push(n);
      }
    });

    // Create announce messasge
    if (this.playersToFollow.length > 0 && !this.playersAnnounced) {
      const course = `<a href="https://discgolfmetrix.com/${
        this.metrixId
      }">${this.modifyCourseName(this.data.Competition.CourseName)}</a>`;
      let str = `Peliareenana toimii ${course}\n\nJa tällä kertaa kisassa on mukana:\n`;

      for (let i = 0; i < this.playersToFollow.length; i++) {
        str = str.concat(`${this.playersToFollow[i].Name}\n`);
      }
      bot.sendMessage(this.chatId, str, {
        parse_mode: "HTML",
        disable_web_page_preview: true
      });
      this.playersAnnounced = true;
    }
  }

  getScoreByPlayerName(name) {
    return this.data.Competition.Results.find(n => n.Name == name);
  }

  getDivisions() {
    let divisions = [];
    this.data.Competition.Results.forEach(n => {
      if (!divisions.includes(n.ClassName)) {
        divisions.push(n.ClassName);
      }
    });
    return divisions;
  }

  createTopList() {
    const divisions = this.getDivisions();
    const rankings = {};
    divisions.forEach(n => {
      rankings[n] = this.getTopFive(n);
    });

    const otherPlayers = this.getPlayerToFollowThatArentInTopFive(rankings);
    if (otherPlayers.length > 0) {
      rankings["Muut Sankarit"] = otherPlayers;
    }

    let str = `${this.data.Competition.Name} TOP-5 "\n""\n"`;
    Object.keys(rankings).forEach(n => {
      str = str.concat(`Sarja ${n}"\n"`);
      rankings[n].forEach(r => {
        str = str.concat(
          `${r.OrderNumber}. ${r.Name} "\t""\t""\t""\t"${r.Diff}'\n'`
        );
      });
      str = str.concat("'\n'");
    });
    bot.sendMessage(this.chatId, str.replace(/['"]+/g, ""));
    return str.replace(/['"]+/g, "");
  }

  getTopFive(division) {
    let result = [];
    this.data.Competition.Results.forEach(n => {
      if (n.OrderNumber < 5 && n.ClassName == division) result.push(n);
    });
    return result.sort((a, b) => (a.OrderNumber > b.OrderNumber ? 1 : -1));
  }

  getPlayerToFollowThatArentInTopFive(rankings) {
    let othersToFollow = [];
    for (let i of this.playersToFollow) {
      if (i.OrderNumber > 5) othersToFollow.push(i);
    }

    return othersToFollow.sort((a, b) =>
      a.OrderNumber > b.OrderNumber ? 1 : -1
    );
  }

  // Helper for checking changes
  checkChangesAndComment(playerName) {
    const prevScore = this.playersToFollow.find(n => n.Name == playerName);
    const newScore = this.newRound.Competition.Results.find(
      n => n.Name == playerName
    );

    if (
      Object.keys(prevScore).includes("Sum") &&
      prevScore.Sum != newScore.Sum
    ) {
      return this.createPhrase(newScore);
    }
  }

  // Returns the hole where new results came from from a certain player
  getHole(playerName) {
    const datalistOld = this.data.Competition.Results.find(
      n => n.Name == playerName
    ).PlayerResults;
    const datalistNew = this.newRound.Competition.Results.find(
      n => n.Name == playerName
    ).PlayerResults;

    //If player has results
    if (datalistOld && datalistNew) {
      // Modify the scorelists, because the metrixapi sux
      const holeMapOld = datalistOld.map((item, index) => {
        if (Array.isArray(item)) {
          return { Result: "", Diff: "", OB: "", Played: false, Index: index };
        } else {
          item["Played"] = true;
          item["Index"] = index;
          return item;
        }
      });

      const holeMapNew = datalistNew.map((item, index) => {
        if (Array.isArray(item)) {
          return { Result: "", Diff: "", OB: "", Played: false, Index: index };
        } else {
          item["Played"] = true;
          item["Index"] = index;
          return item;
        }
      });

      // find which hole has changes
      for (let i = 0; i < holeMapNew.length; i++) {
        if (holeMapNew[i].Result !== holeMapOld[i].Result) {
          return i;
        }
      }

      return -1;
    }
  }

  addPlusSignToScore(score) {
    return score > 0 ? `+${score}` : `${score}`;
  }

  createPhrase(player) {
    if (this.getHole(player.Name) !== -1) {
      const obj = this.getPhraseForScore(player, this.getHole(player.Name));
      const randomVerb = verbs[Helpers.getRandom(verbs.length)];
      return {
        hole: this.getHole(player.Name),
        text: `${obj.startText} <b>${player.Name}</b> ${randomVerb} ${
          obj.scoreText
        }${obj.ob}, tällä hetkellä tuloksessa <b>${this.addPlusSignToScore(
          player.Diff
        )}</b> ja sijalla <b>${player.OrderNumber}</b>`
      };
    }
  }

  async checkAndSaveSuperbScores(player, hole) {
    let thisPlayer = this.playersToFollow.find(n => n.Name == player.Name);
    let score = player.PlayerResults[hole].Diff;

    if (score <= -2) {
      const course = await queries.fetchCourse(
        this.data.Competition.CourseName
      );

      if (parseInt(player.PlayerResults[hole].Result) === 1) {
        queries.addAce(
          new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          thisPlayer.id,
          this.chatId,
          course[0].id,
          this.id
        );
      } else {
        switch (score) {
          case -3:
            queries.addAlbatross(
              new Date()
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
              thisPlayer.id,
              this.chatId,
              course[0].id,
              this.id
            );
            break;
          case -2:
            queries.addEagle(
              new Date()
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
              thisPlayer.id,
              this.chatId,
              course[0].id,
              this.id
            );
            break;
          default:
            break;
        }
      }
    }
  }

  getStartText() {
    const obj = narratives[Helpers.getRandom(narratives.length)];
    return `${obj.firstPart}\n`;
  }

  getPhraseForScore(player, hole) {
    this.checkAndSaveSuperbScores(player, hole);
    let score = player.PlayerResults[hole].Result;
    let obj = undefined;
    if (score == 1)
      obj = {
        score: 1,
        startText: goodStart[Helpers.getRandom(goodStart.length)],
        scoreText: "ÄSSÄN!"
      };
    else if (player.PlayerResults[hole].Diff > 2)
      obj = {
        score: score,
        startText: badStart[Helpers.getRandom(badStart.length)],
        scoreText: `niin ison scoren, että ei mahdu edes näytölle (${score})`
      };
    else if (player.PlayerResults[hole].Diff > 0)
      obj = {
        score: score,
        startText: badStart[Helpers.getRandom(badStart.length)],
        scoreText: scores.find(n => n.score == player.PlayerResults[hole].Diff)
          .text[
          Helpers.getRandom(
            scores.find(n => n.score == player.PlayerResults[hole].Diff).text
              .length
          )
        ]
      };
    else if (player.PlayerResults[hole].Diff == 0) {
      obj = {
        score: score,
        startText: neutralStart[Helpers.getRandom(neutralStart.length)],
        scoreText: scores.find(n => n.score == 0).text[
          Helpers.getRandom(scores.find(n => n.score == 0).text.length)
        ]
      };
    } else {
      obj = {
        score: score,
        startText: goodStart[Helpers.getRandom(goodStart.length)],
        scoreText: scores.find(n => n.score == player.PlayerResults[hole].Diff)
          .text[
          Helpers.getRandom(
            scores.find(n => n.score == player.PlayerResults[hole].Diff).text
              .length
          )
        ]
      };
    }

    obj["ob"] =
      player.PlayerResults[hole].PEN > 0
        ? outofbounds[Helpers.getRandom(outofbounds.length)]
        : "";
    return obj;
  }
}

export default Game;
