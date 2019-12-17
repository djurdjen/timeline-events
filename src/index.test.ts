import Timeline from "./index";
import { TimeEvent } from "./TimeEventType";

test("All callbacks called in right order when timeline ends", (done: Function) => {
  const progress: Array<{ name: string; stamp: number }> = [];
  const manifest: Array<TimeEvent> = [
    {
      start: 0,
      duration: 0.5,
      onStart: (args: { progress: number; percentage: string }) =>
        progress.push({ name: "first-entry", stamp: args.progress })
    },
    {
      followUp: true,
      duration: 0.2,
      onStart: (args: { progress: number; percentage: string }) =>
        progress.push({ name: "follow-up", stamp: args.progress })
    },
    {
      followUp: true,
      duration: 0.2,
      onEnd: (args: { progress: number; percentage: string }) =>
        progress.push({ name: "on-end", stamp: args.progress })
    },
    {
      start: 0.1,
      duration: 0.2,
      onStart: (args: { progress: number; percentage: string }) =>
        progress.push({ name: "in-between", stamp: args.progress })
    }
  ];
  const timeline = new Timeline(manifest);
  timeline.play();
  timeline.finished(() => {
    expect(progress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "first-entry",
          stamp: 0
        }),
        expect.objectContaining({
          name: "in-between",
          stamp: 100
        }),
        expect.objectContaining({
          name: "follow-up",
          stamp: 500
        }),
        expect.objectContaining({
          name: "on-end",
          stamp: 900
        })
      ])
    );
    done();
  });
});
