import { bot } from "../bot/bot.mjs";
import Poller from "./poller.mjs";
import { detectChanges, hasCompetitionEnded } from "./changeDetector.mjs";
import { generateComment, generateHeader } from "./commentary.mjs";
import * as competitionDb from "../db/queries/competitions.mjs";
import * as courseDb from "../db/queries/courses.mjs";
import * as scoreDb from "../db/queries/scores.mjs";
import * as playerDb from "../db/queries/players.mjs";
import Logger from "js-logger";

const BASE_URL = "https://discgolfmetrix.com/api.php?content=result&id=";

export class Orchestrator {
  constructor(id, metrixId, chatId, playersAnnounced = false) {
    this.id = id;
    this.metrixId = metrixId;
    this.chatId = chatId;
    this.playersAnnounced = playersAnnounced;
    this.following = true;
    this.data = null;
    this.trackedPlayers = [];
    this.poller = null;
  }

  async init() {
    const { getData } = await import("../async/functions.mjs");
    const newData = await getData(`${BASE_URL}${this.metrixId}`);

    if (!newData?.Competition) {
      Logger.error(`Orchestrator ${this.metrixId}: invalid initial data`);
      this.following = false;
      return this;
    }

    this.data = newData;
    await this._refreshTrackedPlayers();

    Logger.info(`Started following: ${this.data.Competition.Name} (${this.metrixId})`);

    if (this.trackedPlayers.length === 0) {
      Logger.info(`${this.metrixId}: no tracked players, stopping`);
      bot.sendMessage(this.chatId, "Ei löydy seurattavia pelaajia tästä kisasta. Lopetan seuraamisen.");
      this.following = false;
      return this;
    }

    this._announceIfNeeded();

    const initialDelay = this._msUntilStart(this.data.Competition.Date);
    if (initialDelay > 0) {
      Logger.info(`${this.data.Competition.Name} starts in ${Math.round(initialDelay / 60000)}min`);
    }

    this.poller = new Poller(this.metrixId, BASE_URL);
    this.poller.on("data", newData => this._onData(newData));
    this.poller.on("fetchError", err => Logger.error(`${this.metrixId}: ${err.message}`));
    this.poller.start(initialDelay);

    return this;
  }

