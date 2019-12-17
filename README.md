# Timeline events

A package for firing events at custom intervals on a virtual timeline.

### [Demo](https://codepen.io/djurdjen/pen/bGNBmrQ)

## Installation

```
yarn add timeline-events
```

or

```
npm install timeline-events
```

or import from cdn

```html
<script src="https://unpkg.com/timeline-events/dist/index.var.js" />
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

| Functions                        | Description                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.play(<customProgress:number>)` | Plays timeline. Start from 0 everytime when clicked<br>You can add custom progress number (in seconds) as an argument. This will skip the entries that have passed the progress |
| `.stop(<function({args})>)`      | Stops timeline                                                                                                                                                                  |
| `.pause(<function({args})>)`     | Pauses timeline                                                                                                                                                                 |
| `.continue()`                    | Continues timeline when in a paused state                                                                                                                                       |
| `.finished()`                    | Callback for when timeline has finished                                                                                                                                         |
| `.onUpdate(<function({args})>)`  | Callback for every interval (every 0.01s)                                                                                                                                       |

<br>

## Timeline entry options

| Property | Type                                      | Description                                                            |
| -------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| start    | `number` (Required if followUp is `null`) | A number to define when the event should start                         |
| duration | `number` (Required)                       | Duration ( in seconds ) until the event ends.                          |
| followUp | `boolean` (Required if start is `null`)   | Fire immediately after the previous event duration has reached its end |
| onStart  | `function`                                | The callback fired when reaching the startingpoint of an event         |
| onEnd    | `function`                                | callback fired when reaching the endpoint of the duration of an event  |
