const uuid = require("uuid/v4.js");

import { TimeEvent } from "./TimeEventType";

/**
 * Class representing a Timeline
 */
export default class Timeline {
  manifest: Array<TimeEvent>;
  timer: {
    instance: ReturnType<typeof setInterval>;
    duration: number;
    onInterval: Function;
  };
  progress: number;
  sequenceIndex: number;
  totalDuration: number;
  state: string;
  updateCb: Function;

  /**
   * Create a manifest.
   * @param {Array} manifest - The manifest
   */
  constructor(manifest: Array<TimeEvent> = []) {
    this.state = "stopped";
    this.manifest = manifest;
    this.progress = 0;
    this.sequenceIndex = 0;
    this.totalDuration = 0;
    this.updateCb = null;
    this.timer = {
      instance: null,
      duration: null,
      onInterval: null
    };
  }
  /**
   * Playing the timeline
   * @return {void}
   */
  async play() {
    await this.checkManifest("play");
    await this.stop();
    this.state = "playing";
    this.manifest = this.provideIds();
    const sequence = this.organiseSequence();
    const lastEntry = sequence[sequence.length - 1];
    const callbacks = this.createCallbackList(sequence); // create a manifest that fires the callbacks on the right moment
    const keys = Object.keys(callbacks);
    this.totalDuration = (lastEntry.start + lastEntry.duration) * 1000; // set total duration of all timeline events
    this.initTimer({
      time: this.totalDuration,
      onInterval: (stamp: number) => {
        for (let i = 0; i < keys.length; i++) {
          if (stamp >= Number(keys[i])) {
            callbacks[keys[i]].forEach((cb: any, index: number) => {
              cb(stamp);
              delete callbacks[keys[i]][index]; // remove when called to prevent double firing
            });
          }
        }
        // callback for each interval
        if (this.updateCb) {
          this.updateCb({
            progress: this.progress,
            totalDuration: this.totalDuration
          });
        }
      }
    });
  }
  /**
   * Stop the timeline
   * @callback stopCallback - callback for the stop method
   * @param {stopCallback} cb
   * @return {void}
   */
  async stop(cb: Function = null) {
    clearInterval(this.timer.instance); // clear the timer instance
    this.progress = 0;
    this.state = "stopped";
    if (cb) {
      cb({ progress: this.progress, totalDuration: this.totalDuration });
    }
  }
  /**
   * Pause the timeline if the state is set on playing
   * @callback pauseCallback - callback for the stop method
   * @param {pauseCallback} cb
   * @return {void}
   */
  async pause(cb: Function = null) {
    if (this.state !== "playing") {
      console.warn("Can't continue. Timeline is not in a playing state");
      return;
    }
    clearInterval(this.timer.instance);
    this.state = "paused";
    if (cb) {
      cb({ progress: this.progress, totalDuration: this.totalDuration });
    }
  }
  /**
   * Continuing the timeline if the state is set on paused
   * @return {void}
   */
  async continue() {
    if (this.state !== "paused") {
      console.warn("Can't continue. Timeline is not in a paused state");
      return;
    }
    await this.checkManifest("continue");
    this.initTimer({ skipConfig: true });
    this.state = "playing";
  }
  /**
   * Pause the timeline if the state is set on playing
   * @callback updateCallback - callback for the update method
   * @param {updateCallback} cb
   * @return {void}
   */
  onUpdate(cb: Function) {
    this.updateCb = cb;
  }
  /**
   * Sort and organise time-event entries
   * @param {number} time - The total timespan of the timeline
   * @callback onIntervalCallback - callback that initializes every time the interval fires
   * @param {updateCallback} onInterval
   * @param {boolean} skipConfig - The sequence of time-event properties
   * @return {void}
   */
  initTimer(args: {
    time?: number;
    onInterval?: Function;
    skipConfig?: boolean;
  }) {
    if (!args.skipConfig) {
      this.timer.duration = args.time;
      this.timer.onInterval = args.onInterval;
    }
    this.timer.instance = setInterval(() => {
      this.progress += 10;
      if (this.progress > this.timer.duration) {
        clearInterval(this.timer.instance); // end of timeline
        return;
      }
      this.timer.onInterval(this.progress / 1000);
    }, 10);
  }
  /**
   * Sort and organise time-event entries
   * @return {Array}
   */
  organiseSequence(): Array<TimeEvent> {
    const newValues: Array<TimeEvent> = [];
    this.manifest.forEach((seq: any, index: number) => {
      if ("start" in seq) {
        newValues.push({ ...seq, start: seq.start, id: seq.id });
      } else if (seq.followUp) {
        const prev = newValues[index - 1];
        newValues.push({
          ...seq,
          start: prev.start + prev.duration || 0,
          id: seq.id
        });
      }
    });
    return newValues.sort((a, b) => a.start - b.start);
  }
  /**
   * Provide entries with unique id's
   * @return {Array}
   */
  provideIds(): Array<TimeEvent> {
    return this.manifest.map(m => ({ ...m, id: uuid() }));
  }
  /**
   * Get a list of all the callbacks organised time of initialisation
   * @param {Array} sequence - The sequence of time-event properties
   * @return {Object}
   */
  createCallbackList(sequence: Array<TimeEvent>): { [i: string]: any } {
    const manifest: { [i: string]: any } = {};
    sequence.forEach(entry => {
      const end = Math.round((entry.start + entry.duration) * 100) / 100;
      const start = entry.start;
      entry.onStart &&
        (manifest[start] = [...(manifest[start] || []), ...[entry.onStart]]);
      entry.onEnd &&
        (manifest[end] = [...(manifest[end] || []), ...[entry.onEnd]]);
    });
    return manifest;
  }
  checkManifest(fn: string): Promise<{}> {
    return new Promise(resolve => {
      if (!this.manifest.length) {
        throw new Error(
          `Cannot call function: ${fn}, no valid manifest provided.`
        );
      }
      resolve();
    });
  }
}
