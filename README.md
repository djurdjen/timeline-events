# Timeline events

A package for firing events on custom points on a virtual timeline.

```
yarn add timeline-events
```

or

```
npm install timeline-events
```

## Usage

```javascript
import Timeline from "timeline-events";

const tl = new Timeline([
  {
    start: 0,
    duration: 2,
    onStart: () => {
      console.log("Test");
    }
  },
  {
    followUp: true,
    duration: 2,
    onStart: () => {
      console.log("Test 2 follow-up");
    },
    onEnd: () => {
      console.log("Test 2 follow-up -- end");
    }
  },
  {
    start: 1,
    duration: 2,
    onStart: () => {
      console.log("Test 3 - but sooner then Test 2 follow-up");
    }
  }
]);
tl.play();
```

## Timeline functions

| functions                     | description                                         |
| ----------------------------- | --------------------------------------------------- |
| `.play()`                     | Plays timeline. Start from 0 everytime when clicked |
| `.stop(function({args}))`     | Stops timeline                                      |
| `.pause(function({args}))`    | Pauses timeline                                     |
| `.continue()`                 | Continues timeline when in a paused state           |
| `.onUpdate(function({args}))` | Callback for every interval (every 0.01s)           |

## Timeline entry options

| options  | accepts    | description                                                                                                                  |
| -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| start    | `number`   | A number to define when the callback of the entry should fire <br>**Mandatory when NOT using `followUp` in the next entry!** |
| duration | `number`   | Duration ( in seconds ) until next animation. **(Mandatory)**                                                                |
| followUp | `boolean`  | Fire immediately after the previous entry ends                                                                               |
| onStart  | `function` | The callback fired when reaching the startingpoint of an event                                                               |
| onEnd    | `function` | callback fired when reaching the endpoint of the duration of an event                                                        |
