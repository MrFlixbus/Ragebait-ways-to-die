# Scenario authoring guide

## Architecture and lifecycle

`src/core/game.ts` owns the only animation loop and the screen state machine:

`menu → intro → playing → result → intro … → dead`

Settings, pause, quit and error screens are separate states. A run starts with zero survivors. A success increments the score and saves a new high score immediately. Death ends the run. The manager selects a registered definition using `nextId`, excluding the last ID when alternatives exist, and supplies `difficultyFor(score)`. The duration is multiplied by its bounded time scale. Scenario modules must not change global score, saves, DOM or screen state.

1. The manager selects a definition and displays its title/command/input hint for 1.1 seconds.
2. It calls `create(context)` once. All current art is procedural, so there are no asynchronous assets to preload.
3. The manager starts the definition's music and countdown.
4. The instance receives normalized input, `update(dt)` in seconds, and `draw(canvasContext, time)`.
5. The instance calls `context.finish(success, message)` once on a solved or fatal interaction. On timeout the manager uses the definition's `timeout` message.
6. The result remains visible for 1.35 seconds; `update` and `draw` continue for reaction animation. The instance must freeze gameplay after its own result.
7. `destroy()` releases owned resources. The manager drops the instance and stops all music/effect voices before the next title card or menu.

Only one scenario instance exists at a time. Pause stops scenario time and suspends audio; input releases still reach the instance so movement cannot remain stuck after resuming. Context motion preference is a live getter. Initialization/update/input/render failures are logged with the scenario ID, cleaned up, and lead to a recoverable error screen.

## Real file structure

```text
src/
  core/{game,rules,types}.ts
  audio/audio.ts
  art/draw.ts
  input/{input,viewport}.ts
  systems/save.ts
  ui/style.css
  scenarios/
    registry.ts
    paperwork/index.ts
    gym/index.ts
    escalator/index.ts
    cookies/index.ts
  main.ts
tests/core.test.ts
public/favicon.svg
```

`paperwork/index.ts` is a complete reference: it owns its paper position, drag state, result state and all printer art. There is no corresponding printer-specific code in `core/game.ts`.

## Exact required contract

Source of truth: `src/core/types.ts`.

| Definition property | Contract                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| `id`                | Unique, stable lowercase slug used by the registry and debug URLs.       |
| `title`             | Short uppercase title displayed in the intro and HUD.                    |
| `command`           | One sentence establishing the danger; displayed before gameplay.         |
| `hint`              | Short input-method hint displayed in the intro and game.                 |
| `duration`          | Base duration in seconds; manager applies difficulty time scaling once.  |
| `color`             | Scenario accent CSS color for its intro.                                 |
| `music`             | Nonempty array of MIDI note numbers for the original short music loop.   |
| `timeout`           | Funny failure explanation with enough information to learn the solution. |
| `create(context)`   | Synchronously returns a new independent instance.                        |

Context fields: `difficulty.level` (integer increasing every four successes), `difficulty.timeScale` (1 down to 0.58), `difficulty.speed` (1 up to 1.65), live `reducedMotion`, `sound(effect)` with `tap / bad / good / step`, and `finish(success: boolean, message: string)`.

| Instance method   | Contract                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `update(dt)`      | Advance local simulation by seconds. Receives capped frame deltas, including the result reaction period.                                             |
| `draw(ctx, time)` | Render inside 960 × 540. Time is scenario seconds; it is zero when reduced motion is enabled. Keep gameplay motion in simulation state if essential. |
| `input(event)`    | Handle normalized pointer/action events. Ignore interaction after settlement.                                                                        |
| `destroy()`       | Release any owned resources. No completion callback during destruction.                                                                              |

Do not rely on `draw` to update gameplay. Reduced motion freezes decorative time, but a timing gauge must still reflect the actual simulation state.

## Add scenario five

1. Create `src/scenarios/<your-id>/index.ts`.
2. Export a `ScenarioDefinition` with all properties above.
3. Put instance state inside `create`, never at module scope.
4. Implement update, draw, input and destroy using existing helpers.
5. Import and append the definition in `src/scenarios/registry.ts`. That is the only integration edit required.
6. Draw original artwork with `src/art/draw.ts`, with explicit canvas save/restore around local transforms.
7. Supply an original nonempty music sequence and interaction effects through the audio context.
8. Support pointer input and an appropriate equivalent keyboard action through the same state transition.
9. Guard the success/failure path with a local result flag. Set the flag before calling finish.
10. Supply a clear timeout explanation and a visible funny reaction to the tempting wrong action.
11. Use the supplied speed/level only where needed. The timer is already scaled by the core. Keep the hardest setting feasible.
12. Add behavior tests for correct input, bait, hardest difficulty, single settlement and release/cleanup.
13. Run lint, test, build, then browser tests in both orientations.

