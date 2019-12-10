const uuid = require("uuid/v4.js");

import { TimeEvent } from "./TimeEventType";

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
  createCallbackManifest(sequence: Array<TimeEvent>): { [i: string]: any } {
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
  async stop(cb: Function = null) {
    clearInterval(this.timer.instance); // clear the timer instance
    this.progress = 0;
    this.state = "stopped";
    if (cb) {
      cb({ progress: this.progress, totalDuration: this.totalDuration });
    }
  }
  async play() {
    await this.checkManifest("play");
    await this.stop();
    this.state = "playing";
    this.manifest = this.provideIds();
    const sequence = this.organiseSequence();
    const lastEntry = sequence[sequence.length - 1];
    const callbacks = this.createCallbackManifest(sequence); // create a manifest that fires the callbacks on the right moment
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
      }
    });
  }
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
  async continue() {
    if (this.state !== "paused") {
      console.warn("Can't continue. Timeline is not in a paused state");
      return;
    }
    await this.checkManifest("continue");
    this.initTimer({ skipConfig: true });
    this.state = "playing";
  }

  onUpdate(cb: Function) {
    this.updateCb = cb;
  }

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
      if (this.updateCb) {
        // callback for each interval
        this.updateCb({
          progress: this.progress,
          totalDuration: this.totalDuration
        });
      }
      this.timer.onInterval(this.progress / 1000);
    }, 10);
  }

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
  provideIds(): Array<TimeEvent> {
    return this.manifest.map(m => ({ ...m, id: uuid() }));
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