  stopFollowing() {
    this.following = false;
    this.poller?.stop();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  async _onData(newData) {
    if (!this.following) return;

    try {
      if (!this.data || this.data === newData) {
        this.poller.reportChanges(false);
        return;
      }

      const changes = detectChanges(this.data, newData, this.trackedPlayers);
      const hadChanges = changes.length > 0;

      if (hadChanges) {
        await this._sendCommentary(changes, newData);
      } else {
        Logger.debug(`${this.data.Competition.Name} ${this.metrixId}: no changes`);
      }

      this.poller.reportChanges(hadChanges);
      this.data = newData;
      await this._refreshTrackedPlayers();

      if (hasCompetitionEnded(this.trackedPlayers)) {
        await this._handleCompetitionEnd();
      }
    } catch (err) {
      Logger.error(`Orchestrator ${this.metrixId}: ${err.message}`);
      this.poller.reportChanges(false);
    }
  }

  async _sendCommentary(changes, newData) {
    const byHole = {};
    for (const change of changes) {
      const hole = change.hole;
      if (!byHole[hole]) byHole[hole] = [];
      byHole[hole].push(generateComment(change));
    }

    let message = `${generateHeader()}\n`;
    for (const hole of Object.keys(byHole)) {
      message += `\n*********** Väylä numero ${parseInt(hole) + 1} ***********\n`;
      message += `<i><a href="https://discgolfmetrix.com/${this.metrixId}">${this._truncateName(this.data.Competition.CourseName)}</a></i>\n\n`;
      for (const line of byHole[hole]) {
        message += `${line} \n\n`;
      }
    }

    bot.sendMessage(this.chatId, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    Logger.debug(`Changes in ${this.data.Competition.Name}, ${this.metrixId}`);

    // Persist aces/eagles/albatrosses
    for (const change of changes) {
      await this._saveSuperScore(change);
    }
  }

  async _saveSuperScore(change) {
    const { holeResult, playerId } = change;
    const diff = holeResult.Diff;
    if (diff > -2) return;

    const courses = await courseDb.fetchCourse(this.data.Competition.CourseName);
    if (!courses.length) return;
    const courseId = courses[0].id;
    const date = new Date().toISOString().slice(0, 10);

    if (parseInt(holeResult.Result) === 1) {
      await scoreDb.addAce(date, playerId, this.chatId, courseId, this.id);
    } else if (diff === -3) {
      await scoreDb.addAlbatross(date, playerId, this.chatId, courseId, this.id);
    } else if (diff === -2) {
      await scoreDb.addEagle(date, playerId, this.chatId, courseId, this.id);
    }
  }

  async _handleCompetitionEnd() {
    this.following = false;
    this.poller.stop();

    Logger.info(`Game ${this.data.Competition.Name}, ${this.metrixId} is finished`);

    setTimeout(() => {
      bot.sendMessage(this.chatId, "Dodii, ne kisat oli sit siinä, tässä olis sit vielä lopputulokset!");
    }, 1000);

    await competitionDb.markCompetitionFinished(this.id);
    await courseDb.addCourse(this.data.Competition.CourseName);

    const courses = await courseDb.fetchCourse(this.data.Competition.CourseName);
    if (courses.length) {
      for (const player of this.trackedPlayers) {
        await scoreDb.addResults(
          player.id, this.chatId, courses[0].id, this.id, player.Diff, player.Sum
        );
      }
    }

    setTimeout(() => this._sendTopList(), 2000);
  }

  _sendTopList() {
    const divisions = [...new Set(this.data.Competition.Results.map(n => n.ClassName))];
    const rankings = {};

    for (const div of divisions) {
      rankings[div] = this.data.Competition.Results
        .filter(n => n.ClassName === div && n.OrderNumber <= 5)
        .sort((a, b) => a.OrderNumber - b.OrderNumber);
    }

    const others = this.trackedPlayers.filter(p => p.OrderNumber > 5);
    if (others.length) {
      rankings["Muut Sankarit"] = others.sort((a, b) => a.OrderNumber - b.OrderNumber);
    }

    let str = `${this.data.Competition.Name} TOP-5\n\n`;
    for (const [div, players] of Object.entries(rankings)) {
      str += `Sarja ${div}\n`;
      for (const p of players) {
        str += `${p.OrderNumber}. ${p.Name}\t\t\t\t${p.Diff}\n`;
      }
      str += "\n";
    }

    bot.sendMessage(this.chatId, str);
  }

  async _refreshTrackedPlayers() {
    const chatPlayers = await playerDb.fetchPlayersLinkedToChat(this.chatId);
    this.trackedPlayers = this.data.Competition.Results
      .filter(result => chatPlayers.find(p => p.name === result.Name))
      .map(result => {
        const p = chatPlayers.find(p => p.name === result.Name);
        return { ...result, id: p.id };
      });
  }

  _announceIfNeeded() {
    if (this.trackedPlayers.length === 0 || this.playersAnnounced) return;
    const course = `<a href="https://discgolfmetrix.com/${this.metrixId}">${this._truncateName(this.data.Competition.CourseName)}</a>`;
    let str = `Peliareenana toimii ${course}\n\nJa tällä kertaa kisassa on mukana:\n`;
    for (const p of this.trackedPlayers) str += `${p.Name}\n`;
    bot.sendMessage(this.chatId, str, { parse_mode: "HTML", disable_web_page_preview: true });
    this.playersAnnounced = true;
  }

  _msUntilStart(date) {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    const diff = new Date(date) - now;
    return diff > 0 ? diff : 0;
  }

  _truncateName(str) {
    const name = str.replace(/&rarr;/g, "");
    return name.length > 38 ? `${name.slice(0, 37)}...` : name;
  }

  // Used by competition handlers
  getScoreByPlayerName(name) {
    return this.data?.Competition.Results.find(n => n.Name === name);
  }

  createTopList() {
    this._sendTopList();
  }
}
