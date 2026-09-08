# RAGEBAIT WAYS TO DIE

An original, fully playable survival arcade game about a deeply replaceable orange temp. Four short minigames, one life, increasingly bad decisions. All characters, vector artwork, musical sequences and sound effects were created for this project.

## Run it

Use Node.js 22.12+ (Node 24 also works) and npm.

```sh
git clone https://github.com/MrFlixbus/Ragebait-ways-to-die.git
cd Ragebait-ways-to-die
npm install
npm run dev
```

Open the local address Vite prints. For a phone on the same network, use Vite's Network address and allow your development server through the local firewall if necessary.

```sh
npm run lint
npm run test
npm run build
npm run preview
```

`npm ci` reproduces the committed dependency lock. `npm run format` formats source and documentation. Build output goes to `dist/` and is intentionally ignored by Git.

## Play

Start a run, survive as many scenarios as possible, and lose on your first death. A short title card precedes each scenario. Success automatically advances; no Continue clicks. Every four successes increase difficulty, with bounded speed and a minimum 58% of the original timer. The same scenario cannot be randomly selected twice in a row.

| Scenario           | Interaction                            | The terrible idea / the actual solution                                                 |
| ------------------ | -------------------------------------- | --------------------------------------------------------------------------------------- |
| Feed the Machine   | Drag, or arrows then Space/Enter       | Printing feeds the problem. Feed your resignation into the printer's mouth.             |
| Dead Lift          | Timed click/tap or Space/Enter         | Calling your robot spotter during WORK is fatal. Ring during its visible REST interval. |
| Career Escalator   | Hold left/right buttons, arrows or A/D | The promotion leads to a shredder. Walk left against the moving belt to EXIT.           |
| Accept All Cookies | Repeated clicks/taps or Space/Enter    | Accepting allows the cookies to eat you. Eat the actual cookie first.                   |

Menus support Tab, Shift+Tab and Enter. Escape pauses and resumes gameplay or backs out of settings. Pointer capture supports dragging beyond the initial object. Losing browser focus or hiding the tab pauses the run. Quit presents a humorous resignation screen because a page cannot reliably close a user-opened tab.

Settings include master/music/effect volume, mute, screen shake and reduced motion. Changes immediately update the audio buses and persist with the high score in versioned localStorage. Invalid or inaccessible storage does not prevent playing. Music begins only after a user gesture.

## Mobile and accessibility

The logical stage is 960 × 540, centered and scaled without cropping. Portrait phones show the entire stage rotated clockwise; the shared input system applies the inverse transform, including safe-area offsets. Landscape phones show the normal stage. Browser chrome changes trigger resizing. Smaller viewports get larger menu controls. Motion reduction respects the OS preference on the first load and can be changed in settings.

Fullscreen and orientation locking depend on the browser, platform and user gesture. Their rejection is handled; CSS rotation remains available without either API. Audio cannot start before interaction. Clearing browser data clears records. Canvas gameplay is visual and is not a screen-reader-playable experience; menus and settings use semantic HTML controls. This build has no backend, advertising, analytics, external asset requests or account system.

## Netlify

1. Import this GitHub repository into Netlify.
2. Choose branch `main`.
3. Build command: `npm run build`; publish directory: `dist`.
4. Deploy. `netlify.toml` sets Node 22 and caching for Vite's hashed assets.

There is one HTML entry point and no client-side path routing, so no SPA rewrite is needed. Debug mode uses query parameters. Every runtime asset is part of the static build. No environment variables or secrets are required. GitHub pushes trigger Netlify builds once the repository is connected; pushing source by itself does not create a Netlify site.

## Architecture

TypeScript + Vite + an intentionally small Canvas 2D engine, with semantic HTML/CSS menus and synthesized Web Audio. Canvas was chosen over Phaser because this build consists of small procedural vector scenes without a physics world, texture atlas or sprite pipeline. A single coordinate transform controls the canvas, DOM shell and pointer input. This keeps the runtime dependency-free and the production game small; TypeScript contracts provide the scenario boundary an engine would otherwise provide.

- `src/core/`: lifecycle, state machine, score and difficulty.
- `src/scenarios/`: one independent directory per minigame and `registry.ts`.
- `src/input/`: shared Pointer Events, keyboard actions and viewport transforms.
- `src/audio/`: synthesized music and effects, gain buses and cleanup.
- `src/art/`: original reusable character and drawing primitives.
- `src/systems/`: resilient versioned saves.
- `src/ui/`: responsive shell styling.
- `tests/`: run, save, coordinate and scenario behavior tests.

See [the scenario authoring guide](docs/SCENARIO_AUTHORING_GUIDE.md) for the exact contract, a working module example, art rules, mobile constraints, testing checklist and a ready-to-copy agent prompt. See [credits](CREDITS.md) and [validation notes](docs/VALIDATION.md).

## Debug mode

Open `/?debug=1`. The bottom bar selects a scenario, restarts the current scenario and advances to the selected/random scenario. Difficulty is displayed. Example: `/?debug=1&scenario=paperwork`. Choosing Random restores anti-repeat selection. Restart retains the current run score/difficulty; the ordinary Start button begins at zero. Debug successes currently use the same local record as normal play.
