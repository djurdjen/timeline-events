## Timeline events

A simple package for firing events on custom points in a timeline.

```
yarn add timeline-events
```

Example:

```javascript
import Timeline from "timeline-events";

const tl = new Timeline([
  {
    start: 0,
    duration: 2,
    cb: () => {
      console.log("Test");
    }
  },
  {
    followUp: true,
    duration: 2,
    cb: () => {
      console.log("Test 2 follow-up");
    }
  },
  {
    start: 1,
    duration: 2,
    cb: () => {
      console.log("Test 3 - but sooner then Test 2 follow-up");
    }
  }
]);
```

### Timeline entry options

<br>
**start** `number` (in seconds)<br >
A number to define when the callback of the entry should fire <br>Mandatory when NOT using `followUp` in the next entry!

**duration** `number`<br >
Duration until next animation. <br>Mandatory when using `followUp` in the next entry!

**followUp** `boolean`<br >
Fire immediately after the previous entry ends

**cb** `function` (mandatory)<br >
The callback fired when reaching the startingpoint
