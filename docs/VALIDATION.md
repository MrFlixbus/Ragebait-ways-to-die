# Validation — first playable release

## Automated checks

- `npm install`: succeeds with the committed package lock; install audit reported zero vulnerabilities.
- `npm run lint`: strict TypeScript and ESLint.
- `npm run test`: 26 passing tests covering anti-repeat selection, registry completeness, score/high score, safe save parsing, bounded difficulty, five viewport configurations, inverse pointer transforms, both printer solutions, gym timing and bait, escalator movement/release/max difficulty, cookie input and single settlement.
- `npm run build`: TypeScript validation and Vite static production build.
- A GitHub Actions workflow runs clean installation, lint, tests and build on pushes and pull requests.

## Browser checks performed

Checked in the available Chromium-based Codex browser against the Vite server:

- Finished main menu and death-screen visual inspection at 960 × 540.
- Actual pointer drag from the resignation letter into the printer in a 390 × 844 portrait viewport, with the entire game rotated 90 degrees: success and score increment verified.
- Cookie scenario completed using six Space presses: success verified.
- Gym scenario completed by clicking the bell in the displayed REST timing window: success verified.
- Wrong PRINT button: failure explanation, score, persistent record and restart/menu buttons verified.
- Restart, pause, settings, mute and reduced-motion controls exercised.
- Settings persisted across navigation/reload; record persisted between runs.
- Portrait settings panel inspected after enlarging compact controls: all content remains within the stage.
- Browser console inspection returned no warnings or errors during these checks.

## Coverage limits

The available browser tests use desktop Chromium with responsive viewport overrides, not physical mobile touch hardware. The portrait test exercises actual Pointer Events and coordinate mapping, but is not a hardware touch test. Real iOS Safari, Android Chrome, desktop Firefox, notches, audible output quality, OS interruption behavior and platform-specific fullscreen/orientation locking still require device testing. The corresponding fallback paths and transforms are implemented. A Netlify deployment is configured but not created as part of the GitHub push.
