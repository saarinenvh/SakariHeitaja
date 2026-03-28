import { bot } from "../../bot/bot";
import Poller from "./poller";
import { detectChanges, hasCompetitionEnded } from "./changeDetector";
import { generateComment, generateHeader } from "./commentary";
import * as playerRepo from "../../db/repositories/PlayerRepository";
import * as competitionService from "./services/CompetitionService";
import * as courseService from "./services/CourseService";
import * as scoreService from "./services/ScoreService";
import { MetrixApiResponse, TrackedPlayer, Change } from "../../types/metrix";
import Logger from "js-logger";

const BASE_URL = "https://discgolfmetrix.com/api.php?content=result&id=";

export class Orchestrator {
  id: number;
  metrixId: string;
  chatId: number;
  following: boolean = true;
  data: MetrixApiResponse | null = null;
  trackedPlayers: TrackedPlayer[] = [];

  private playersAnnounced: boolean;
  private poller: Poller | null = null;

  constructor(id: number, metrixId: string, chatId: number, playersAnnounced: boolean = false) {
    this.id = id;
    this.metrixId = metrixId;
    this.chatId = chatId;
    this.playersAnnounced = playersAnnounced;
  }

  async init(): Promise<this> {
    const { getData } = await import("../../lib/http");
    const newData = await getData<MetrixApiResponse>(`${BASE_URL}${this.metrixId}`);

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
      await bot.api.sendMessage(this.chatId, "Ei löydy seurattavia pelaajia tästä kisasta. Lopetan seuraamisen.");
      this.following = false;
      return this;
    }

    this._announceIfNeeded();

    const initialDelay = this._msUntilStart(this.data.Competition.Date);
    if (initialDelay > 0) {
      Logger.info(`${this.data.Competition.Name} starts in ${Math.round(initialDelay / 60000)}min`);
    }

    this.poller = new Poller(this.metrixId, BASE_URL);
    this.poller.on("data", (data: MetrixApiResponse) => this._onData(data));
    this.poller.on("fetchError", (err: Error) => Logger.error(`${this.metrixId}: ${err.message}`));
    this.poller.start(initialDelay);

    return this;
  }

  stopFollowing(): void {
    this.following = false;
    this.poller?.stop();
  }

  getScoreByPlayerName(name: string) {
    return this.data?.Competition.Results.find(n => n.Name === name);
  }

  createTopList(): void {
    this._sendTopList();
  }

  private async _onData(newData: MetrixApiResponse): Promise<void> {
    if (!this.following) return;

    try {
      if (!this.data || this.data === newData) {
        this.poller!.reportChanges(false);
        return;
      }

      const changes = detectChanges(this.data, newData, this.trackedPlayers);
      const hadChanges = changes.length > 0;

      if (hadChanges) {
        await this._sendCommentary(changes, newData);
      } else {
        Logger.debug(`${this.data.Competition.Name} ${this.metrixId}: no changes`);
      }

      this.poller!.reportChanges(hadChanges);
      this.data = newData;
      await this._refreshTrackedPlayers();

      if (hasCompetitionEnded(this.trackedPlayers)) {
        await this._handleCompetitionEnd();
      }
    } catch (err: any) {
      Logger.error(`Orchestrator ${this.metrixId}: ${err.message}`);
      this.poller!.reportChanges(false);
    }
  }

  private async _sendCommentary(changes: Change[], newData: MetrixApiResponse): Promise<void> {
    const byHole: Record<number, string[]> = {};
    for (const change of changes) {
      if (!byHole[change.hole]) byHole[change.hole] = [];
      byHole[change.hole].push(generateComment(change));
    }

    let message = `${generateHeader()}\n`;
    for (const hole of Object.keys(byHole)) {
      message += `\n*********** Väylä numero ${parseInt(hole) + 1} ***********\n`;
      message += `<i><a href="https://discgolfmetrix.com/${this.metrixId}">${this._truncateName(this.data!.Competition.CourseName)}</a></i>\n\n`;
      for (const line of byHole[parseInt(hole)]) {
        message += `${line} \n\n`;
      }
    }

    await bot.api.sendMessage(this.chatId, message, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });

    Logger.debug(`Changes in ${this.data!.Competition.Name}, ${this.metrixId}`);

    for (const change of changes) {
      await scoreService.saveSuperScore(change, this.chatId, this.id, this.data!.Competition.CourseName);
    }
  }

  private async _handleCompetitionEnd(): Promise<void> {
    this.following = false;
    this.poller!.stop();

    Logger.info(`Game ${this.data!.Competition.Name}, ${this.metrixId} is finished`);

    setTimeout(() => {
      bot.api.sendMessage(this.chatId, "Dodii, ne kisat oli sit siinä, tässä olis sit vielä lopputulokset!");
    }, 1000);

    await competitionService.markDone(this.id);

    const course = await courseService.getOrCreate(this.data!.Competition.CourseName);
    if (course) {
      await scoreService.saveResults(this.trackedPlayers, this.chatId, course.id, this.id);
    }

    setTimeout(() => this._sendTopList(), 2000);
  }

  private _sendTopList(): void {
    const results = this.data!.Competition.Results;
    const divisions = [...new Set(results.map(n => n.ClassName))];
    const rankings: Record<string, typeof results> = {};

    for (const div of divisions) {
      rankings[div] = results
        .filter(n => n.ClassName === div && n.OrderNumber <= 5)
        .sort((a, b) => a.OrderNumber - b.OrderNumber);
    }

    const others = this.trackedPlayers.filter(p => p.OrderNumber > 5);
    if (others.length) {
      rankings["Muut Sankarit"] = others.sort((a, b) => a.OrderNumber - b.OrderNumber);
    }

    let str = `${this.data!.Competition.Name} TOP-5\n\n`;
    for (const [div, players] of Object.entries(rankings)) {
      str += `Sarja ${div}\n`;
      for (const p of players) str += `${p.OrderNumber}. ${p.Name}\t\t\t\t${p.Diff}\n`;
      str += "\n";
    }

    bot.api.sendMessage(this.chatId, str);
  }

  private async _refreshTrackedPlayers(): Promise<void> {
    const chatPlayers = await playerRepo.findByChatId(this.chatId);
    this.trackedPlayers = this.data!.Competition.Results
      .filter(result => chatPlayers.find(p => p.name === result.Name))
      .map(result => {
        const p = chatPlayers.find(p => p.name === result.Name)!;
        return { ...result, id: p.id };
      });
  }

  private _announceIfNeeded(): void {
    if (this.trackedPlayers.length === 0 || this.playersAnnounced) return;
    const course = `<a href="https://discgolfmetrix.com/${this.metrixId}">${this._truncateName(this.data!.Competition.CourseName)}</a>`;
    let str = `Peliareenana toimii ${course}\n\nJa tällä kertaa kisassa on mukana:\n`;
    for (const p of this.trackedPlayers) str += `${p.Name}\n`;
    bot.api.sendMessage(this.chatId, str, { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
    this.playersAnnounced = true;
  }

  private _msUntilStart(date: string): number {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    const diff = new Date(date).getTime() - now.getTime();
    return diff > 0 ? diff : 0;
  }

  private _truncateName(str: string): string {
    const name = str.replace(/&rarr;/g, "");
    return name.length > 38 ? `${name.slice(0, 37)}...` : name;
  }
}
