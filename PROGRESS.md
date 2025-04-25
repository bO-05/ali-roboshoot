# Personal Development Progress Log

**Project:** Ali Roboshoot <br>
**Start Date:** 2025-04-15 <br>
**Maintainer:** bO-05

---

## Feature/Task Checklist

| Feature / Task                                 | Status      | Notes / Blockers                   | Last Updated |
|------------------------------------------------|-------------|------------------------------------|--------------|
| Map rendering (TileSprite background)          | ✅ Complete | Using tiling background image      | 2025-04-17 |
| Player character & movement                    | ✅ Complete | Red Car sprite, corrected 8-dir frames | 2025-04-18 |
| Player idle animation                          | n/a         | Player uses static frame per direction | 2025-04-17 |
| Shooting mechanic (bullets, cooldown)          | ✅ Complete | Player bullets work                | 2025-04-17 |
| Enemy spawning & movement                      | ✅ Complete | Scarabs/Hornets/Spiders spawn & chase/strafe | 2025-04-23 |
| Enemy Attack (Melee & Ranged)                | ✅ Complete | Melee/Ranged attacks implemented   | 2025-04-23 |
| Enemy Animation (walking, melee, destroyed)    | ✅ Complete | All enemy animations functional   | 2025-04-23 |
| Collision (player bullet/enemy, enemy bullet/player)| ✅ Complete | Separate bullet groups, correct destruction/damage | 2025-04-23 |
| Score & health UI                             | ✅ Complete | Replaced text UI with graphical assets, added numerical health | 2025-04-23 |
| Game loop (start, game over, restart)          | ✅ Complete | Game -> GameOver -> Game/MainMenu works | 2025-04-21 |
| Pause Feature                                  | ✅ Complete | 'P'/'ESC' pauses/resumes, UI updated with objectives/pickups | 2025-04-25 |
| Visual Feedback (Hit Flash, Screen Shake)      | ✅ Complete | Enemy flash on hit, screen shake   | 2025-04-17 |
| Visual Feedback (Explosion Effect)             | ✅ Complete | Explosion on enemy destruction, Orange Robot uses 'big_explosion' | 2025-04-25 |
| Load assets from Alibaba Cloud OSS             | ✅ Complete | Assets loaded from OSS bucket     | 2025-04-17 |
| Backend for high scores (Node.js/Express/RDS)  | ✅ Complete | Deployment guide created, using Function Compute now | 2025-04-21 |
| Deploy to Alibaba Cloud ECS/SAE                | ✅ Complete | Deployed via Function Compute + OSS | 2025-04-21 |
| Polish (Graphical UI, Sound, Effects)          | ✅ Complete | UI, SFX, BGM, VFX done. Controls displayed (Menu/Pause/HUD). | 2025-04-22 |
| **High Score System Enhancements**             |             |                                    |              |
|   - Visual Feedback for Score Submission       | ✅ Complete | Added status text (Saving/Saved/Error) in GameOver | 2025-04-21 |
|   - Player Initials Input                      | ✅ Complete | Implemented editable initials in MainMenu | 2025-04-25 |
|   - Display High Score List                    | ✅ Complete | Displayed in MainMenu and GameOver | 2025-04-20 |
|   - Score Submission Fix (Pause -> Quit)       | ✅ Complete | Fixed CORS error when submitting score via P->Q | 2025-04-25 |
| **UI/UX Polish**                               |             |                                    |              |
|   - Music Toggle (Keyboard)                    | ✅ Complete | 'M' key in MainMenu, fixed stacking bug | 2025-04-21 |
|   - SFX Toggle (Keyboard)                      | ✅ Complete | 'F' key in MainMenu                | 2025-04-21 |
|   - Mute Control Hints                         | ✅ Complete | Added hints to Pause & GameOver screens | 2025-04-21 |
|   - Keyboard Navigation                        | ✅ Complete | Pause('Q'->Menu), GameOver('R'->Restart, 'M'->Menu) | 2025-04-21 |
|   - Removed Mouse UI Navigation                | ✅ Complete | Restart/Menu buttons keyboard-only | 2025-04-21 |
|   - Main Menu Layout Adjustment                | ✅ Complete | Rearranged Initials, Start, Controls, Scores. Fixed alignment/fonts. | 2025-04-25 |
|   - GameOver Layout Adjustment                 | ✅ Complete | Background smaller/higher, text rearranged. Fixed duplicate scores display. | 2025-04-25 |
|   - Pause UI Enhancements & Fixes              | ✅ Complete | Added Objectives/Pickups info. Fixed layout/overlap issues. | 2025-04-25 |
|   - Debug Key Deactivation                   | ✅ Complete | Commented out 'G' key debug for GameOver jump. | 2025-04-25 |
| **Map Refactor & Scaling**                   |             |                                    |              |
|   - Replace Dynamic Map with Large Fixed Map   | ✅ Complete | Replaced expanding map with 8400x8400 fixed world. | 2025-04-23 |
|   - Scale Game Elements                        | ✅ Complete | Player, enemies, bullets, explosions scaled 1.5x. Physics bodies adjusted. | 2025-04-23 |
|   - Adjust Enemy Spawning                      | ✅ Complete | Enemies spawn in ring around camera view. | 2025-04-23 |
|   - Time-based Difficulty Scaling              | ✅ Complete | Replaced map-based scaling with time-based increase in enemy count/spawn rate. | 2025-04-23 |
| **Player & UI Updates**                      |             |                                    |              |
|   - Increase Player Health                     | ✅ Complete | Player health/maxHealth increased to 500. | 2025-04-23 |
|   - Add Numerical Health Display               | ✅ Complete | Added 'HP: current/max' text, styled like score/ammo | 2025-04-23 |
|   - Fix Player SE Sprite                       | ✅ Complete | Corrected sprite texture/frame for Southeast direction. | 2025-04-23 |
|   - Initialize Score Display                   | ✅ Complete | Score UI now correctly displays initial '0'. | 2025-04-23 |
| **Audio Enhancements & Fixes**                 |             |                                    |              |
|   - New GameOver Sound Sequence                | ✅ Complete | Implemented pixel-death -> game-over -> delayed BGM sequence. | 2025-04-23 |
|   - Improved Mute Logic                        | ✅ Complete | More robust BGM handling/muting across scenes (MainMenu/GameOver). | 2025-04-23 |
|   - Adjust Player Hit Volume                   | ✅ Complete | Player hit sound (explode) volume significantly reduced. | 2025-04-23 |
| **Pickup System**                              |             |                                    |              |
|    - Pickup Base System (Class, Config, Group)   | ✅ Complete | Added Pickup.js, pickupsConfig.js, pickupsGroup | 2025-04-20 |
|    - Pickup Spawning (Enemy Drop)              | ✅ Complete | trySpawnPickup called on enemy death | 2025-04-20 |
|    - Repair Heart Pickup                       | ✅ Complete | Heals player 50 HP, uses SFX       | 2025-04-20 |
|    - Ammo Clip Pickup                          | ✅ Complete | Grants 35 ammo (was 15), uses SFX         | 2025-04-25 |
|    - Player Ammo Logic                         | ✅ Complete | player.ammo added, checked/decremented | 2025-04-20 |
|    - Ammo Count UI                             | ✅ Complete | Displays ammo (Text Object, Yellow) | 2025-04-20 |
|    - Score Icon (UI)                         | ✅ Complete | Added orange '!' icon (frame 18) | 2025-04-20 |
|    - Score Display UI                        | ✅ Complete | Displays score (Text Object, White) | 2025-04-20 |
|    - Remove Initial Spawn Delay              | ✅ Complete | Removed 'startAt' from enemySpawnTimer | 2025-04-20 |
|    - Overdrive Bolt Pickup                   | ✅ Complete | Implemented temp fire rate buff (8s) | 2025-04-20 |
|    - Adjusted Pickup Spawn Rates             | ✅ Complete | Increased ammo/heart chance (45%/45%/10%) | 2025-04-20 |
|    - Debug Initial UI Display                | Obsolete    | Switched to Text objects, issue resolved | 2025-04-20 |
| **RPG Weapon System** (Replaced Grenades)    |             |                                    |              |
|    - RPG State & Initial Count             | ✅ Complete | player.rpgAmmo = 10 initially      | 2025-04-23 |
|    - RPG Assets & Animation                | ✅ Complete | Loaded RPG round & big explosion   | 2025-04-23 |
|    - RPG Count UI                          | ✅ Complete | Icon (from RPG sheet) + Text added | 2025-04-23 |
|    - RPG Launch Input & Cooldown           | ✅ Complete | 'R' key launch with cooldown       | 2025-04-23 |
|    - RPG Projectile Logic                  | ✅ Complete | Fires straight like bullet         | 2025-04-23 |
|    - RPG Explosion (Visual & SFX)          | ✅ Complete | Big explosion anim, reused SFX     | 2025-04-23 |
|    - RPG Area Damage                       | ✅ Complete | Damages enemies within 128px radius | 2025-04-23 |
|    - RPG Pickup Item                       | ✅ Complete | Config, spawn chance, handler added | 2025-04-23 |
|    - Grenade System Code Commented Out     | ✅ Complete | Grenade.js & Game.js code kept     | 2025-04-23 |
| **Controls & UI Polish**                   |             |                                    |              |
|    - Update RPG Control                    | ✅ Complete | Changed RPG fire from Right-Click to 'R' key | 2025-04-23 |
|    - Disable Right-Click Context Menu      | ✅ Complete | Prevented browser menu on game canvas | 2025-04-23 |
|    - Update Control Hints                  | ✅ Complete | HUD and Pause screen show RPG: R   | 2025-04-23 |
| **Pickup System Polish**                   |             |                                    |              |
|    - Fix Pickup Visuals                    | ✅ Complete | Pickups now display correct icon frame | 2025-04-23 |
|    - Update RPG Pickup Icon                | ✅ Complete | RPG drop uses RPG projectile frame | 2025-04-23 |
| **Enemy Variety**                          |             |                                    |              |
|    - Add Hornet Enemy                      | ✅ Complete | Ranged attack (1.25x dmg), strafing | 2025-04-23 |
|    - Add Spider Enemy                      | ✅ Complete | Melee/Ranged attack (1.5x dmg)     | 2025-04-23 |
|    - Integrate New Enemies                 | ✅ Complete | Random spawning (Scarab/Hornet/Spider)| 2025-04-23 |
|    - Update Damage Handling                | ✅ Complete | Collision/bullet damage use enemy values | 2025-04-23 |
| **Objective System**                     |             |                                    |              |
|    - Add Objective Flag                    | ✅ Complete | Spawn logic, capture handling, UI arrow | 2025-04-24 |
|    - Add Orange Robot Guardian             | ✅ Complete | Spawns with flag, guards it, drops loot | 2025-04-24 |
|    - Fix Objective Arrow Direction         | ✅ Complete | Corrected frame mapping in atlas & code | 2025-04-24 |
|    - Fix Initial Flag Spawn                | ✅ Complete | Ensures flag spawns at game start  | 2025-04-24 |

