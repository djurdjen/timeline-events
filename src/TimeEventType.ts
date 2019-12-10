// https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

interface TimeEventBase {
  start?: number;
  followUp?: boolean;
  duration: number;
  id?: string;
  onStart?: Function;
  onEnd?: Function;
}
export type TimeEvent = RequireAtLeastOne<TimeEventBase, "start" | "followUp">;
