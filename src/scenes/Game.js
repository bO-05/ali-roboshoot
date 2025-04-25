import { Scene } from 'phaser';
import { ScarabEnemy } from './ScarabEnemy';
import { HornetEnemy } from './HornetEnemy';
import { SpiderEnemy } from './SpiderEnemy';
import { OrangeRobotEnemy } from './OrangeRobotEnemy'; 
import { Pickup } from '../entities/Pickup'; 
import pickupsConfig from '../config/pickupsConfig'; 
import { ObjectiveFlag } from '../entities/ObjectiveFlag'; 
// import { Grenade } from '../entities/Grenade'; 

// Constants for UI
const HEALTH_BAR_FRAME_WIDTH = 48;
const HEALTH_BAR_FRAME_HEIGHT = 16;

// --- Constants for Fixed World & Difficulty ---
const FIXED_WORLD_SIZE = 8400; // New large fixed size (1200 * 7)
const INITIAL_MAX_ENEMIES = 10;
const MAX_ENEMIES_CAP = 50; // Absolute maximum number of enemies
const INITIAL_SPAWN_INTERVAL = 2000; // Initial spawn check interval (ms)
const MIN_SPAWN_INTERVAL = 500; // Minimum spawn interval (ms)
const SPAWN_BUFFER = 100; // Keep enemies this far from camera edge when spawning
// Add new constants for time-based difficulty scaling
const DIFFICULTY_INTERVAL = 35000; // Increase difficulty every 35 seconds
const MAX_ENEMIES_INCREMENT = 2; // Increase max enemies by this much
const SPAWN_INTERVAL_DECREMENT = 50; // Decrease interval by this much (ms)

// --- ADDED Objective Constants ---
const MAX_FLAGS = 1; // Only 1 flag active at a time
const FLAG_CAPTURE_SCORE = 200;
// --- END Objective Constants ---

export class Game extends Scene
{
    constructor ()
    {
        super('Game');

        // --- Initialize Pause UI Element Properties ---
        this.pauseOverlay = null;
        this.pauseText = null;
        this.pauseControlsText = null;
        this.pauseMuteHint = null;
        this.mainMenuButtonText = null;
        this.keyQ = null;

        // --- World State Properties ---
        this.background = null; // To store the TileSprite
        this.currentWorldWidth = FIXED_WORLD_SIZE;
        this.currentWorldHeight = FIXED_WORLD_SIZE;
        this.maxEnemies = INITIAL_MAX_ENEMIES;
        this.enemySpawnInterval = INITIAL_SPAWN_INTERVAL;
        this.difficultyTimer = null; // Timer for increasing difficulty

        // --- ADDED Objective Properties ---
        this.objectiveFlagsGroup = null;
        this.flagDirectionArrow = null; // Use new sprite-based arrow
        this.orangeRobotsGroup = null; // +++ ORANGE ROBOT GROUP
        // --- END Objective Properties ---
        
        // --- Add transition flag to prevent multiple transitions
        this.isTransitioning = false;
    }

    preload () // Ensure preload exists if not already present
    {
        // Load new UI assets
        this.load.spritesheet('health_bar', 'assets/UI/health-bars.png', {
            frameWidth: HEALTH_BAR_FRAME_WIDTH,
            frameHeight: HEALTH_BAR_FRAME_HEIGHT
        });

        // Only load if not already loaded
        if (!this.textures.exists('hit_spatters')) {
            this.load.spritesheet('hit_spatters', 'assets/Effects/hit-spatters.png', {
                frameWidth: 8,
                frameHeight: 8,
                startFrame: 0,
                endFrame: 5
            });
        }
    }

    create ()
    {
        // --- Add Focus/Blur Logging ---
        // console.log('[DEBUG FOCUS] Initial pauseOnBlur value:', this.sound.pauseOnBlur);
        // WORKAROUND: Explicitly set pauseOnBlur to false here
        this.sound.pauseOnBlur = false;
        // console.log('[DEBUG FOCUS] Explicitly set pauseOnBlur value:', this.sound.pauseOnBlur);

        this.game.events.on('blur', () => {
            // console.log('[DEBUG FOCUS] Game window BLUR event.');
            const bgmInstance = this.sound.get('bgm');
            if (bgmInstance) {
                // console.log('[DEBUG FOCUS] BGM state on blur: isPlaying=', bgmInstance.isPlaying, 'isPaused=', bgmInstance.isPaused);
            }
        });
        this.game.events.on('focus', () => {
            // console.log('[DEBUG FOCUS] Game window FOCUS event.');
            const bgmInstance = this.sound.get('bgm');
             if (bgmInstance) {
                 // console.log('[DEBUG FOCUS] BGM state on focus: isPlaying=', bgmInstance.isPlaying, 'isPaused=', bgmInstance.isPaused);
             }
        });
        // --- End Focus/Blur Logging ---

        // --- Start Background Music --- (REMOVED - Now started in MainMenu)
        /*
        // Ensure the sound is added first, but don't play immediately
        if (this.sound.get('bgm') && !this.backgroundMusic) { // Only add once
             this.backgroundMusic = this.sound.add('bgm', { loop: true, volume: 0.4 });
             console.log("[DEBUG BGM] Background music sound object added.");
        }

        // Check if context is already unlocked (e.g., returning to scene)
        if (this.sound.context.state === 'running' && this.backgroundMusic && !this.backgroundMusic.isPlaying) {
            this.backgroundMusic.play();
            console.log("[DEBUG] Audio context running, playing BGM.");
        } else if (this.backgroundMusic) {
            // If context is not running, wait for the 'unlocked' event
            console.log("[DEBUG BGM] Audio context not running. Setting up 'unlocked' listener.");
            this.sound.once('unlocked', () => {
                console.log("[DEBUG BGM] 'unlocked' event fired!");
                console.log("[DEBUG BGM] Inside unlocked: this.backgroundMusic is", this.backgroundMusic);
                if (this.backgroundMusic && !this.backgroundMusic.isPlaying) { // Check again in case scene changed fast
                    console.log("[DEBUG BGM] Inside unlocked: Attempting to play backgroundMusic.");
                    this.backgroundMusic.play();
                    console.log("[DEBUG BGM] Inside unlocked: play() called. Is playing:", this.backgroundMusic.isPlaying);
                }
            });
        }
        */

        // 1. Basic Scene Setup (Background, Camera)
        // this.cameras.main.setBackgroundColor(0x222222); // Remove background color
        // Add tiling background sprite - STORE it in this.background
        // Use initial world size, not game config size
        this.background = this.add.tileSprite(0, 0, FIXED_WORLD_SIZE, FIXED_WORLD_SIZE, 'game_background').setOrigin(0.5, 0.5).setDepth(-1); // Centered origin for easier resizing

        // Set initial world bounds explicitly using FIXED_WORLD_SIZE
        this.physics.world.setBounds(
            -FIXED_WORLD_SIZE / 2,
            -FIXED_WORLD_SIZE / 2,
            FIXED_WORLD_SIZE,
            FIXED_WORLD_SIZE
        );
        // console.log(`[DEBUG World] Fixed Bounds Set: x:${this.physics.world.bounds.x}, y:${this.physics.world.bounds.y}, w:${this.physics.world.bounds.width}, h:${this.physics.world.bounds.height}`);

        // Camera setup - make it follow player and constrain to world bounds using FIXED_WORLD_SIZE
        this.cameras.main.setBounds(
            -FIXED_WORLD_SIZE / 2,
            -FIXED_WORLD_SIZE / 2,
            FIXED_WORLD_SIZE,
            FIXED_WORLD_SIZE
        );

        // 2. Tilemap Setup (REMOVED - Using TileSprite background)
        /*
        const TILE_WIDTH = 16;
        const TILE_HEIGHT = 16;
        const MAP_WIDTH_TILES = 64; // 1024 / 16
        const MAP_HEIGHT_TILES = 48; // 768 / 16
        const mapData = Array.from({ length: MAP_HEIGHT_TILES }, () => Array(MAP_WIDTH_TILES).fill(0));
        const map = this.make.tilemap({ data: mapData, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT });
        const tiles = map.addTilesetImage('tiles');
        const layer = map.createLayer(0, tiles, 0, 0);
        layer.setDepth(0); // Explicitly set map layer depth
        */

        // 3. Player Setup
        this.player = this.physics.add.sprite(0, 0, 'player_car_core', 2); // Start at world center (0,0)
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10); // Ensure player renders above default depth (0)
        this.player.health = 500; // Set initial health to 500
        this.player.maxHealth = 500; // Define max health for percentage calculation
        this.player.setScale(1.5); // Increase player scale
        this.player.body.setSize(45, 45, true); // Adjust physics body size

        // --- MAKE CAMERA FOLLOW PLAYER ---
        this.cameras.main.startFollow(this.player);

        this.player.setDrag(150);
        this.player.setMaxVelocity(250);
        
        // Player invulnerability state for collisions
        this.player.invulnerable = false;
        // ADDED Player Buffs Tracking
        this.player.activeBuffs = {};
        this.player.buffTimers = {}; // To store Phaser timer events for buffs
        // ADDED Player Ammo
        this.player.ammo = 200; // UPDATED starting ammo to 200
        // ADDED Player RPG Ammo
        this.player.rpgAmmo = 10;
        // ADDED RPG Icon placeholder
        this.rpgIcon = null;
        // ADDED RPG Text placeholder
        this.rpgText = null;
        // ADDED RPG Cooldown
        this.lastRpgLaunched = 0;
        this.rpgCooldown = 1500; // ms (1.5 seconds)

        // Score state
        this.score = 0;
        // REMOVED Ammo Display Group
        // this.ammoDigits = this.add.group();
        // ADDED Ammo Text placeholder
        this.ammoText = null;
        // ADDED Ammo Icon placeholder
        this.ammoIcon = null;
        // Pause state
        this.isPaused = false;

        // REMOVED Score Display Group
        // this.scoreDigits = this.add.group();
        // ADDED Score Text placeholder
        this.scoreText = null;
        // ADDED Score Icon placeholder
        this.scoreIcon = null;
        // ADDED RPG Icon placeholder
        this.rpgIcon = null;
        // ADDED RPG Text placeholder
        this.rpgText = null;
        // ADDED Grenade UI placeholders
        this.grenadeIcon = null;
        this.grenadeText = null;
        // ADDED Grenade Cooldown
        this.lastGrenadeLaunched = 0;
        this.grenadeCooldown = 1000; // ms (1 second)

