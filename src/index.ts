const uuid = require("uuid/v4.js");

import { RequireAtLeastOne } from "./RequireAtLeastOne";

interface TimeEventBase {
  start?: number;
  followUp?: boolean;
  duration?: number;
  id?: string;
  cb: Function;
}
type TimeEvent = RequireAtLeastOne<TimeEventBase, "start" | "followUp">;

export default class Timeline {
  manifest: Array<TimeEvent>;
  timer: {
    instance: ReturnType<typeof setInterval>;
    duration: number;
    callback: Function;
  };
  progress: number;
  sequenceIndex: number;

  constructor(manifest: Array<TimeEvent> = []) {
    if (!manifest.length) {
      console.warn(
        "Timeline: No events in manifest, this might cause an error"
      );
    }
    this.manifest = manifest;
    this.progress = 0;
    this.sequenceIndex = 0;
    this.timer = { instance: null, duration: null, callback: null };
  }
  async play() {
    await this.checkManifest("play");
    this.manifest = this.provideIds();
    this.progress = 0;
    const sequence = this.organiseSequence();
    const lastEntry = sequence[sequence.length - 1];
    this.initTimer({
      time: (lastEntry.start + lastEntry.duration) * 1000,
      cb: (stamp: number) => {
        if (
          sequence[this.sequenceIndex] &&
          stamp >= sequence[this.sequenceIndex].start
        ) {
          sequence[this.sequenceIndex].cb();
          this.sequenceIndex++;
        }
      }
    });
  }
  async pause() {
    await this.checkManifest("pause");
    clearInterval(this.timer.instance);
  }
  async continue() {
    await this.checkManifest("continue");
    this.initTimer({ skipConfig: true });
  }

  initTimer(args: { time?: number; cb?: Function; skipConfig?: boolean }) {
    if (!args.skipConfig) {
      this.timer.duration = args.time;
      this.timer.callback = args.cb;
    }
    this.timer.instance = setInterval(() => {
      this.progress += 5;
      if (this.progress >= this.timer.duration) {
        clearInterval(this.timer.instance);
        return;
      }
      this.timer.callback(this.progress / 1000);
    }, 5);
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
