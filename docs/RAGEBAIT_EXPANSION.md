# Ragebait expansion design

The original four games mostly reward discovering one trick. These three add execution pressure after discovery: anticipation, inhibition, and a rule change immediately after a small victory. All use the existing procedural cel-shaded character, thick ink outlines, flat shadows, and palette. No external assets or runtime dependencies.

## Hold the Door (`elevator`)

Hold the override immediately. The first two floor arrivals produce fake dings and an ARRIVED notice, but the doors visibly remain locked. At ride time 3.8 the doors open onto EXIT; release before 4.3. Waiting forever also kills you. The joke is premature relief, with a reliable visual tell instead of random failure.

At maximum difficulty the ride runs at 1.2925x and the real release window is about 387ms. The 5.22-second minimum round allows the 1.5-second starting grace plus the required hold. Audio reinforces the visual state and is never required.

## Cross My Heart (`crossing`)

Hold to walk, release to stop. The camera is blind for the first 1.1 seconds of each 2-second simulation cycle. BRAKING appears at 0.8, providing a 300ms warning (182ms at maximum speed). Its shutter and state label are truthful. The WALK sign says the opposite. Crossing requires roughly three movement windows, so knowing the trick does not remove the need to execute it.

Both movement and shutter speed scale together. Crossing takes about 4.8 simulation seconds with precise stops, under the minimum 6.96-second round timer. Simulation substeps prevent skipping fatal shutter transitions on slow frames.

## Terms & Detonation (`defuse`)

Make three cuts while the needle is in green. Each successful cut moves green, reverses the needle, and increases its speed. Mashing after a successful cut is fatal. Needle direction, cut count, intact/severed wires, and updated-terms copy explain every change.

Safe-zone width shrinks from 15% to a bounded 10.5%. At maximum difficulty the narrowest window is about 94ms; earlier cuts are more forgiving. Targets and direction changes are deterministic, so a player can learn the rhythm. A perfect three-cut solution takes about 1.71 seconds at maximum speed, leaving time for extra needle laps.

## Fairness boundaries

No random unavoidable deaths, unannounced input inversion, moving hitboxes, artificial input lag, or audio-only clues. Essential gameplay motion remains active with reduced motion enabled; decorative character motion and scanning beams stop. Every death explains the rule. Controls support pointer and keyboard, and each scenario settles only once and stops on destruction.

## Validation

Automated scenario tests cover pointer/keyboard solutions, maximum difficulty, bait failures, premature/late release, camera transition collision, release behavior, repeated settlement, and cleanup. The existing anti-repeat registry and coordinate transform tests also cover the expanded scenario pool. Difficulty and frustration quality still benefit from human playtesting; automated solvability does not establish how fun a timing window feels.