        // 4. Bullet Setup
        this.lastFired = 0;
        this.bulletCooldown = 150; // ms
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 30
        });
        // Enemy Bullet Group
        this.enemyBullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 100 // Allow more enemy bullets with more enemy types
        });

        // 5. Enemy Setup
        this.enemies = this.physics.add.group({
            // No specific classType here, group will hold mixed types
            runChildUpdate: true, // Enemies now handle their own update logic
            maxSize: MAX_ENEMIES_CAP
        });

        // +++ ADDED Orange Robot Group
        this.orangeRobotsGroup = this.physics.add.group({
            classType: OrangeRobotEnemy,
            runChildUpdate: true, // Orange Robots handle their own update
            maxSize: MAX_FLAGS // Max 1 Orange Robot per flag
        });

        // --- ADDED RPG Group ---
        this.rpgsGroup = this.physics.add.group({
            defaultKey: 'rpg_projectile',
            maxSize: 10 // RPGs are more limited
        });
        // --- End RPG Group ---

        // --- ADDED Pickup Group ---
        this.pickupsGroup = this.physics.add.group({
             classType: Pickup,
             runChildUpdate: false // Pickups don't need individual updates
        });
        // --- End Pickup Group ---

        // --- ADDED Objective Flag Group ---
        this.objectiveFlagsGroup = this.physics.add.group({
            classType: ObjectiveFlag,
            maxSize: MAX_FLAGS,
            runChildUpdate: false // Flags don't need individual updates
        });
        // --- END Objective Flag Group ---

        // Modify enemy spawn timer to use variable interval and add initial delay
        this.enemySpawnTimer = this.time.addEvent({
            delay: this.enemySpawnInterval,
            callback: this.trySpawnEnemy, // Rename callback for clarity
            callbackScope: this,
            loop: true
        });

        // --- ADDED Difficulty Increase Timer ---
        this.difficultyTimer = this.time.addEvent({
            delay: DIFFICULTY_INTERVAL,
            callback: this.increaseDifficulty, // New function for difficulty scaling
            callbackScope: this,
            loop: true
        });

        // --- Player Damaged Event Listener ---
        this.events.on('player_damaged', (player) => {
            if (player) {
                // --- Play Player Hit Sound ---
                if (!this.registry.get('sfxMuted')) {
                    this.sound.play('explode', { volume: 0.1 }); // Play explode at significantly lower volume
                }

                // Ensure health doesn't go below zero
                player.health = Math.max(0, player.health);

                // Update graphical health bar
                this.updateHealthBar(player.health, player.maxHealth);

                // Update numerical health text
                this.updateHealthText();

                // --- Screen Shake on Damage ---
                this.cameras.main.shake(100, 0.01); // duration ms, intensity (0-1)
                // --- End Screen Shake ---

                // Make player flash briefly
                this.tweens.add({
                    targets: player,
                    alpha: 0.5,
                    duration: 100,
                    ease: 'Linear',
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        player.alpha = 1;
                        // Invulnerability timer is handled in ScarabEnemy now
                    }
                });
                
                // Check for game over
                if (player.health <= 0) { // Changed from < to <=
                    this.gameOver(); // Use new method instead of direct scene transition
                }
            }
        });

        // 6. Setup Physics Collisions/Overlaps
        // Player Bullet vs Enemy Collision
        this.physics.add.collider(this.bullets, this.enemies, (bullet, enemy) => {
            // Ensure bullet and enemy are valid and active before proceeding
            const enemyType = enemy?.constructor?.name || 'UnknownEnemy';
            // console.log(`[DEBUG Collision BvE] Collision detected: Bullet (${bullet?.texture?.key}) vs Enemy (${enemyType} at ${enemy?.x?.toFixed(0)},${enemy?.y?.toFixed(0)})`);

            if (!bullet || !bullet.active || !enemy || !enemy.active) {
                console.log(`[DEBUG Collision BvE] Invalid/Inactive object, ignoring. Bullet Active: ${bullet?.active}, Enemy Active: ${enemy?.active}`);
                // Destroy bullet anyway if it exists?
                if(bullet && bullet.active) { bullet.destroy(); }
                return;
            }

            // Destroy bullet
            // console.log(`[DEBUG Collision BvE] Destroying bullet.`);
            bullet.setActive(false).setVisible(false);
                bullet.destroy();

            // Damage enemy
            if (enemy.takeDamage) {
                console.log(`[DEBUG Collision BvE] Calling ${enemyType}.takeDamage(25)...`);
                 const stillAlive = enemy.takeDamage(25); // INCREASED DAMAGE from 1 to 25
                // console.log(`[DEBUG Collision BvE] ${enemyType}.takeDamage(25) returned: ${stillAlive}`); // INCREASED DAMAGE
                 if (!stillAlive) { 
                     // Enemy was destroyed by takeDamage - Use score value from enemy
                     const scoreToAdd = enemy.scoreValue || 10; // Use enemy specific score or default 10
                     console.log(`[DEBUG Collision BvE] ${enemyType} destroyed via takeDamage. Adding score: ${scoreToAdd}`);
                     this.score += scoreToAdd;
                     this.updateScoreText();
                     // Trigger explosion effect
                     const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion_small').setScale(1.5);
                     explosion.play('explosion_small_anim');
                     explosion.once('animationcomplete', () => { explosion.destroy(); });
                     // --- ADDED Pickup Spawn Logic ---
                     this.trySpawnPickup(enemy.x, enemy.y);
                     // --- End Pickup Spawn Logic ---
                 }
            } else {
                 // Fallback: Destroy enemy directly if no takeDamage method
                 console.warn("[DEBUG Collision BvE] Enemy lacks takeDamage, destroying directly.");
                 const enemyX = enemy.x; // Store position before destroy
                 const enemyY = enemy.y;
                 enemy.setActive(false).setVisible(false);
                 enemy.destroy();
                // --- ADDED SCORE FOR FALLBACK KILL --- >
                const fallbackScore = enemy.scoreValue || 5; // Score even if destroyed directly
                this.score += fallbackScore;
                 this.updateScoreText();
                 // Trigger explosion effect
                 const explosion = this.add.sprite(enemyX, enemyY, 'explosion_small').setScale(1.5);
                 explosion.play('explosion_small_anim');
                 explosion.once('animationcomplete', () => { explosion.destroy(); });
                 // --- ADDED Pickup Spawn Logic ---
                 this.trySpawnPickup(enemyX, enemyY);
                 // --- End Pickup Spawn Logic ---
            }

        }, null, this);
        // Enemy Bullet vs Player Collision
        this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
            if (player.active && bullet.active) {
                const damage = bullet.damage || 10; // Use damage property from bullet or default (Scarab Ranged)
                console.log(`[DEBUG] Player Hit by Enemy Bullet! Damage: ${damage}`);
                bullet.clearTint(); // Clear tint before destroying
                bullet.destroy(); // Destroy bullet immediately

                if (!player.invulnerable) {
                    player.health -= damage;

                    // Ensure health doesn't go below zero
                    player.health = Math.max(0, player.health);

                    player.invulnerable = true;
                    this.events.emit('player_damaged', player); // Emit event for feedback/UI
                    this.time.delayedCall(1000, () => { if (player && player.active) player.invulnerable = false; }); // Invulnerability timer

                    // Check for game over immediately - FORCE IT
                    if (player.health <= 0) {
                        this.gameOver(true); // Force game over, bypass isTransitioning check
                    }
                }
            }
        });
        // Player vs Enemy Collision
        this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
             // Ensure player and enemy are valid before proceeding
             if (!player || !player.active || !enemy || !enemy.active) {
                 console.log("[DEBUG Collision PvE] Invalid/Inactive object, ignoring.");
                 return;
             }
             // Check if player is currently invulnerable
             if (player.invulnerable) {
                 return; // Do nothing if invulnerable
             }

             console.log(`[DEBUG Collision PvE] Player hit enemy (Type: ${enemy.constructor.name})`);
             // Damage player
             const collisionDamage = enemy.meleeDamage || 10; // Use enemy's melee damage or a default
             player.health -= collisionDamage;
             this.events.emit('player_damaged', player); // Emit event for UI updates/feedback

             // Make player invulnerable temporarily
                    player.invulnerable = true;
             this.time.delayedCall(1000, () => { // 1 second invulnerability
                // Check if player still exists before setting invulnerable back
                 if(player && player.active) {
                            player.invulnerable = false;
                        }
             }, [], this);

             // Enemy specific reaction or fallback destruction
             if (enemy.onPlayerContact) {
                 // Assume onPlayerContact handles potential destruction and returns if killed?
                 // If not, we might need to add pickup spawning within onPlayerContact or check enemy.active after
                 enemy.onPlayerContact(player);
                 // If onPlayerContact might destroy the enemy, check if it's still active
                 // If it's NOT active after the call, spawn pickup (difficult to track reliably here)
             } else {
                 // Simple knockback/destruction as fallback
                 console.warn("[DEBUG Collision PvE] Enemy lacks onPlayerContact, destroying directly.");
                 const enemyX = enemy.x; // Store position before destroy
                 const enemyY = enemy.y;
                 enemy.setActive(false).setVisible(false);
                 enemy.destroy();
                 this.score += 5; // Score for direct collision kill
                 this.updateScoreText();
                 // Optional explosion
                 const explosion = this.add.sprite(enemyX, enemyY, 'explosion_small').setScale(1.5);
                 explosion.play('explosion_small_anim');
                 explosion.once('animationcomplete', () => { explosion.destroy(); });
                 // --- ADDED Pickup Spawn Logic ---
                 this.trySpawnPickup(enemyX, enemyY);
                 // --- End Pickup Spawn Logic ---
             }

             // Check for game over immediately after taking damage
             if (player.health <= 0) {
                 this.gameOver();
             }

        }, null, this);

        // +++ ADDED Player vs Orange Robot Collision
        this.physics.add.collider(this.player, this.orangeRobotsGroup, this.handlePlayerHitOrangeRobot, null, this);

        // --- ADDED Player vs Pickup Overlap ---
        this.physics.add.overlap(this.player, this.pickupsGroup, this.handlePlayerPickup, null, this);
        // --- End Player vs Pickup Overlap ---

        // --- ADDED Player vs Objective Flag Overlap ---
        this.physics.add.overlap(this.player, this.objectiveFlagsGroup, this.handlePlayerCaptureFlag, null, this);
        // --- END Player vs Objective Flag Overlap ---

        // --- ADDED Player Bullet vs Orange Robot Collider ---
        this.physics.add.collider(this.bullets, this.orangeRobotsGroup, this.handleBulletHitOrangeRobot, null, this);
        // --- END Bullet vs Orange Robot ---

        // --- ADDED RPG vs Enemy Collision ---
        this.physics.add.collider(this.rpgsGroup, this.enemies, this.handleRpgHitEnemy, null, this);
        // +++ ADD RPG vs ORANGE ROBOT Collision
        this.physics.add.collider(this.rpgsGroup, this.orangeRobotsGroup, this.handleRpgHitEnemy, null, this); // Reuse same handler
        // Handle RPG hitting world bounds (destroy it)
        this.physics.world.on('worldbounds', (body) => {
            // Check if the body colliding with the bounds belongs to an RPG
            if (this.rpgsGroup.contains(body.gameObject)) {
                // console.log("[DEBUG RPG] RPG hit world bounds, destroying.");
                body.gameObject.destroy();
            }
        });
        // --- End RPG vs Enemy Collision ---

        // 7. Input Setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        // Shooting input
        this.input.keyboard.on('keydown-SPACE', this.shoot, this);
        // RPG input
        this.input.keyboard.on('keydown-R', this.launchRpg, this);

        // Pause input
        this.input.keyboard.on('keydown-P', this.togglePause, this);
        // Add ESC key for pause toggle too
        this.input.keyboard.on('keydown-ESC', this.togglePause, this);

        // Prevent Browser Context Menu on Right Click
        this.input.mouse.disableContextMenu();

        // 8. UI Setup
        // Create Graphical Health Bar
        this.healthBar = this.add.sprite(10, 10, 'health_bar', 0).setOrigin(0, 0).setScrollFactor(0); // Frame 0 = Green
        this.updateHealthBar(this.player.health, this.player.maxHealth); // Set initial frame

        // Create Graphical Score Display (using a group for digits)
        this.createScoreDisplay(); // Now creates text + icon

        // Control hint text - Update to include Pause instruction with ESC
        this.add.text(20, 40, 'Move: WASD/Arrows | Shoot: Left Mouse Click | RPG: R | Pause: P/ESC' , {
            fontFamily: 'Arial', fontSize: 16, color: '#dddddd',
            stroke: '#000000', strokeThickness: 3
        }).setScrollFactor(0); // Ensure it stays fixed

        console.log('Game Scene Created Successfully');

        // --- Initialize Pause UI elements (create them hidden) ---
        this.createPauseUI();

        // Add keyboard listener for Q (Return to Menu from Pause)
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

        // --- Display Initial Score ---
        this.updateScoreText(); // Call this to show initial 0 score

        // --- Display Initial Health ---
        this.updateHealthBar(this.player.health, this.player.maxHealth);

        // --- Create and Display Initial Numerical Health Text ---
        const healthBarY = 10; // Y position of the health bar
        const healthBarHeight = 16; // Height of the health bar sprite
        const healthTextX = 10 + HEALTH_BAR_FRAME_WIDTH + 4; // Position next to health bar + padding
        const healthTextY = healthBarY + (healthBarHeight / 2); // Vertically center with health bar

        this.healthText = this.add.text(healthTextX, healthTextY, '', { // UPDATED position & style
            fontFamily: 'Arial Black', fontSize: 20, color: '#FFFFFF', // Match Score/Ammo style (White)
            stroke: '#000000', strokeThickness: 4
        })
        .setOrigin(0, 0.5) // Set origin for vertical centering
        .setScrollFactor(0);
        this.updateHealthText(); // Set initial text value

        // --- Create Text Displays ---
        this.createAmmoDisplay();  // Now creates text + icon
        this.createRpgDisplay(); // ADDED

        // --- Set Initial Text Values ---
        this.updateScoreText(); // New function
        this.updateAmmoText(); // New function
        this.updateRpgText(); // ADDED

        // --- ADDED Flag Direction Arrow (Spritesheet) ---
        // --- TEXTURE CHECK --- >
        if (!this.textures.exists('dotted_arrows')) {
            console.error('[DEBUG Game Create] Texture key \'dotted_arrows\' does NOT exist!');
        } else {
            // console.log('[DEBUG Game Create] Texture key \'dotted_arrows\' exists.');
        }
        // --- END TEXTURE CHECK --- <

        const arrowPadding = 25; // Distance from corner
        const arrowScale = 2.0; // Make arrow bigger
        this.flagDirectionArrow = this.add.sprite(
            this.sys.game.config.width - arrowPadding,
            this.sys.game.config.height - arrowPadding,
            'dotted_arrows',
            'objective-dot' // Start with the dot frame name
        )
        .setOrigin(0.5, 0.5) // Center origin for easier positioning
        .setScrollFactor(0) // Keep fixed on screen
        .setScale(arrowScale)
        .setDepth(100) // Above most UI
        .setVisible(true); // Always visible (shows dot when no flag or flag on screen)
        // --- END Flag Direction Arrow ---

        // Only shoot on left click
        this.input.on('pointerdown', pointer => {
            if (pointer.leftButtonDown()) {
                this.shoot(pointer);
            }
        }, this);

        // --- Spawn the initial objective flag --- >
        this.trySpawnObjectiveFlag();
    }

    // Helper function to create Pause UI elements
    createPauseUI() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const depth = 100; // Common depth for pause UI

        this.pauseOverlay = this.add.rectangle(centerX, centerY, this.sys.game.config.width, this.sys.game.config.height, 0x000000, 0.7)
            .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(depth).setVisible(false);

        // 1) PAUSED title
        this.pauseText = this.add.text(centerX, centerY - 220, 'PAUSED', {
            fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(depth + 1).setVisible(false).setScrollFactor(0);

        // 2) Controls text
        this.pauseControlsText = this.add.text(centerX, centerY - 160, 'Controls: WASD/Arrows = Move | Left Click = Shoot | R = RPG | P/ESC = Pause', {
            fontFamily: 'Arial', fontSize: 16, color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(depth + 1).setVisible(false).setScrollFactor(0);

        // 3) Game Objectives
        this.objectiveText = this.add.text(centerX, centerY - 120, 'OBJECTIVES:', {
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffff00',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(depth + 1).setVisible(false).setScrollFactor(0);

        this.objectiveDetailText = this.add.text(centerX, centerY - 80, 
            '• Capture Flags: +150 points each\n• Destroy Robots: +100 points each\n• Survive as long as possible\n• Get the highest score to top the leaderboard!', {
            fontFamily: 'Arial', fontSize: 20, color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
            align: 'left'
        }).setOrigin(0.5, 0).setDepth(depth + 1).setVisible(false).setScrollFactor(0);

        // 4) Pickups Information
        this.pickupsText = this.add.text(centerX, centerY + 50, 'PICKUPS:', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffff00',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(depth + 1).setVisible(false).setScrollFactor(0);

        this.pickupsDetailText = this.add.text(centerX, centerY + 80, 
            '• Repair Heart: Restores 50 health points\n• Ammo Clip: Adds 35 bullets\n• RPG Pickup: Adds 2 powerful rocket launchers\n• Overdrive Bolt: Doubles fire rate for 8 seconds', {
            fontFamily: 'Arial', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
            align: 'left'
        }).setOrigin(0.5, 0).setDepth(depth + 1).setVisible(false).setScrollFactor(0);

        // 5) Music/SFX toggle hint
        this.pauseMuteHint = this.add.text(centerX, centerY + 200, '(Music/SFX can be toggled on the Main Menu with M/F keys)', {
            fontFamily: 'Arial', fontSize: 14, color: '#dddddd',
            stroke: '#000000', strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(depth + 1).setVisible(false).setScrollFactor(0);

        // 6) Warning text
        this.pauseWarningText = this.add.text(centerX, centerY + 220, 'WARNING: Returning to main menu will reset your progress!', {
            fontFamily: 'Arial', fontSize: 16, color: '#ff9999',
            stroke: '#000000', strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(depth + 1).setVisible(false).setScrollFactor(0);

        // 7) Return to main menu button
        this.mainMenuButtonText = this.add.text(centerX, centerY + 270, 'Return to Main Menu (Q)', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffff00',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(depth + 1).setVisible(false).setScrollFactor(0);

        console.log("Pause UI elements created (initially hidden).");
    }

    update (time, delta) {
        // --- Check for Return to Menu key (Q) FIRST, ONLY when paused ---
        if (this.isPaused && this.keyQ && Phaser.Input.Keyboard.JustDown(this.keyQ)) {
            console.log("Pause screen: Returning to Main Menu via Q key (from update loop)... Attempting to save score.");

            // Reset transition flag in case it got stuck
            this.isTransitioning = false;
            console.log("[Q Key] Reset transition flag to false to force transition");

            // --- ADD SCORE SUBMISSION LOGIC --- >
            const apiUrl = this.registry.get('apiUrl'); // Get API URL from registry if set, or define globally
            const initials = this.registry.get('playerInitials') || 'AAA';
            const currentScore = this.score;

            // Better logging to understand condition failure
            console.log(`[Quit Submit] Score check - apiUrl: ${apiUrl ? 'present' : 'missing'}, score: ${currentScore}`);

            // Always try to submit if score > 0, even if apiUrl is undefined (will just log error then)
            if (currentScore > 0) {
                // Use the same API URL as in GameOver.js for consistency
                const submitUrl = apiUrl || 'https://highscore-api-ali-bot-service-iwcbnbmnlw.ap-southeast-1.fcapp.run/scores'; // Use correct Alibaba Cloud API URL
                console.log(`[Quit Submit] Submitting score: ${currentScore}, Initials: ${initials} to ${submitUrl}`);
                
                // Attempt to submit score
                try {
                    fetch(submitUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: currentScore, initials: initials })
                    })
                    .then(response => {
                        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
                        return response.json();
                    })
                    .then(data => console.log('[Quit Submit] Score submitted successfully:', data))
                    .catch(error => console.error('[Quit Submit] Error submitting score:', error))
                    .finally(() => {
                        // Always proceed to main menu
                        this.proceedToMainMenu(true); // Pass true to force transition
                    });
                } catch (error) {
                    console.error('[Quit Submit] Exception during fetch:', error);
                    this.proceedToMainMenu(true); // Still proceed if fetch fails completely
                }
            } else {
                console.log("[Quit Submit] Skipping score submission (score is 0).");
                // Proceed immediately if not submitting score
                this.proceedToMainMenu(true); // Pass true to force transition
            }
            // --- END SCORE SUBMISSION LOGIC --- <

            // NOTE: Scene transition is now called from proceedToMainMenu() after potential fetch
            return; // Exit update early
        }

        // --- PAUSE CHECK --- >
        if (this.isPaused) {
            return; // Skip update loop if paused
        }
        // --- END PAUSE CHECK ---

        if (!this.player) return;
        const speed = 300; // Use as acceleration factor

        let moveLeft = this.cursors.left.isDown || this.wasd.left.isDown;
        let moveRight = this.cursors.right.isDown || this.wasd.right.isDown;
        let moveUp = this.cursors.up.isDown || this.wasd.up.isDown;
        let moveDown = this.cursors.down.isDown || this.wasd.down.isDown;

        // --- DEBUG LOG KEY STATES ---
        if (moveDown && !moveUp && !moveLeft && !moveRight) { // Log only when pressing JUST down
            // console.log(`[DEBUG] Keys When Pressing DOWN: Down=${moveDown}, Up=${moveUp}, Left=${moveLeft}, Right=${moveRight}`);
        }
        // --- END DEBUG ---

        let newTextureKey = this.player.texture.key;
        let newFrameIndex = this.player.frame.name;

        // Determine target texture key and frame index based on direction
        if (moveUp && moveLeft)       { newTextureKey = 'player_car_diag1'; newFrameIndex = 0; } // NW
        else if (moveUp && moveRight)  { newTextureKey = 'player_car_diag1'; newFrameIndex = 1; } // NE
        else if (moveDown && moveLeft) { newTextureKey = 'player_car_diag1'; newFrameIndex = 3; } // SW
        else if (moveDown && moveRight){ newTextureKey = 'player_car_diag2'; newFrameIndex = 0; } // SE (Use red-cars-2 frame 0)
        else if (moveUp)               { newTextureKey = 'player_car_core';  newFrameIndex = 2; } // N
        else if (moveDown)             { newTextureKey = 'player_car_core';  newFrameIndex = 3; } // S
        else if (moveLeft)             { newTextureKey = 'player_car_core';  newFrameIndex = 0; } // W
        else if (moveRight)            { newTextureKey = 'player_car_core';  newFrameIndex = 1; } // E

        // Update texture and/or frame only if moving and if it changed
        const isMoving = moveLeft || moveRight || moveUp || moveDown;
        if (isMoving && (this.player.texture.key !== newTextureKey || this.player.frame.name !== newFrameIndex)) {
            this.player.setTexture(newTextureKey, newFrameIndex);
        }

        // Set acceleration (separate from frame logic)
        this.player.setAcceleration(0);
        if (moveLeft) {
            this.player.setAccelerationX(-speed);
        } else if (moveRight) {
            this.player.setAccelerationX(speed);
        }
        if (moveUp) {
            this.player.setAccelerationY(-speed);
        } else if (moveDown) {
            this.player.setAccelerationY(speed);
        }

        // Destroy bullets out of bounds
        this.bullets.children.iterate(bullet => {
            if (!bullet) return;
            const bounds = this.physics.world.bounds; // Get current world bounds
            if (
                bullet.x < bounds.x || bullet.x > bounds.right ||
                bullet.y < bounds.y || bullet.y > bounds.bottom
            ) {
                bullet.clearTint(); // Clear tint before destroying/recycling
                bullet.destroy();
            }
        });
        // Destroy ENEMY bullets out of bounds
        this.enemyBullets.children.iterate(bullet => {
            if (!bullet) return;
            const bounds = this.physics.world.bounds; // Get current world bounds
            if (
                bullet.x < bounds.x || bullet.x > bounds.right ||
                bullet.y < bounds.y || bullet.y > bounds.bottom
            ) {
                bullet.clearTint(); // Clear tint before destroying/recycling
                bullet.destroy();
            }
        });

        // Destroy RPGs out of bounds
        this.rpgsGroup.children.iterate(rpg => {
            if (!rpg) return;
            const bounds = this.physics.world.bounds;
            if (
                rpg.x < bounds.x || rpg.x > bounds.right ||
                rpg.y < bounds.y || rpg.y > bounds.bottom
            ) {
                rpg.destroy(); // Just destroy, no effects needed
            }
        });

        // Update and destroy offscreen enemies
        this.enemies.children.iterate(enemy => {
            // The group now runs child updates, so no manual call needed here
        });

        // --- Player Input Handling ---
        // Keyboard Movement & Aiming (Rotation/Sprite Update)
        // ... existing movement/rotation code ...

        // --- ADDED Update Flag Direction Arrow ---
        this.updateFlagDirectionArrow();
        // --- END Update Flag Direction Arrow ---

        // Shooting (Left Mouse Button)
        if (this.input.activePointer.isDown && this.input.activePointer.leftButtonDown())
        {
            this.shoot(this.input.activePointer);
        }

        // RPG Launch (Right Mouse Button) - ADDED
        // RPG Launch is now handled by 'R' key, pointer argument removed

        // --- End Game Logic Block ---
    }

    // --- New Function for Time-Based Difficulty Scaling ---
    increaseDifficulty() {
        // Increase max enemies
        this.maxEnemies = Math.min(this.maxEnemies + MAX_ENEMIES_INCREMENT, MAX_ENEMIES_CAP);

        // Decrease spawn interval
        this.enemySpawnInterval = Math.max(this.enemySpawnInterval - SPAWN_INTERVAL_DECREMENT, MIN_SPAWN_INTERVAL);

        // Update the enemy spawn timer's delay
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.delay = this.enemySpawnInterval;
        }

        // console.log(`[DEBUG Difficulty] Increased Difficulty - Max Enemies: ${this.maxEnemies}, Spawn Interval: ${this.enemySpawnInterval}ms`);
    }

    // --- Modified Function: Try Spawn Enemy ---
    trySpawnEnemy() {
        // Check if we can spawn more enemies
        if (this.enemies.countActive(true) < this.maxEnemies) {

           // --- Choose Enemy Type --- >
           const enemyTypes = [ScarabEnemy, HornetEnemy, SpiderEnemy];
           // Example weights: Scarab 50%, Hornet 30%, Spider 20%
           const weights = [0.5, 0.3, 0.2];
           let random = Math.random();
           let chosenType = ScarabEnemy; // Default
           let cumulativeWeight = 0;
           for (let i = 0; i < enemyTypes.length; i++) {
               cumulativeWeight += weights[i];
               if (random < cumulativeWeight) {
                   chosenType = enemyTypes[i];
                   break;
               }
           }
           // console.log(`[DEBUG Spawn] Chosen enemy type: ${chosenType.name}`);
           // --- End Choose Enemy Type --- <

            const spawnPoint = this.calculateOffScreenSpawnPoint();
            if (spawnPoint) {

                // --- Explicitly Create and Add Enemy --- >
                let enemy = null;
                try {
                    // Create instance using the chosen constructor
                    enemy = new chosenType(this, spawnPoint.x, spawnPoint.y);

                    if (enemy) { // Check if constructor succeeded
                        this.enemies.add(enemy, true); // Add to group and scene
                        // console.log(`[DEBUG Spawn] Created and Added ${enemy.constructor.name}`);

                        // NOW check if the body was initialized after adding to the group
                        if (!enemy.body) {
                            console.error(`[DEBUG Spawn] Physics body FAILED to initialize for ${enemy.constructor.name} after adding to group.`);
                            enemy.destroy(); // Clean up the failed sprite
                            enemy = null; // Prevent further processing
                        }
            } else {
                        console.error(`[DEBUG Spawn] Failed to create enemy instance for ${chosenType.name} (constructor returned null/undefined)`);
                        enemy = null; // Ensure enemy is null if creation/add failed
                    }
                } catch (error) {
                    console.error(`[DEBUG Spawn] Error during enemy creation/adding for ${chosenType.name}:`, error);
                    enemy = null; // Ensure enemy is null on error
                }
                // --- End Explicit Creation --- <

                if (enemy) { // Proceed only if enemy and its body were successfully created and added
                     // Call the specific enemy's spawn method
                     if (typeof enemy.spawn === 'function') {
                         enemy.spawn(spawnPoint.x, spawnPoint.y);
                     }

                     // Common setup after spawn
                     enemy.setCollideWorldBounds(true);
                     enemy.setScale(1.5);
                     // Adjust body size - assumes all base sprites are 16x16 (adjust if needed)
                     enemy.body.setSize(24, 24, true);
                     enemy.body.setOffset(4, 4); // Adjust offset after size change if needed

                     console.log(`[DEBUG Spawn] Finalized setup for ${enemy.constructor.name} at ${spawnPoint.x.toFixed(0)}, ${spawnPoint.y.toFixed(0)}`);
                }
            }
        }
    }

    // --- New Helper Function: Calculate Spawn Point (Ring Around Camera) ---
    calculateOffScreenSpawnPoint() {
        const worldBounds = this.physics.world.bounds;
        const cameraView = this.cameras.main.worldView;

        // Define the spawn ring relative to the camera center
        const camCenterX = cameraView.centerX;
        const camCenterY = cameraView.centerY;
        // Spawn just outside the camera view + buffer
        const spawnRingInnerRadius = Math.max(cameraView.width, cameraView.height) / 2 + SPAWN_BUFFER;
        // Spawn within a reasonable distance beyond the inner ring
        const spawnRingOuterRadius = spawnRingInnerRadius + 300; // Spawn within 300px of the outer edge of the buffer zone

        let spawnX, spawnY;
        let attempts = 0; // Prevent infinite loops
        const maxAttempts = 20;

        do {
            // Generate a random point within the spawn ring
            const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
            const radius = Phaser.Math.FloatBetween(spawnRingInnerRadius, spawnRingOuterRadius);
            spawnX = camCenterX + radius * Math.cos(angle);
            spawnY = camCenterY + radius * Math.sin(angle);

            attempts++;
            // Check if the calculated point is within the fixed world bounds
            if (spawnX >= worldBounds.x && spawnX <= worldBounds.right && spawnY >= worldBounds.y && spawnY <= worldBounds.bottom) {
                return { x: spawnX, y: spawnY }; // Valid spawn point found
            }
        } while (attempts < maxAttempts);

        // If not within bounds (unlikely with large world, but possible), try again
        return null; // Return null if no valid point found after several tries
    }

    togglePause() {
        console.log("'P' key pressed, togglePause() called!");
        this.isPaused = !this.isPaused;
        console.log("Pause state:", this.isPaused);

        // Toggle visibility of existing pause UI elements
        const isVisible = this.isPaused;
        this.pauseOverlay.setVisible(isVisible);
        this.pauseText.setVisible(isVisible);
        
        // Toggle visibility of new UI elements
        this.objectiveText.setVisible(isVisible);
        this.objectiveDetailText.setVisible(isVisible);
        this.pickupsText.setVisible(isVisible);
        this.pickupsDetailText.setVisible(isVisible);
        
        // Toggle visibility of existing UI elements
        this.pauseControlsText.setVisible(isVisible);
        this.pauseMuteHint.setVisible(isVisible);
        this.pauseWarningText.setVisible(isVisible); // Show/hide warning text
        this.mainMenuButtonText.setVisible(isVisible);

        if (this.isPaused) {
            this.physics.pause();
            if (this.enemySpawnTimer) {
                 this.enemySpawnTimer.paused = true;
            }
            this.enemies.getChildren().forEach(enemy => enemy.anims?.pause());

            // Pause music
            const bgmInstance = this.sound.get('bgm');
            if (bgmInstance && bgmInstance.isPlaying) {
                bgmInstance.pause();
                console.log("[DEBUG BGM] Background music paused.");
            }
        } else {
            this.physics.resume();
            if (this.enemySpawnTimer) {
                 this.enemySpawnTimer.paused = false;
            }
            this.enemies.getChildren().forEach(enemy => enemy.anims?.resume());

            // Resume music
            const bgmInstance = this.sound.get('bgm');
            if (bgmInstance && bgmInstance.isPaused) {
                bgmInstance.resume();
                console.log("[DEBUG BGM] Background music resumed on unpause.");
            }
        }
    }

    updateHealthBar(currentHealth, maxHealth) {
        if (!this.healthBar) return; // Safety check

        const healthPercent = currentHealth / maxHealth;
        let frameIndex = 0; // Default to green (full)

        if (healthPercent <= 0.33) {
            frameIndex = 2; // Red (low)
        } else if (healthPercent <= 0.66) {
            frameIndex = 1; // Orange (mid)
        }

        this.healthBar.setFrame(frameIndex);
    }

    updateScoreText() {
        if (this.scoreText) {
             // console.log(`[DEBUG Score UI] Updating Score Text to: ${this.score}`); // SCORE UI LOG
             this.scoreText.setText(String(this.score)); // Just set the score number
        } else {
            console.warn("[DEBUG Score UI] Cannot update score text, this.scoreText is null!");
        }
    }

    updateHealthText() {
        if (!this.healthText) return; // Safety check
        this.healthText.setText(`HP: ${this.player.health} / ${this.player.maxHealth}`);
    }

    updateAmmoText() {
        if (this.ammoText && this.player) {
            this.ammoText.setText(String(this.player.ammo));
        }
    }

    updateRpgText() {
        if (this.rpgText && this.player) {
            this.rpgText.setText(String(this.player.rpgAmmo));
        }
    }

    shutdown() {
        console.log("[DEBUG] Game Scene Shutting Down");
        // Clean up timers
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.remove(false);
            this.enemySpawnTimer = null;
        }
        if (this.difficultyTimer) {
            this.difficultyTimer.remove(false);
            this.difficultyTimer = null;
        }
        // --- ADDED Buff Timer Cleanup ---
        if (this.player && this.player.buffTimers) {
            console.log("[DEBUG Shutdown] Cleaning up buff timers...");
            for (const key in this.player.buffTimers) {
                if (this.player.buffTimers[key]) {
                    this.player.buffTimers[key].remove(false);
                    console.log(`[DEBUG Shutdown] Removed timer for buff: ${key}`);
                }
            }
            // Ensure object is cleared AFTER looping
            this.player.buffTimers = {};
        } else {
            console.log("[DEBUG Shutdown] No player or buffTimers object found for cleanup.");
        }
        // --- End Buff Timer Cleanup ---

        // --- Explicitly remove scene event listeners ---
        this.events.off('player_damaged'); // Remove our custom listener
        // Remove listeners added with this.game.events if any were added here
        // this.game.events.off('blur'); // Example if added in create
        this.game.events.off('focus'); // Example if added in create
        // --- End Listener Cleanup ---

        // --- Remove Keyboard Listeners ---
        this.input.keyboard.off('keydown-SPACE', this.shoot, this);
        this.input.keyboard.off('keydown-R', this.launchRpg, this);
        this.input.keyboard.off('keydown-P', this.togglePause, this);
        this.input.keyboard.off('keydown-ESC', this.togglePause, this);
        if (this.keyQ) {
            this.input.keyboard.removeKey(Phaser.Input.Keyboard.KeyCodes.Q);
            this.keyQ = null;
        }
        // Consider removing cursor/wasd keys if explicitly created objects store listeners?
        // If cursors = this.input.keyboard.createCursorKeys(); - likely okay.
        // If wasd = this.input.keyboard.addKeys(...); - might need removal if they hold internal listeners.
        // Let's assume standard keys are managed by Phaser for now.
        // --- End Keyboard Cleanup ---

        // ... existing sound cleanup ...
        // ... existing event listener cleanup ...

        this.isPaused = false;
        console.log("[DEBUG Shutdown] Game Scene shutdown complete.");
    }

    shoot(pointer) {
        // console.log(`[DEBUG Shoot] shoot() called. Paused: ${this.isPaused}, Time: ${this.time.now.toFixed(1)}`);
        if (this.isPaused) return; // Don't shoot if paused

        // --- ADDED Ammo Check ---
        if (this.player.ammo <= 0) {
            // console.log("[DEBUG Shoot] Out of ammo.");
            // Optionally play an 'empty click' sound
            // if (!this.registry.get('sfxMuted')) { this.sound.play('sfx_ammo_empty'); }
            return; // Can't shoot
        }
        // --- End Ammo Check ---

        const time = this.time.now;
        if (time - this.lastFired < this.bulletCooldown) {
            // console.log("[DEBUG Shoot] Cooldown active.");
            return;
        }
        this.lastFired = time;

        let angle;
        let source = 'unknown'; // For debugging
        if (pointer && pointer.worldX !== undefined && pointer.worldY !== undefined) {
            // Shoot toward mouse pointer
            angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
            source = 'pointer';
            // console.log(`[DEBUG Shoot] Source: ${source}, Pointer World Coords: (${pointer.worldX.toFixed(1)}, ${pointer.worldY.toFixed(1)}), Angle: ${angle.toFixed(2)}`);
        } else {
            // Fallback: use keyboard direction
            let vx = 0, vy = 0;
            if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
            if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
            if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
            if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
            if (vx !== 0 || vy !== 0) {
                angle = Math.atan2(vy, vx);
            } else {
                angle = -Math.PI / 2; // Default to up if no direction
            }
            source = 'keyboard/fallback';
            // console.log(`[DEBUG Shoot] Source: ${source}, Angle: ${angle.toFixed(2)}`);
        }
        const velocity = 400;
        const bullet = this.bullets.get(this.player.x, this.player.y, 'bullet', 2);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setFrame(2);
            bullet.setScale(1.5); // Increase player bullet scale
            // Adjust physics body size (Original 8x8 -> New 12x12)
            bullet.body.setSize(12, 12, true);
            this.physics.velocityFromRotation(angle, velocity, bullet.body.velocity);

            // Play gunshot sound
            if (!this.registry.get('sfxMuted')) {
                this.sound.play('gunshot');
            }

            // --- Rotate bullet towards target ---
            bullet.rotation = angle; // Set bullet rotation to match fire angle

            // --- ADDED Ammo Decrement ---
            this.player.ammo--;
            // console.log(`[DEBUG Shoot] Ammo left: ${this.player.ammo}`);
            // Update ammo UI
            this.updateAmmoText(); // ADDED Call to update UI
            // --- End Ammo Decrement ---
        }
    }

    // --- ADDED Pickup Handling Methods ---

    trySpawnPickup(x, y) {
        // Define drop rates (adjust as needed)
        const dropChance = 0.20; // Increased base drop chance slightly to 25%
        // Define chances *within* the drop pool:
        const heartChance = 0.35; // 35% chance for heart
        const ammoChance = 0.4;  // 40% chance for ammo
        const rpgChance = 0.15; // 15% chance for RPG pickup
        // Overdrive Bolt gets the remaining 10%

        if (Math.random() < dropChance) {
            let pickupKey = null;
            const typeRoll = Math.random();
            // console.log(`[DEBUG Pickup] Drop chance success. typeRoll: ${typeRoll.toFixed(3)}`); // Log the roll

            // Determine pickup type based on roll
            if (typeRoll < heartChance) {
                pickupKey = 'repair_heart';
            } else if (typeRoll < heartChance + ammoChance) {
                pickupKey = 'ammo_clip';
            } else if (typeRoll < heartChance + ammoChance + rpgChance) { // Check next range for RPGs
                pickupKey = 'rpg_pickup';
            } else {
                pickupKey = 'overdrive_bolt'; // The rest is overdrive
            }

            // console.log(`[DEBUG Pickup] Determined pickupKey: ${pickupKey}`); // Log the determined key

            // Spawn the selected pickup if valid
            if (pickupKey && pickupsConfig[pickupKey]) {
                // console.log(`[DEBUG Pickup] Config found for ${pickupKey}. Attempting spawn at (${x.toFixed(0)}, ${y.toFixed(0)})`, pickupsConfig[pickupKey]);

                let pickup = null; // Initialize pickup variable
                try {
                    pickup = new Pickup(this, x, y, pickupKey);
                    // console.log(`[DEBUG Pickup] new Pickup('${pickupKey}') returned:`, pickup); // Log the created object
                } catch (error) {
                    console.error(`[DEBUG Pickup] Error creating Pickup instance for key ${pickupKey}:`, error);
                    pickup = null; // Ensure pickup is null if constructor failed
                }

                // Double check pickup was created successfully before adding
                if (pickup && pickup.active) { // Check if pickup exists and is active
                    this.pickupsGroup.add(pickup);
                    // console.log(`[DEBUG Pickup] Successfully added ${pickupKey} instance to pickupsGroup.`);
                } else {
                    console.warn(`[DEBUG Pickup] Failed to add pickup instance for key: ${pickupKey}. Pickup was null, undefined, or inactive.`);
                }
            } else {
                console.warn(`[DEBUG Pickup] Invalid configuration or missing key in pickupsConfig for key: ${pickupKey}`);
            }
        } else {
            // Optional: Log when the base drop chance fails (can be spammy)
            // console.log(`[DEBUG Pickup] Base drop chance failed.`);
        }
    }

    handlePlayerPickup(player, pickup) {
        // Basic validation
        if (!player || !player.active || !pickup || !pickup.active || !pickup.body) {
             console.warn("[Pickup Collect] Invalid player or pickup state in handler.");
             return;
        }
        console.log(`[Pickup Collect] Player overlapped with pickup: ${pickup.pickupKey}`);
        const config = pickup.pickupData;

        // Play sound
        if (config.sfx && !this.registry.get('sfxMuted')) {
            this.sound.play(config.sfx, { volume: 0.6 });
        }

        // Apply effect
        switch (config.pickupType) {
            case 'resource':
                if (config.key === 'repair_heart') {
                    this.healPlayer(config.healAmount);
                }
                else if (config.key === 'ammo_clip') { // ADDED Ammo case
                     this.addAmmo(config.value); // Use value from config (15)
                }
                else if (config.key === 'rpg_pickup') { // CORRECTED RPG pickup case key
                     this.addRpgAmmo(config.value); // Use value from config (1)
                }
                break;
            case 'temp_buff':
                console.log(`[Pickup Collect] Temp Buff type '${config.key}' collected.`);
                if (config.key === 'overdrive_bolt') {
                    this.applyOverdrive(player, config.duration);
                }
                // Add else if for other temp buffs later
                break;
             case 'hazard':
                 console.log(`[Pickup Collect] Hazard type '${config.key}' collected - logic TBD.`);
                 // Call a function like this.applyHazard(player, config);
                 break;
            default:
                console.warn(`[Pickup Collect] Unknown pickup type: ${config.pickupType}`);
        }

        // Destroy the pickup sprite using its own method
        pickup.collect();
    }

    healPlayer(amount) {
        if (!this.player || !this.player.active || this.player.health <= 0) return; // Check player active state

        const prevHealth = this.player.health;
        this.player.health = Phaser.Math.Clamp(this.player.health + amount, 0, this.player.maxHealth);
        const healedAmount = this.player.health - prevHealth;

        if (healedAmount > 0) {
            console.log(`[Player Heal] Healed ${healedAmount} HP. Current HP: ${this.player.health}/${this.player.maxHealth}`);
            // Update UI only if health actually changed
            this.updateHealthBar(this.player.health, this.player.maxHealth);
            this.updateHealthText();
        } else {
            console.log(`[Player Heal] Player already at max health or invalid amount.`);
        }
    }

    // --- ADDED Method to add ammo ---
    addAmmo(amount) {
        if (!this.player || !this.player.active) return;

        this.player.ammo += amount;
        console.log(`[Player Ammo] Added ${amount} ammo. Current Ammo: ${this.player.ammo}`);

        // Update UI
        this.updateAmmoText(); // ADDED Call to update UI
    }
    // --- End Add Ammo Method ---

    // --- ADDED Method to add RPG ammo ---
    addRpgAmmo(amount) {
        if (!this.player || !this.player.active) return;

        this.player.rpgAmmo += amount;
        console.log(`[Player RPG] Added ${amount} RPG ammo. Current RPG Ammo: ${this.player.rpgAmmo}`);

        // Update UI
        this.updateRpgText();
    }
    // --- End Add RPG Ammo Method ---

    // --- ADDED Ammo Display Methods ---
    createAmmoDisplay() {
        // Add the static ammo icon sprite
        const iconScale = 1.5;
        const iconFrame = 0; // ammo-clip icon
        const iconOriginalHeight = 16; // Known height of the icon frame
        const iconScaledHeight = iconOriginalHeight * iconScale;
        const iconX = 10;
        // Position icon based on its scaled height and padding from bottom
        const iconY = this.sys.game.config.height - 10 - iconScaledHeight;
        this.ammoIcon = this.add.sprite(iconX, iconY, 'icon-set', iconFrame)
                            .setOrigin(0, 0) // Position from top-left
                            .setScale(iconScale)
                            .setScrollFactor(0); // Keep fixed on screen

        // Position text to the right of the icon
        const padding = 4;
        const textX = iconX + (this.ammoIcon.width * iconScale) + padding;
        const textY = iconY + (iconScaledHeight / 2); // Vertically center roughly with icon

        this.ammoText = this.add.text(textX, textY, '', { // Initial text set later
            fontFamily: 'Arial Black', fontSize: 20, color: '#FFFF00', // Yellow text for ammo
            stroke: '#000000', strokeThickness: 4
        })
        .setOrigin(0, 0.5) // Align text left, vertical center
        .setScrollFactor(0);

        // console.log(`[UI Ammo] Created ammo icon (frame ${iconFrame}) and text at (${iconX.toFixed(1)}, ${iconY.toFixed(1)})`);
    }

    // --- ADDED - Create Score Icon Method
    createScoreDisplay() {
        const iconScale = 1.5;
        const iconFrame = 18; 
        const iconWidth = 16 * iconScale;
        const iconX = this.sys.game.config.width - 10 - iconWidth;
        const iconY = 10;
        this.scoreIcon = this.add.sprite(iconX, iconY, 'icon-set', iconFrame)
                           .setOrigin(0, 0)
                           .setScale(iconScale)
                           .setScrollFactor(0);

        // Position text to the left of the icon
        const padding = 4;
        const textX = iconX - padding;
        const textY = iconY + (this.scoreIcon.height * iconScale / 2); // Vertically center roughly with icon

        this.scoreText = this.add.text(textX, textY, '', { // Initial text set later
            fontFamily: 'Arial Black', fontSize: 20, color: '#FFFFFF', // White text
            stroke: '#000000', strokeThickness: 4
        })
        .setOrigin(1, 0.5) // Align text right, vertical center
        .setScrollFactor(0);

        // console.log(`[UI Score] Created score icon (frame ${iconFrame}) and text.`);
    }

    // --- ADDED RPG Display Methods ---
    createRpgDisplay() {
        const iconScale = 1.5;
        const iconFrameIndex = 2; // Use the 3rd frame (index 2) of rpg_projectile sheet
        const iconOriginalHeight = 16;
        const iconScaledHeight = iconOriginalHeight * iconScale;

        // Position relative to ammo display (same as commented-out grenade display)
        const ammoIconX = 10;
        const ammoIconScaledWidth = 16 * iconScale; // Ammo icon uses frame 0 (16px wide)
        const spaceBetweenIcons = 50;
        const iconX = ammoIconX + ammoIconScaledWidth + spaceBetweenIcons;

        // Align vertically with ammo icon
        const iconY = this.sys.game.config.height - 10 - iconScaledHeight;

        this.rpgIcon = this.add.sprite(iconX, iconY, 'rpg_projectile', iconFrameIndex)
                             .setOrigin(0, 0)
                             .setScale(iconScale)
                             .setScrollFactor(0);

        // Position text to the right of the RPG icon
        const textPadding = 4;
        const textX = iconX + (this.rpgIcon.width * iconScale) + textPadding;
        const textY = iconY + (iconScaledHeight / 2); // Vertically center with icon

        this.rpgText = this.add.text(textX, textY, '', {
            fontFamily: 'Arial Black', fontSize: 20, color: '#FF0000', // Red text for RPGs
            stroke: '#000000', strokeThickness: 4
        })
        .setOrigin(0, 0.5) // Align text left, vertical center
        .setScrollFactor(0);

        // console.log(`[UI RPG] Created RPG icon (frame ${iconFrameIndex} from rpg_projectile) and text.`);
    }

    // --- ADDED Buff Handling Methods ---

    applyOverdrive(player, duration) {
        if (!player || !player.active) return;

        const buffKey = 'overdrive';
        console.log(`[Buff] Applying ${buffKey} for ${duration}s.`);

        // Store original cooldown if not already buffed
        if (!player.activeBuffs[buffKey]) {
            player.originalCooldown = this.bulletCooldown; // Store the scene's current cooldown
            // console.log(`[Buff ${buffKey}] Storing original cooldown: ${player.originalCooldown}`);
        }

        // Apply effect: Halve the cooldown (double fire rate)
        this.bulletCooldown = player.originalCooldown / 2;
        player.activeBuffs[buffKey] = true;
        // console.log(`[Buff ${buffKey}] Cooldown set to: ${this.bulletCooldown}`);

        // Clear existing timer for this buff, if any
        if (player.buffTimers[buffKey]) {
            // console.log(`[Buff ${buffKey}] Clearing existing timer.`);
            player.buffTimers[buffKey].remove();
        }

        // Set new timer to remove the buff
        player.buffTimers[buffKey] = this.time.delayedCall(
            duration * 1000,
            this.removeOverdrive, // Callback function
            [player], // Arguments to pass to the callback ([player] is the first arg)
            this // Context for the callback
        );
        // console.log(`[Buff ${buffKey}] Timer set for ${duration}s.`);

        // TODO: Add visual feedback (e.g., player tint, particle effect)
    }

    removeOverdrive(player) {
        if (!player || !player.active) return;

        const buffKey = 'overdrive';

        // Only remove if the buff is actually active
        if (player.activeBuffs[buffKey]) {
            console.log(`[Buff] Removing ${buffKey}.`);
            player.activeBuffs[buffKey] = false;

            // Restore original cooldown
            if (player.originalCooldown !== undefined) {
                this.bulletCooldown = player.originalCooldown;
                // console.log(`[Buff ${buffKey}] Restored cooldown to: ${this.bulletCooldown}`);
            } else {
                // Fallback if original wasn't stored (shouldn't happen ideally)
                console.warn(`[Buff ${buffKey}] Original cooldown not found! Resetting to default (200).`);
                this.bulletCooldown = 200; // Reset to default value from create()
            }

            // Clear the timer reference (though it just fired)
            player.buffTimers[buffKey] = null;

            // TODO: Remove visual feedback
        } else {
             console.log(`[Buff Remove ${buffKey}] Buff was not active, removal skipped.`);
        }
    }

    // --- End Buff Handling Methods ---

    // --- ADDED RPG Launch Method ---
    launchRpg() {
        // console.log(`[DEBUG RPG] launchRpg() called. Paused: ${this.isPaused}, Time: ${this.time.now.toFixed(1)}`);
        if (this.isPaused) return;

        // Check cooldown
        const time = this.time.now;
        if (time - this.lastRpgLaunched < this.rpgCooldown) {
            // console.log("[DEBUG RPG] Cooldown active.");
            return;
        }

        // Check if player has RPG ammo
        if (this.player.rpgAmmo <= 0) {
            // console.log("[DEBUG RPG] Out of RPG ammo.");
            // Optionally play an 'empty' sound
            return;
        }

        // Checks passed - Launch!
        this.lastRpgLaunched = time;
        this.player.rpgAmmo--;
        this.updateRpgText();
        // console.log(`[DEBUG RPG] Launched! RPG Ammo left: ${this.player.rpgAmmo}`);

        // Play launch sound (reuse gunshot for now, maybe slightly different pitch/volume later)
        if (!this.registry.get('sfxMuted')) {
            this.sound.play('gunshot', { volume: 0.6, detune: -200 }); // Lower pitch slightly
        }

        // --- Determine Angle (Same as shoot) ---
        let angle;
        // Use mouse pointer position if available, otherwise use keyboard direction
        const pointer = this.input.activePointer; // Get the active pointer for aiming
        if (pointer && pointer.worldX !== undefined && pointer.worldY !== undefined) {
            // Towards mouse pointer
            angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        } else {
            // Fallback: use keyboard direction (like bullet)
            let vx = 0, vy = 0;
            if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
            if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
            if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
            if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
            if (vx !== 0 || vy !== 0) {
                angle = Math.atan2(vy, vx);
            } else {
                angle = -Math.PI / 2; // Default to up
            }
        }

        // --- Get and Configure RPG Projectile ---
        const rpg = this.rpgsGroup.get(this.player.x, this.player.y, 'rpg_projectile');
        if (rpg) {
            rpg.setActive(true);
            rpg.setVisible(true);
            rpg.setScale(1.5); // Scale RPG slightly
            rpg.body.setSize(16*1.5, 16*1.5, true); // Adjust physics body
            rpg.setCollideWorldBounds(true); // Collide with world bounds
            rpg.body.onWorldBounds = true; // Event on world bounds collision

            // Play flying animation
            rpg.play('rpg_fly');

            // Set velocity
            const velocity = 300; // Slightly slower than bullets
            this.physics.velocityFromRotation(angle, velocity, rpg.body.velocity);

            // Rotate sprite
            rpg.rotation = angle;

            // Collider with enemies is set up in create()
        } else {
            console.error("[ERROR RPG] Failed to get RPG from group!");
            // Refund RPG ammo?
            this.player.rpgAmmo++;
            this.updateRpgText();
            this.lastRpgLaunched = 0;
        }
    }
    // --- End RPG Launch Method ---

    // --- ADDED RPG Hit Handler ---
    handleRpgHitEnemy(rpg, enemy) {
        if (!rpg || !rpg.active || !enemy || !enemy.active) {
            if (rpg && rpg.active) rpg.destroy();
            return;
        }

        const explosionX = rpg.x;
        const explosionY = rpg.y;

        // Check if this is an orange robot
        const isOrangeRobot = this.orangeRobotsGroup.contains(enemy);
        // Save position before destroying
        const enemyX = enemy.x;
        const enemyY = enemy.y;

        // Destroy the RPG projectile itself
        rpg.destroy();

        // --- Big Explosion Visual & Sound ---
        const bigExplosion = this.add.sprite(explosionX, explosionY, 'big_explosion').setScale(4);
        bigExplosion.play('big_explosion_anim');
        bigExplosion.once('animationcomplete', () => { bigExplosion.destroy(); });

        // Play sound
        if (!this.registry.get('sfxMuted')) {
            this.sound.play('explode', { volume: 0.4 });
        }

        // --- Area Damage ---
        const explosionRadius = 128;
        
        // Handle AoE damage to normal enemies
        this.enemies.getChildren().forEach(otherEnemy => {
            if (otherEnemy && otherEnemy.active && otherEnemy !== enemy) {
                const distance = Phaser.Math.Distance.Between(explosionX, explosionY, otherEnemy.x, otherEnemy.y);
                if (distance <= explosionRadius) {
                    if (otherEnemy.takeDamage) {
                        const stillAlive = otherEnemy.takeDamage(125);
                        if (!stillAlive) { 
                            const scoreToAdd = otherEnemy.scoreValue || 10;
                            this.score += scoreToAdd;
                            this.updateScoreText();
                             if (!this.registry.get('sfxMuted')) {
                                this.sound.play('explode', { volume: 0.15 });
                             }
                            this.trySpawnPickup(otherEnemy.x, otherEnemy.y);
                        }
                    } else {
                        const enemyX = otherEnemy.x;
                        const enemyY = otherEnemy.y;
                        otherEnemy.destroy();
                        const fallbackScore = otherEnemy.scoreValue || 5;
                        this.score += fallbackScore;
                        this.updateScoreText();
                        this.trySpawnPickup(enemyX, enemyY);
                    }
                }
            }
        });

        // Handle AoE damage to orange robots
        this.orangeRobotsGroup.getChildren().forEach(robot => {
            if (robot && robot.active && robot !== enemy) {
                const distance = Phaser.Math.Distance.Between(explosionX, explosionY, robot.x, robot.y);
                if (distance <= explosionRadius) {
                    if (robot.takeDamage) {
                        const stillAlive = robot.takeDamage(125);
                        if (!stillAlive) {
                            // Award score for killing orange robot
                            const scoreToAdd = robot.scoreValue || 50;
                            this.score += scoreToAdd;
                            this.updateScoreText();
                            
                            // Drop 2x ammo for orange robot killed by AoE
                            this.spawnAmmoPickup(robot.x, robot.y);
                            this.spawnAmmoPickup(
                                robot.x + Phaser.Math.Between(-20, 20), 
                                robot.y + Phaser.Math.Between(-20, 20)
                            );
                            console.log(`[Loot] Orange Robot dropped 2x ammo from RPG AoE damage`);
                        }
                    }
                }
            }
        });

        // Damage the primary target
        if (enemy.active) {
             if (enemy.takeDamage) {
                const stillAlive = enemy.takeDamage(125);
                if (!stillAlive) {
                    const scoreToAdd = enemy.scoreValue || 10;
                    this.score += scoreToAdd;
                    this.updateScoreText();
                    
                    // If this was an orange robot, drop 2x ammo
                    if (isOrangeRobot) {
                        this.spawnAmmoPickup(enemyX, enemyY);
                        this.spawnAmmoPickup(
                            enemyX + Phaser.Math.Between(-20, 20), 
                            enemyY + Phaser.Math.Between(-20, 20)
                        );
                        console.log(`[Loot] Orange Robot dropped 2x ammo from direct RPG hit`);
                    } else {
                        // Normal enemy, try normal pickup
                        this.trySpawnPickup(enemyX, enemyY);
                    }
                }
            } else {
                // No takeDamage method, destroy directly
                enemy.destroy();
                const fallbackScore = enemy.scoreValue || 5;
                this.score += fallbackScore;
                this.updateScoreText();
                
                // If this was an orange robot, drop 2x ammo
                if (isOrangeRobot) {
                    this.spawnAmmoPickup(enemyX, enemyY);
                    this.spawnAmmoPickup(
                        enemyX + Phaser.Math.Between(-20, 20), 
                        enemyY + Phaser.Math.Between(-20, 20)
                    );
                    console.log(`[Loot] Orange Robot dropped 2x ammo from direct RPG hit (fallback method)`);
                } else {
                    // Normal enemy, try normal pickup
                this.trySpawnPickup(enemyX, enemyY);
            }
        }
        }
    }
    // --- End RPG Hit Handler ---

    // --- ADDED Objective Flag Methods ---

    trySpawnObjectiveFlag() {
        // Only spawn if no flags currently exist
        // +++ AND no orange robots exist +++
        if (this.objectiveFlagsGroup.countActive(true) === 0 && this.orangeRobotsGroup.countActive(true) === 0) {
            const spawnPoint = this.calculateRandomWorldPoint();
            if (spawnPoint) {
                try {
                    // --- FLAG SPAWN FIX: Explicitly create and add --- >
                    const flag = new ObjectiveFlag(this, spawnPoint.x, spawnPoint.y);
                    this.objectiveFlagsGroup.add(flag); // Add to group ONLY initially

                    // Check if physics body was enabled by the constructor/add
                    if (!flag.body) {
                        console.error(`[DEBUG Flag Spawn] Physics body FAILED to initialize for ObjectiveFlag after adding to group.`);
                        flag.destroy(); // Clean up the failed sprite
                     } else {
                        // Activation is now handled in ObjectiveFlag constructor
                        // --- FLAG FIX: Explicitly add body to world --- >
                        this.physics.world.add(flag.body);

                        // Log state after creation and adding
                        console.log(`[DEBUG Flag Spawn] Created & Added flag instance: active=${flag.active}, visible=${flag.visible}, body=${!!flag.body} at ${spawnPoint.x.toFixed(0)}, ${spawnPoint.y.toFixed(0)}`); // FLAG LOG
                        console.log(`[Objective Spawn] Spawned flag at ${spawnPoint.x.toFixed(0)}, ${spawnPoint.y.toFixed(0)}`);
                        // Log active count immediately after adding and activating
                        // console.log(`[DEBUG Flag Spawn] Group active count immediately after add/activate: ${this.objectiveFlagsGroup.countActive(true)}`);
                     }

                     // +++ SPAWN ORANGE ROBOT GUARDIAN +++
                     const robotSpawnOffset = 80; // Spawn slightly away from flag
                     const robotSpawnAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                     const robotX = spawnPoint.x + Math.cos(robotSpawnAngle) * robotSpawnOffset;
                     const robotY = spawnPoint.y + Math.sin(robotSpawnAngle) * robotSpawnOffset;

                     try {
                         const orangeRobot = new OrangeRobotEnemy(this, robotX, robotY);
                         this.orangeRobotsGroup.add(orangeRobot);
                         orangeRobot.setTargetFlag(flag); // Link robot to flag
                         flag.setGuardian(orangeRobot); // Link flag to robot (optional link)
                         console.log(`[Objective Spawn] Spawned Orange Robot guardian for flag ${flag.name}.`);
                     } catch (robotError) {
                         console.error("[Objective Spawn] Error spawning Orange Robot guardian:", robotError);
                         // Should we destroy the flag if the guardian fails? Maybe.
                         flag.destroy(); // Clean up flag if guardian fails
                     }
                     // --- End Guardian Spawn ---
                 } catch (error) {
                     console.error(`[DEBUG Flag Spawn] Error creating/adding ObjectiveFlag:`, error);
                 }
            } else {
                console.warn("[Objective Spawn] Could not find suitable spawn point for flag.");
            }
        }
    }

    handlePlayerCaptureFlag(player, flag) {
        if (!player || !player.active || !flag || !flag.active || !flag.body) {
             console.warn("[Flag Capture] Invalid player or flag state in handler.");
             return;
        }

        // ++LOG Capture Check
        console.log(`[Flag Capture ${flag.name}] Checking isCapturable: ${flag.isCapturable}`); 

        // +++ CHECK IF FLAG IS CAPTURABLE +++
        if (!flag.isCapturable) {
            console.log("[Flag Capture] Flag not capturable (guardian likely alive). Bumped off.");
             return;
        }

        console.log(`[Flag Capture] Player captured flag!`);

        // Award score
        this.score += FLAG_CAPTURE_SCORE;
        this.updateScoreText();

        // Play capture sound
        if (!this.registry.get('sfxMuted')) {
            this.sound.play('sfx_capture_flag', { volume: 0.7 }); // Use the new sound key
        }

        // Call the flag's collect method to handle destruction & effects
        flag.collect();

        // Optional: Immediately try to spawn a replacement?
        this.time.delayedCall(100, this.trySpawnObjectiveFlag, [], this); // Respawn after short delay
    }

    // Helper to find a random point within world bounds (avoiding player vicinity could be added)
    calculateRandomWorldPoint() {
        const worldBounds = this.physics.world.bounds;
        // Define a margin from the edge
        const margin = 100; // Don't spawn too close to the edge
        const minX = worldBounds.x + margin;
        const maxX = worldBounds.right - margin;
        const minY = worldBounds.y + margin;
        const maxY = worldBounds.bottom - margin;

        if (maxX <= minX || maxY <= minY) {
            console.error("[Spawn Point] Invalid world bounds for random point calculation.");
            return null; // Cannot calculate a point
        }

        const randX = Phaser.Math.FloatBetween(minX, maxX);
        const randY = Phaser.Math.FloatBetween(minY, maxY);

        // Optional: Add check to ensure not too close to player
        // const minDistFromPlayer = 200;
        // if (this.player && Phaser.Math.Distance.Between(this.player.x, this.player.y, randX, randY) < minDistFromPlayer) {
        //     console.log("[Spawn Point] Calculated point too close to player, trying again (recursion or loop needed for robust solution).");
        //     // return this.calculateRandomWorldPoint(); // Be careful with recursion depth
        //     return null; // Simple approach: return null if too close this time
        // }

        return { x: randX, y: randY };
    }

    updateFlagDirectionArrow() {
        // Basic checks first
        if (!this.player || !this.player.active || !this.flagDirectionArrow) {
            if (this.flagDirectionArrow) {
                this.flagDirectionArrow.setVisible(false);
            }
            return;
        }

        const activeFlag = this.objectiveFlagsGroup?.getFirstAlive();

        // Check if a valid, active flag was found
        if (activeFlag && activeFlag.active) {
            this.flagDirectionArrow.setVisible(true);

            // Simple direct angle calculation - no fancy edge detection
            const angle = Phaser.Math.Angle.Between(
                this.player.x, 
                this.player.y, 
                activeFlag.x, 
                activeFlag.y
            );

            // Convert angle to degrees and normalize to 0-360
            let angleDeg = Phaser.Math.RadToDeg(angle);
            if (angleDeg < 0) {
                angleDeg += 360;
            }

            // Determine which 22.5 degree segment the angle falls into (0-15)
            const segment = Math.floor(angleDeg / 22.5);

            // Map segment index to frame name
            const frameNameMap = [
                'objective-arrow-E',    // 0   (0-22.5 degrees - East)
                'objective-arrow-ESE',  // 1   (22.5-45 degrees)
                'objective-arrow-SE',   // 2   (45-67.5 degrees)
                'objective-arrow-SSE',  // 3   (67.5-90 degrees)
                'objective-arrow-S',    // 4   (90-112.5 degrees - South)
                'objective-arrow-SSW',  // 5   (112.5-135 degrees)
                'objective-arrow-SW',   // 6   (135-157.5 degrees)
                'objective-arrow-WSW',  // 7   (157.5-180 degrees)
                'objective-arrow-W',    // 8   (180-202.5 degrees - West)
                'objective-arrow-WNW',  // 9   (202.5-225 degrees)
                'objective-arrow-NW',   // 10  (225-247.5 degrees)
                'objective-arrow-NNW',  // 11  (247.5-270 degrees)
                'objective-arrow-N',    // 12  (270-292.5 degrees - North)
                'objective-arrow-NNE',  // 13  (292.5-315 degrees)
                'objective-arrow-NE',   // 14  (315-337.5 degrees)
                'objective-arrow-ENE'   // 15  (337.5-360 degrees)
            ];

            const frameName = frameNameMap[segment];
            
            // Debug log to help understand the issue
            // console.log(`[Arrow Debug] Player pos: (${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)}), Flag pos: (${activeFlag.x.toFixed(0)}, ${activeFlag.y.toFixed(0)}), Angle: ${angleDeg.toFixed(1)}°, Segment: ${segment}, Frame: ${frameName}`);

            // Set the frame if it exists
            const atlasTexture = this.textures.get('dotted_arrows');
            if (atlasTexture && atlasTexture.has(frameName)) {
                    this.flagDirectionArrow.setFrame(frameName);
            } else {
                // Fallback to dot if frame not found
                this.flagDirectionArrow.setFrame('objective-dot');
                }

            // Don't set rotation since we're using directional sprite frames
            } else {
            // No active flag, show dot
            this.flagDirectionArrow.setFrame('objective-dot');
        }
    }

    // --- END Objective Flag Methods ---

    // --- ADDED Helper function for Main Menu Transition ---
    proceedToMainMenu(force = false) {
        // Check if already transitioning
        if (this.isTransitioning && !force) {
            console.log("[Transition] Transition already in progress, ignoring duplicate call");
            return;
        }
        
        // Set transition flag
        console.log("[Transition] Setting transition flag to true" + (force ? " (forced)" : ""));
        this.isTransitioning = true;
        console.log("[Transition] Proceeding to Main Menu.");
        this.isPaused = false; // Ensure pause state is reset
        
        // Add a failsafe timeout to force transition if cleanup takes too long
        const failsafeTimeout = setTimeout(() => {
            console.log("[Transition] Failsafe timeout triggered - forcing scene transition");
            this.scene.stop('Game');
            this.scene.start('MainMenu');
        }, 2000); // 2 seconds timeout
        
        // --- Clean up all game objects before stopping the scene ---
        try {
            // Clean up orange robots
            if (this.orangeRobotsGroup) {
                this.orangeRobotsGroup.clear(true, true); // Destroy all children
            }
            
            // Clean up objective flags
            if (this.objectiveFlagsGroup) {
                this.objectiveFlagsGroup.clear(true, true); // Destroy all children
            }
            
            // Clean up other groups
            if (this.enemies) {
                this.enemies.clear(true, true);
            }
            
            if (this.bullets) {
                this.bullets.clear(true, true);
            }
            
            if (this.enemyBullets) {
                this.enemyBullets.clear(true, true);
            }
            
            if (this.rpgsGroup) {
                this.rpgsGroup.clear(true, true);
            }
            
            if (this.pickupsGroup) {
                this.pickupsGroup.clear(true, true);
            }
            
            // Remove any pending timer events
            this.time.removeAllEvents();
            
            // Cancel the failsafe timeout since we completed normally
            clearTimeout(failsafeTimeout);
            
            console.log("[Transition] Game objects cleaned up before scene transition.");
        } catch (error) {
            console.error("[Transition] Error during cleanup:", error);
            // Don't clear the timeout on error - let it trigger as a fallback
        }

        // --- Stop BGM before leaving scene --- <<<< ADDED
        this.sound.stopByKey('bgm');

        // Now stop and start scenes
        this.scene.stop('Game');
        this.scene.start('MainMenu');
    }

    // +++ ADDED HANDLER: Bullet hits Orange Robot +++
    handleBulletHitOrangeRobot(bullet, robot) {
        console.log(`[DEBUG BvOR ENTRY] Bullet collided with ${robot?.name}`);
        if (!bullet || !bullet.active || !robot || !robot.active) {
            if (bullet && bullet.active) bullet.destroy();
            return;
        }
        bullet.destroy(); // Destroy bullet

        // Damage robot
        if (robot.takeDamage) {
            const stillAlive = robot.takeDamage(25); // Assuming player bullets do 25 damage
            if (!stillAlive) {
                console.log(`[DEBUG BvOR] Orange Robot destroyed by bullet. Adding score: ${robot.scoreValue}`);
                this.score += robot.scoreValue;
                this.updateScoreText();
                
                // Drop 2x ammo pickups when robot is destroyed
                const robotX = robot.x;
                const robotY = robot.y;
                
                // Spawn first ammo pickup directly at robot position
                this.spawnAmmoPickup(robotX, robotY);
                
                // Spawn second ammo pickup slightly offset
                const offsetX = Phaser.Math.Between(-20, 20);
                const offsetY = Phaser.Math.Between(-20, 20);
                this.spawnAmmoPickup(robotX + offsetX, robotY + offsetY);
                
                console.log(`[Loot] Orange Robot dropped 2x ammo at (${robotX}, ${robotY})`);
            }
        } else {
            console.error("[DEBUG BvOR] Orange Robot lacks takeDamage method!");
        }
    }

    // +++ ADDED HANDLER: Player hits Orange Robot +++
    handlePlayerHitOrangeRobot(player, robot) {
        if (!player || !player.active || !robot || !robot.active) {
            console.warn("[PvOR Collision] Inactive participant.");
            return;
        }

        if (player.invulnerable) {
            console.log("[PvOR Collision] Player invulnerable, ignoring.");
            return;
        }

        console.log("[PvOR Collision] Player hit Orange Robot.");

        // Damage player
        const damage = robot.meleeDamage || 35; // Higher damage for orange robots
        player.health -= damage;
        player.health = Math.max(0, player.health); // Ensure health doesn't visually go below zero
        this.events.emit('player_damaged', player); // Emit event for UI/feedback

        // Apply invulnerability
        player.invulnerable = true;
        this.time.delayedCall(1200, () => { // Slightly longer invulnerability
            if (player && player.active) player.invulnerable = false;
        });

        // Create blood splatter effect
        this.createBloodSplatter(player.x, player.y);

        // Knockback player
        const knockbackForce = 250;
        const angle = Phaser.Math.Angle.Between(robot.x, robot.y, player.x, player.y);
        this.physics.velocityFromRotation(angle, knockbackForce, player.body.velocity);

        // Optionally, robot might react (e.g., brief stun or pushback)
        // --- ADDED BODY CHECK --- >
        if (robot.body) {
            robot.body.velocity.x *= 0.5;
            robot.body.velocity.y *= 0.5;
        }

        // Check for game over - FORCE IT
        if (player.health <= 0) {
            this.gameOver(true); // Force game over, bypass isTransitioning check
        }
    }

    // Add createBloodSplatter method
    createBloodSplatter(x, y) {
        // Create multiple blood splatters to better visualize the hit
        
        // First splatter at exact hit position
        const mainSplatter = this.add.sprite(this.player.x, this.player.y, 'hit_spatters', 0);
        mainSplatter.setDepth(30); // Above player
        mainSplatter.setScale(3); // Make it more visible
        mainSplatter.setAlpha(0.9);
        
        // Create the animation if it doesn't exist yet
        if (!this.anims.exists('blood_splatter_anim')) {
            this.anims.create({
                key: 'blood_splatter_anim',
                frames: this.anims.generateFrameNumbers('hit_spatters', { start: 0, end: 5 }),
                frameRate: 24, // Much faster animation
                repeat: 0
            });
        }
        
        // Play the animation and destroy when complete
        mainSplatter.play('blood_splatter_anim');
        mainSplatter.once('animationcomplete', () => {
            if (mainSplatter && mainSplatter.active) {
                mainSplatter.destroy();
            }
        });
        
        // Create 3 additional smaller splatters that start slightly after the main one
        // to create a trail effect as the player gets knocked back
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 50, () => {
                if (!this.player || !this.player.active) return;
                
                // Create slightly delayed splatters at player's updated position
                const trailSplatter = this.add.sprite(this.player.x, this.player.y, 'hit_spatters', 
                                                      Phaser.Math.Between(0, 5));
                trailSplatter.setDepth(25); // Above player but below main splatter
                trailSplatter.setScale(1.5 - (i * 0.3)); // Gradually smaller
                trailSplatter.setAlpha(0.7 - (i * 0.2)); // Gradually more transparent
                
                // Add random offset
                trailSplatter.x += Phaser.Math.Between(-8, 8);
                trailSplatter.y += Phaser.Math.Between(-8, 8);
                
                // Play animation but start at random frame
                trailSplatter.play('blood_splatter_anim');
                trailSplatter.once('animationcomplete', () => {
                    if (trailSplatter && trailSplatter.active) {
                        trailSplatter.destroy();
                    }
                });
            });
        }
        
        // Add a camera shake effect for more impact
        this.cameras.main.shake(100, 0.01); 
        
        console.log("[Effect] Created enhanced blood splatter effect");
    }

    // Add gameOver method
    gameOver(force = false) {
        // Check if already transitioning
        if (this.isTransitioning && !force) {
            console.log("[GameOver] Transition already in progress, ignoring duplicate call");
            return;
        }
        
        // Set transition flag
        console.log("[GameOver] Setting transition flag to true" + (force ? " (forced)" : ""));
        this.isTransitioning = true;
        console.log("[GameOver] Starting game over transition...");
        
        // Add a failsafe timeout to force transition if cleanup takes too long
        const failsafeTimeout = setTimeout(() => {
            console.log("[GameOver] Failsafe timeout triggered - forcing scene transition");
            const initials = this.registry.get('playerInitials') || 'AAA';
            this.scene.stop('Game');
            this.scene.start('GameOver', { score: this.score, initials: initials });
        }, 2000); // 2 seconds timeout
        
        // Play player explosion sound before transitioning
        if (!this.registry.get('sfxMuted')) {
            this.sound.play('pixel-death');
        }
        
        // --- Clean up all game objects before stopping the scene ---
        try {
            // Clean up orange robots
            if (this.orangeRobotsGroup) {
                this.orangeRobotsGroup.clear(true, true);
            }
            
            // Clean up objective flags
            if (this.objectiveFlagsGroup) {
                this.objectiveFlagsGroup.clear(true, true);
            }
            
            // Clean up other groups
            if (this.enemies) {
                this.enemies.clear(true, true);
            }
            
            if (this.bullets) {
                this.bullets.clear(true, true);
            }
            
            if (this.enemyBullets) {
                this.enemyBullets.clear(true, true);
            }
            
            if (this.rpgsGroup) {
                this.rpgsGroup.clear(true, true);
            }
            
            if (this.pickupsGroup) {
                this.pickupsGroup.clear(true, true);
            }
            
            // Remove any pending timer events
            this.time.removeAllEvents();
            
            // Cancel the failsafe timeout since we completed normally
            clearTimeout(failsafeTimeout);
            
            console.log("[GameOver] Game objects cleaned up before scene transition.");
        } catch (error) {
            console.error("[GameOver] Error during cleanup:", error);
            // Don't clear the timeout on error - let it trigger as a fallback
        }
        
        // Retrieve initials from registry (with fallback)
        const initials = this.registry.get('playerInitials') || 'AAA';
        console.log(`[GameOver] Passing score ${this.score} and initials ${initials} to GameOver`);
        
        // Now start GameOver scene
        this.scene.stop('Game');
        this.scene.start('GameOver', { score: this.score, initials: initials });
    }

    // Add helper method to spawn ammo pickup directly
    spawnAmmoPickup(x, y) {
        try {
            const pickup = new Pickup(this, x, y, 'ammo_clip');
            if (pickup && pickup.active) {
                this.pickupsGroup.add(pickup);
                return true;
            }
        } catch (error) {
            console.error(`[Pickup Spawn] Error creating ammo pickup:`, error);
        }
        return false;
    }
}
