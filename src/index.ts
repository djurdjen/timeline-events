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
  finishedCb: Function;

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
    this.finishedCb = null;
    this.timer = {
      instance: null,
      duration: null,
      onInterval: null
    };
  }
  /**
   * Playing the timeline
   * @param {number} customProgress - add a custom progress argument to the play method
   * @return {void}
   */
  async play(customProgress: number = 0) {
    await this.checkManifest("play");
    await this.stop();
    this.state = "playing";
    this.manifest = this.provideIds();
    this.progress = customProgress * 1000;
    this.totalDuration = this.getDuration();
    const callbacks = this.createCallbackList(
      this.organiseSequence(),
      customProgress
    ); // create a manifest that fires all the callbacks on the right moment
    // console.log(callbacks);
    const keys = Object.keys(callbacks);
    this.initTimer({
      time: this.totalDuration,
      onInterval: (stamp: number) => {
        for (let i = 0; i < keys.length; i++) {
          if (stamp >= Number(keys[i]) && callbacks[keys[i]].length) {
            callbacks[keys[i]].forEach((cb: any, index: number) => {
              cb({
                stamp,
                progress: this.progress,
                percentage: this.getPercentage(this.progress)
              });
              delete callbacks[keys[i]][index]; // remove when called to prevent multiple firings of callback
            });
          }
        }
        // callback for each interval
        if (this.updateCb) {
          this.updateCb({
            progress: this.progress,
            percentage: this.getPercentage(this.progress)
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
  finished(cb: Function) {
    this.finishedCb = cb;
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
    this.timer.onInterval(this.progress / 1000); // init a first time when timer = 0
    this.timer.instance = setInterval(() => {
      this.progress += 10;
      this.timer.onInterval(this.progress / 1000);
      if (this.progress > this.timer.duration) {
        clearInterval(this.timer.instance); // end of timeline
        this.finishedCb && this.finishedCb();
        return;
      }
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
      } else {
        const prev = newValues[index - 1];
        newValues.push({
          ...seq,
          start: seq.followUp && prev ? prev.start + prev.duration : 0,
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
  createCallbackList(
    sequence: Array<TimeEvent>,
    customProgress: number
  ): { [i: string]: any } {
    // remove the callbacks if a requested custom progress has progressed further then the callback's execution moment
    sequence = sequence.filter(entry => entry.start >= customProgress);
    const manifest: { [i: string]: any } = {};
    sequence.forEach(entry => {
      const end = Math.round((entry.start + entry.duration) * 100) / 100;
      const start = Math.round(entry.start * 100) / 100;
      entry.onStart &&
        (manifest[start] = [...(manifest[start] || []), ...[entry.onStart]]);
      entry.onEnd &&
        (manifest[end] = [...(manifest[end] || []), ...[entry.onEnd]]);
    });
    return manifest;
  }
  /**
   * Check manifest for errors
   * @param {string} fn - Function that the user tried to call
   * @return {Promise}
   */
  checkManifest(fn: string): Promise<{}> {
    return new Promise(resolve => {
      if (!this.manifest.length) {
        throw new Error(
          `Cannot call function: ${fn}, no valid manifest provided.`
        );
      }
      if (this.manifest.find(entry => !("start" in entry) && !entry.followUp)) {
        throw new Error(
          `in event entries. Every entry should contain a 'start' or 'followUp' property.`
        );
      }
      if (this.manifest.find(entry => !entry.duration)) {
        throw new Error(
          `in event entries. Duration property is required. Please check if all entries contain a duration property`
        );
      }
      resolve();
    });
  }
  /**
   * Get duration
   * @return {number}
   */
  getDuration(): number {
    const lastEntry = this.organiseSequence().pop();
    return (lastEntry.start + lastEntry.duration) * 1000;
  }
  /**
   * Get duration
   * @param {number} stamp - given timestamp
   * @return {number}
   */
  getPercentage(stamp: number): number {
    return (
      Math.round(
        1000 - ((stamp - this.totalDuration) / this.totalDuration) * -1000
      ) / 10
    );
  }
}