---

## Recent Changes / Changelog

+ 2025-04-25: **Main Menu UI Overhaul:** Rearranged layout of Initials Selector, Start Prompt, Controls Info, and High Scores list for better visual alignment and organization (`MainMenu.js`). Fixed font consistency issues (`Arial Black` used more widely) and alignment problems (using `sharedTopY` and `setOrigin(0.5, 0)`).
+ 2025-04-25: **Main Menu Bug Fixes:** Fixed `TypeError: this.currentInitials is undefined` by initializing the variable correctly. Re-added missing keyboard event listeners for initials selection/modification. Re-added missing `startGame` function definition and 'Enter' key listener.
+ 2025-04-25: **GameOver High Score Fix:** Removed duplicate call to `displayHighScores` in `GameOver.js` `create` method to prevent the score list from rendering twice.
+ 2025-04-25: **Score Submission Fix (Pause -> Quit):** Corrected the fallback URL used when submitting scores via Pause -> Q in `Game.js` to use the correct Alibaba Cloud API endpoint, fixing CORS errors.
+ 2025-04-25: **Orange Robot Explosion Polish:** Modified `OrangeRobotEnemy.js` `destroySelf` method to use the preloaded `big_explosion` spritesheet and animation instead of scaling up the small explosion, providing a more impactful visual.
+ 2025-04-25: **Pause Menu Enhancements:** Added "OBJECTIVES" and "PICKUPS" sections to the pause screen UI in `Game.js`, detailing game goals and item effects. Updated Ammo Clip description to reflect increased value (35).
+ 2025-04-25: **Pause Menu Layout Fix:** Rearranged elements in the pause screen UI (`Game.js`) to follow a specified order (Title -> Controls -> Objectives -> Pickups -> Hints -> Warning -> Quit Button) and adjusted Y positions to fix text overlap issues.
+ 2025-04-25: **Deactivated Debug Key:** Commented out the 'G' key listener in `MainMenu.js` that allowed jumping directly to the GameOver scene, preserving the code for development purposes.
+ 2025-04-25: **Updated Pickup Config:** Modified `pickupsConfig.js` to increase the value of `ammo_clip` from 15 to 35.
+ 2025-04-24: **Console Log Cleanup:** Reviewed and commented out numerous non-critical `console.log` statements across `Game.js`, `ObjectiveFlag.js`, `ScarabEnemy.js`, `HornetEnemy.js`, `SpiderEnemy.js`, and `MainMenu.js` to reduce console noise while preserving essential debugging logs (errors, core game events like damage/score/capture).
+ 2025-04-24: **Fixed Objective Arrow Direction (JSON Atlas):** Corrected the `filename` properties within the texture atlas file `public/assets/UI/dotted-arrows.json` to accurately map frame names (e.g., `objective-arrow-N`) to their corresponding image coordinates based on `dotted-arrows-fix.txt`. This ensures the mapping used in `Game.js` correctly references the visual data.
+ 2025-04-24: **Fixed Objective Arrow Direction (Code):** Corrected the `frameNameMap` array within the `updateFlagDirectionArrow` method in `Game.js` to use the proper order of frame names corresponding to the 16 calculated directional segments (N, NNE, ..., NNW).
+ 2025-04-24: **Fixed Initial Objective Flag Spawn:** Added a call to `this.trySpawnObjectiveFlag()` at the end of the `create` method in `Game.js` to ensure the objective flag is created when the game scene starts, resolving the issue where the flag never appeared.
+ 2025-04-23: **Implemented Enemy Health Bars & Balanced Gameplay:** Added overhead health bars (using `overhead-health-bars-green.png`) to Scarab, Hornet, and Spider enemies, updating dynamically based on health thresholds. Adjusted enemy health (Scarab: 25, Hornet: 50, Spider: 75) for desired bullet hits-to-kill (1, 2, 3 respectively with 25 damage bullets). Increased player bullet damage to 25 and RPG damage to 125. Implemented specific destroyed frame displays for enemies before explosion/removal. Refined enemy animation logic (Scarab fire, Spider transitions, Hornet body size/offset). Added detailed debug logging for enemy damage/health.
+ 2025-04-23: **Added Hornet & Spider Enemies:** Added Hornet (ranged, strafing, 1.25x dmg) and Spider (melee/ranged, 1.5x dmg) enemies. Updated preloader with assets/animations, created enemy classes (HornetEnemy.js, SpiderEnemy.js), and modified Game.js to handle random spawning and use enemy-specific damage values in collision/overlap handlers.
+ 2025-04-23: **Updated Controls & Fixed Pickups:** Changed RPG fire key from Right-Click to 'R'. Disabled browser right-click context menu. Updated control hints in HUD and Pause screen. Fixed bug where all pickups showed ammo icon; they now show the correct frame from config. Updated RPG pickup drop visual to use RPG projectile sprite.
+ 2025-04-23: **Replaced Grenades with RPG:** Commented out grenade system (Grenade.js, Game.js logic, Preloader assets/anims, pickupsConfig). Implemented RPG system: loads RPG projectile & big explosion assets/anims; adds player RPG ammo state, UI display (using RPG sprite frame 2), right-click launch input (later changed to R key), launch logic (straight fire), collision handling with large AoE damage (128px) using big explosion animation, and RPG ammo pickup (replaces grenade pickup drop chance).
+ 2025-04-23: **Increased Player Health & Added UI:** Player `health`/`maxHealth` increased to 500. Added `healthText` UI element next to bar showing numerical HP (`current/max`). UI updates on creation and player damage.
+ 2025-04-23: **Fixed Player SE Sprite:** Modified `Game.js` update loop to use correct texture key (`player_car_diag2`) and frame index (0) for Southeast movement.
+ 2025-04-23: **Fixed Map & Scaled Visuals:** Replaced dynamic map expansion with a large (8400x8400) fixed world. Removed expansion code (`expandWorld`, timer). Scaled player, enemies, bullets, explosions by 1.5x and adjusted physics bodies. Updated enemy spawning to use a ring around the camera. Replaced map-based difficulty scaling with a time-based timer (`increaseDifficulty`, `difficultyTimer`).
+ 2025-04-23: **Improved Audio:** Implemented new GameOver sound sequence (`pixel-death` -> `game-over` -> delayed `bgm`). Refactored BGM/mute logic in `MainMenu` and `GameOver` for better cross-scene consistency. Further reduced player hit sound volume (`explode` volume: 0.1). Added GameOver BGM timer cleanup in `shutdown`.
+ 2025-04-23: **Fixed Initial Score Display:** Added initialization for `scoreDigits` group and initial call to `updateScoreDisplay(0)` in `Game.js` `create` method.
+ 2025-04-23: **Investigated Gameplay Issues:** Attempted to fix initial score appearing as > 0 (refined spawn logic, added delay) and player position resetting (adjusted start pos, added debug logs). Decided to treat remaining instances as features.
+ 2025-04-21: **Fixed Music Toggle:** Reimplemented `applyMusicMuteState` in `MainMenu.js` to correctly stop/resume the single BGM instance, preventing stacking bug when muting/unmuting with 'M' key. Added detailed debug logs.
+ 2025-04-21: **Fixed Pause -> Main Menu ('Q' Key):** Corrected logic in `Game.js`. Moved `keyQ` creation to `create`, moved 'Q' key check to start of `update` guarded by `isPaused`, removed faulty check from `togglePause`, removed redundant/conflicting pause UI creation block from `create`.
+ 2025-04-21: **Fixed Pause UI Visibility:** Refactored pause UI element creation in `Game.js` to happen once in `create` (via `createPauseUI`), ensuring `togglePause` only handles visibility toggling, fixing bug where elements remained after unpausing.
+ 2025-04-21: **Keyboard Navigation:** Replaced mouse click interactions for UI navigation with keyboard inputs: Pause Screen ('Q' to Main Menu), Game Over Screen ('R' to Restart, 'M' to Main Menu). Updated hint text accordingly.
+ 2025-04-21: **GameOver Layout & Font:** Adjusted layout in `GameOver.js`: moved background image up/scaled down, moved score/restart/hints to bottom, centered high score list. Updated high score font to match restart prompt style (`Arial Black`, larger size). Ensured "Top 5 Scores" text depth is correct.
+ 2025-04-21: **Mute Control Hints:** Added text hints on Pause and Game Over screens indicating mute controls ('M'/'F') are available on the Main Menu.
+ 2025-04-21: **Mute Toggles (Keyboard):** Implemented keyboard controls ('M' for Music, 'F' for SFX) in `MainMenu.js` to toggle mute states stored in registry. Removed clickable text toggles. Added key hints. Ensured SFX checks registry state before playing sounds in `Game.js`. Fixed initial music stacking bug with robust instance handling.
+ 2025-04-21: **Score Submission Feedback:** Added text element to `GameOver.js` (`this.submissionStatusText`) to display "Saving score...", "Score Saved!", or "Error saving score / Network Error" based on the fetch API response.
+ 2025-04-20: Added controls display to Pause screen & updated HUD hint.
+ 2025-04-20: Added controls display to Main Menu.
+ 2025-04-20: Fixed BGM stopping on window blur (applied pauseOnBlur workaround).
+ 2025-04-20: Fixed BGM not playing initially (moved play call to MainMenu interaction).
+ 2025-04-20: Moved animation definitions to Preloader to fix timing issues.
+ 2025-04-20: Confirmed current explosion visual effect is acceptable.
+ 2025-04-20: Added gunshot and explosion sound effects.
+ 2025-04-20: Styled GameOver scene using background image and text score.
+ 2025-04-20: Styled GameOver scene using background image and number sprites.
+ 2025-04-19: Replaced text health/score with graphical sprites.
+ 2025-04-19: Fixed pause text duplication bug.
+ 2025-04-19: Fixed score not incrementing bug.
+ 2025-04-18: Added explosion effect on enemy destruction.
+ 2025-04-18: Corrected player car sprite frame selection logic based on detailed asset description.
+ 2025-04-17: Implemented Pause feature.
+ 2025-04-17: Added enemy hit flash and screen shake on player damage.
+ 2025-04-17: Fixed enemy melee damage logic & added enemy bullet attack.
+ 2025-04-17: Separated player/enemy bullet groups, fixed enemy self-destruction.
+ 2025-04-17: Updated player sprite to Red Car with directional frames.
+ 2025-04-17: Configured game to load assets from Alibaba Cloud OSS.
+ 2025-04-17: Created detailed Alibaba Cloud deployment guide.
+ 2025-04-17: Implemented score system and Game Over scene transition/restart.
+ 2025-04-17: Fixed Scarab destroyed animation.
- 2025-04-16: Fixed enemy spawning (set `runChildUpdate: false`, simplified constructor). Enemies now appear and move.
- 2025-04-16: Fixed player movement (used acceleration, added drag/maxVelocity). Movement works alongside mouse aiming.
- 2025-04-15: Mouse-aimed shooting implemented. Bullets now fire toward mouse cursor. Bullets destroy enemies; enemies damage player. **BUG INTRODUCED: Player movement broken.**
- 2025-04-15: Enemy (Scarab) spawning from edges, chases player. Bullets and enemies interact.
- 2025-04-15: Map rendering and player movement implemented, player idle animation added (spritesheet).
- 2025-04-15: Project initialized, PRD created.

---

## Known Issues / Blockers

*   Slow Scene Transition: Delay (2-3s blue screen) when loading Game scene from Main Menu. (Investigation needed)
*   Minor visual discrepancies in player sprite frames. (Low priority)
*   High score list formatting edge cases (long initials/scores). (Low priority)

---

## Next Steps / Priorities

*(Based on recent decision)*

1.  **Add New Enemy Types:** Design and implement additional enemies with distinct behaviors and appearances.
2.  **Add New Power-ups:** Introduce new power-ups (e.g., shield, temporary invincibility, etc).
3.  **Ongoing Polish & Balance:** Refine gameplay balance, visuals, and audio as new features are added.
4.  **Documentation Updates:** Keep documentation (especially `progress.md`, `development-guide.md`, `prd.md`, `asset-desc.md`) updated alongside feature development.

---

> Update this document after each major change or when a new blocker/issue arises. This will help keep development organized and transparent.
