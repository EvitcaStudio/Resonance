# Resonance Module
A plugin that will easily allow you to play sounds and control them.

## Installation

### ES Module

```js
import { Resonance } from './resonance.mjs';
```

### IIFE (Immediately Invoked Function Expression)

```js
<script src="resonance.js"></script>;
// ...
window.ResonanceBundle.Resonance;
```

### Global Dependency

Resonance relies on the `VYLO` variable being globally accessible.
## Crossfading

```ts
const fade = Resonance.crossfade(outgoing.gainNode, incoming.gainNode, {
    durationMS: 650,
    volume: 0.25,
});
await fade.finished;
// The application may now pause/stop its outgoing source.
```

Pass playing tracks' GainNodes; start a new incoming track at zero gain.
Resonance applies simultaneous equal-power curves on the audio clock. Volume is
the destination gain (0–1), before master volume. Sources and track selection
remain owned by the caller. Either gain may be null for a one-sided fade.

Call `fade.cancel()` before reversing/replacing a fade or stopping its sources.
Cancellation holds both gains at their current levels so a new fade can start
smoothly. `finished` resolves on completion or cancellation; callers replacing a
fade must ignore the old completion. Suspended audio does not complete on wall
time. This API does not change the existing per-sound `fade()` behavior.

Run `bun run test` for crossfade regressions.