A complete minimal _contract example_, not finished scenario artwork:

```ts
import type { ScenarioDefinition } from '../../core/types';
import { character, room } from '../../art/draw';

export const example: ScenarioDefinition = {
  id: 'example',
  title: 'YOUR TITLE',
  command: 'A concrete danger.',
  hint: 'TAP / SPACE',
  duration: 8,
  color: '#9acbe7',
  music: [48, 55, 60, 58],
  timeout: 'Explain why the player died.',
  create(context) {
    let settled = false;
    const solve = () => {
      if (settled) return;
      settled = true;
      context.finish(true, 'An understandable absurd outcome.');
    };
    return {
      update(_dt) {},
      input(event) {
        if (event.type === 'action' && event.pressed && event.action === 'confirm') solve();
        if (event.type === 'down') solve();
      },
      draw(ctx, time) {
        room(ctx, '#b3d5e5', '#90b7cb');
        character(ctx, 480, 320, 1, settled ? 'happy' : 'panic', time);
      },
      destroy() {
        settled = true;
      },
    };
  },
};
```

Replace the example's trivial mechanic and scene with a complete original scenario before registering it.

## Input and mobile constraints

Pointer events are `{ type: 'down' | 'move' | 'up', x, y }`. Coordinates already use the logical landscape space. The input system captures one pointer, handles cancellation as release and ignores extra simultaneous fingers. A drag is down inside an object, moves while held, then up over a target. Swipe/hold logic can be derived from the same events without separate touch listeners.

Keyboard events are `{ type: 'action', action, pressed }`, with actions `left/right/up/down/confirm/cancel`. Arrows and WASD map to directions, Space/Enter to confirm, Escape to pause/back. Repeat keydowns are ignored, so hold movement by storing pressed direction and integrating it in update. The reference paper scene intentionally moves in discrete steps; its Space key drops/submits the letter.

Menu buttons and settings remain native keyboard-navigable HTML. Do not swallow keyboard events on input/select/button elements. Do not add window listeners, manually read touch coordinates, prevent browser gestures globally, or use DOM timers for gameplay.

### Coordinate transform

The whole `#game` element (canvas AND HTML shell) is transformed. For portrait phones, its dimensions are swapped and the stage is rotated clockwise about its top-left origin. Scale is:

`min(availableHeight / 960, availableWidth / 540)` in portrait rotation, otherwise `min(availableWidth / 960, availableHeight / 540)`.

After safe-area offsets and contain centering, the inverse is:

- Normal: `x=(clientX-left)/scale; y=(clientY-top)/scale`.
- Rotated: `x=(clientY-top)/scale; y=540-(clientX-left)/scale`.

All four `safe-area-inset-*` values are measured in `Viewport`. `visualViewport.resize` and window resize refresh layout. Canvas backing pixels may use up to 2× device pixel ratio; scenario coordinate space remains 960 × 540.

**Do:** keep objects and hit tests in logical coordinates; reserve y=0–110 for the shared HUD and hint; keep important actions between x=50–910 and y=120–500; use broad hit areas around visible controls; aim for at least 64 logical pixels in the short hit-target dimension on normal phones. Large directional targets can extend beyond their visual border without overlap.

**Do not:** inspect `innerWidth` per scenario, implement independent rotation, transform the pointer a second time, position interactions behind the HUD, require pixel hunting, or turn off zoom outside the canvas. Fullscreen orientation locking is opportunistic and must never be required to play. Physical notches, screen-reader gameplay and genuine iOS/Android behavior require device testing; desktop viewport emulation is not proof of those capabilities.

## Art and game feel

The palette uses ink `#202125`, warm white `#fff9e9`, acid lime `#d5fa43`, warning coral `#ff7955`, bubblegum `#f995c5`, powder blue and lilac scene accents. Use flat fills, 3–5 logical-pixel ink outlines, one hard shadow color and readable silhouettes. Avoid gradients, expensive blur filters or unrelated stock art.

The Temp is a coral rounded rectangular torso/head, two oversized off-white eyes, wiry black limbs, a three-point hair tuft and a TEMP badge. Reuse `character` with idle/happy/panic/dead moods. Match proportions when inventing NPCs; the robot deliberately shares the heavy outlines and compact face.

Use a low-amplitude idle bob, squash on interaction, anticipation before impact and a short exaggerated reaction. Confetti is capped at 12 pieces. Reduced motion must disable decorative rotations, shake and pulsing; keep essential motion such as belt traversal and the timing cursor functional. UI uses bold uppercase labels and short punchlines, with high contrast and visible focus. Death messages explain the trick; they must be funny rather than punish the player's technical limitations.

## Ragebait design

