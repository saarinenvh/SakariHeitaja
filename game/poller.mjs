import EventEmitter from "events";
import { getData } from "../async/functions.mjs";
import Logger from "js-logger";
import { loggerSettings } from "../logger.mjs";
Logger.useDefaults(loggerSettings);

// Adaptive poll intervals
const INTERVAL_ACTIVE  = 30_000;   // changes happening: 30s
const INTERVAL_IDLE    = 60_000;   // quiet for a few polls: 60s
const INTERVAL_DORMANT = 120_000;  // very quiet: 2min
const ERROR_BASE       = 60_000;   // first backoff on error: 60s
const ERROR_MAX        = 600_000;  // max backoff: 10min

// Thresholds for switching modes
const IDLE_THRESHOLD    = 3;   // consecutive no-change polls before going idle
const DORMANT_THRESHOLD = 10;  // consecutive no-change polls before going dormant

/**
 * Poller — responsible only for scheduling and fetching.
 *
 * Emits:
 *   "data"       (apiResponse)  — valid response received
 *   "fetchError" (error)        — fetch failed
 *
 * The consumer calls reportChanges(bool) after processing each "data"
 * event so the Poller can adjust its next interval.
 */
class Poller extends EventEmitter {
  constructor(metrixId, baseUrl) {
    super();
    this.metrixId = metrixId;
    this.baseUrl = baseUrl;
    this.running = false;
    this.noChangeCount = 0;
    this.errorCount = 0;
    this._timeoutId = null;
  }

  /** Start polling. Pass an optional initial delay (ms) to wait before first fetch. */
  start(initialDelay = 0) {
    this.running = true;
    Logger.info(`Poller ${this.metrixId}: starting${initialDelay > 0 ? ` in ${Math.round(initialDelay / 1000)}s` : " now"}`);
    this._schedule(initialDelay);
  }

  stop() {
    this.running = false;
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    Logger.info(`Poller ${this.metrixId}: stopped`);
  }

  /**
   * Call this after processing a "data" event with whether any score changes
   * were detected. This drives the adaptive interval logic.
   */
  reportChanges(hadChanges) {
    if (hadChanges) {
      this.noChangeCount = 0;
    } else {
      this.noChangeCount++;
    }
  }

  _schedule(delay) {
    this._timeoutId = setTimeout(() => this._poll(), delay);
  }

  async _poll() {
    if (!this.running) return;

    let hadError = false;

    try {
      const data = await getData(`${this.baseUrl}${this.metrixId}`);

      if (!data || !Object.keys(data).includes("Competition") || data.Competition == null) {
        hadError = true;
        this.errorCount++;
        Logger.warn(`Poller ${this.metrixId}: invalid/empty response (attempt ${this.errorCount}), backing off`);
      } else {
        this.errorCount = 0;
        this.emit("data", data);
      }
    } catch (err) {
      hadError = true;
      this.errorCount++;
      Logger.error(`Poller ${this.metrixId}: fetch error (attempt ${this.errorCount}): ${err.message}`);
      this.emit("fetchError", err);
    }

    if (!this.running) return;

    const nextInterval = hadError ? this._errorInterval() : this._activeInterval();
    Logger.debug(`Poller ${this.metrixId}: next poll in ${Math.round(nextInterval / 1000)}s [noChange=${this.noChangeCount}, errors=${this.errorCount}]`);
    this._schedule(nextInterval);
  }

  _activeInterval() {
    if (this.noChangeCount < IDLE_THRESHOLD)    return this._jitter(INTERVAL_ACTIVE);
    if (this.noChangeCount < DORMANT_THRESHOLD) return this._jitter(INTERVAL_IDLE);
    return this._jitter(INTERVAL_DORMANT);
  }

  _errorInterval() {
    const backoff = Math.min(ERROR_BASE * Math.pow(2, this.errorCount - 1), ERROR_MAX);
    return this._jitter(backoff);
  }

  /** ±15% random jitter so multiple active games don't all hit the API simultaneously */
  _jitter(ms) {
    return Math.floor(ms * (1 + (Math.random() * 0.3 - 0.15)));
  }
}

export default Poller;