Establish a familiar assumption, make the bad action tempting, show one inferable contradiction, reward the strange interpretation, then explain it through a funny consequence. The printer eats paperwork, so quitting removes the employee; the gym robot has a displayed union break; the career ladder visibly ends in a shredder; the cookie consent dialog contains an actual edible cookie.

Good tricks are visible, learnable, quick and consistent across repeats. Bad tricks include invisible hitboxes, arbitrary objects, unlabeled timing windows, pure luck, unreadable timers and targets too small for fingers. Difficulty should stress execution rather than erase the clue. Do not copy recognizable scenarios, characters, songs or assets from other games.

## Audio and loading

All current sound is synthesized centrally with one Web Audio context, master/music/SFX gain buses, smoothed volume changes and a single music scheduler. Browser unlock happens after a gesture. `playMusic` replaces the previous loop; `stop` cancels the interval and stops/disconnects voices. Scenario modules never instantiate AudioContext or create independent intervals. Use `context.sound('tap')` for interaction; the manager automatically supplies success and death sounds.

If a future scenario needs external assets, put them in its `assets/` directory with names such as `<id>-background.svg` or `<id>-ambience.ogg`; import URLs through Vite. Preload and decode them before the timed create/launch phase through a deliberate shared loader extension. The current synchronous contract intentionally has no unused preload hook; do not begin a countdown while downloads are pending. Prefer procedural art and synthesis when possible.

For recordings use short normalized Ogg/MP3 clips, with MP3 fallback when necessary, trim silence, use seamless loops, avoid clipping and compare their perceived level with existing effects. Route them through the existing gain buses and stop them on destruction. Document filename, author, license, source URL and modifications in CREDITS.md. Never assume that a search result is licensed for distribution.

## Performance budgets

Aim for 60 FPS with bounded per-frame work, no allocations proportional to elapsed playtime and no DOM rebuilds from update. Keep scenarios under roughly 100 drawing primitives per frame where practical, particles below 32, optional textures at 1024² or smaller (2048² only when justified), each scenario's optional asset download below 500 KB and short audio clips below 250 KB. Do not ship uncompressed long WAV tracks. Release references and listeners on destroy; use the core simulation clock instead of new timers. Test repeated switching, not only the first launch.

## Testing and integration checklist

Copy this into an issue or PR:

- [ ] Unique module directory and stable ID; registry updated once.
- [ ] Different, inferable bait and correct solution; all original artwork and sound.
- [ ] Success, wrong-action death and timeout are understandable and visible.
- [ ] Mouse, touch, keyboard equivalent, dragging/release/cancellation as relevant.
- [ ] Portrait rotated and landscape presentation, resize mid-run, safe areas.
- [ ] Small phone, desktop and tablet; no offscreen controls or overlapping targets.
- [ ] Easiest and maximum difficulty remain possible.
- [ ] Restart, menu return, pause/resume, background tab, scenario switching.
- [ ] Mute and all buses update live; no music duplication or orphan voices.
- [ ] Reduced motion and keyboard focus tested.
- [ ] No leaked timers/listeners/resources; no console errors.
- [ ] Relevant automated behavior/coordinate tests added; lint, tests and build pass.
- [ ] Desktop Chrome and Firefox checked where available.
- [ ] Mobile Safari and Mobile Chrome checked on real devices where available; explicitly record unavailable coverage.
- [ ] README scenario list and CREDITS updated; build output excluded from Git.

Debug using `/?debug=1&scenario=<id>`. Select an entry and press Next to launch it, Restart to retry the current entry, or Start to reset the run. The level indicator reflects the current score. Difficulty maxima can be exercised directly in unit tests with `difficultyFor(1000)`.

## Ready-to-copy coding-agent prompt

> Add ONE original playable scenario to RAGEBAIT WAYS TO DIE. First read README.md, docs/SCENARIO_AUTHORING_GUIDE.md, src/core/types.ts and one existing scenario module. Invent a new absurd danger with an obvious tempting wrong action, a surprising but inferable correct action, a short funny death and a celebratory success. Make its mechanic distinct from the current four. Implement it in src/scenarios/<id>/index.ts with state scoped inside create, shared drawing helpers, normalized input and centralized audio. Reuse the orange Temp and established cel-shaded palette. Support mouse, keyboard where sensible and touchscreen, including rotated portrait coordinates without scenario-specific viewport code. Use supplied difficulty parameters and respect reduced motion. Do not modify unrelated core systems, create global listeners, start independent music loops, introduce copyrighted assets or leave placeholders. Register it in src/scenarios/registry.ts, update the README scenario list, and update CREDITS.md for every new external asset with explicit source/license. Test success, bait, timeout, hardest difficulty, pause/release, cleanup, repeated switching and mobile orientations. Run npm run lint, npm run test and npm run build, fix failures, and clearly report actual browser/device coverage. Preserve Netlify static deployment and the committed lockfile. Do not push or deploy unless the user's current instructions authorize it.
