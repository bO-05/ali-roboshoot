import { Scene } from 'phaser';

// REMOVED UI Constants needed for asset loading
// const NUMBER_SPRITE_WIDTH = 8;
// const NUMBER_SPRITE_HEIGHT = 8;

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        // Define the base URL for assets hosted on Alibaba Cloud OSS
        this.ossBaseUrl = 'https://ali-roboshoot-assets-densodeto.oss-ap-southeast-1.aliyuncs.com/public/assets/';

        // We need to load the background for the preloader itself first if it's from OSS
        // Or use a placeholder/default background temporarily
        this.add.rectangle(512, 384, 1024, 768, 0x000000); // Simple black background during preload

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {

        // --- Load ALL assets using the full OSS URL ---

        // Backgrounds
        this.load.image('menu_background', this.ossBaseUrl + 'bg.png'); // Main menu background
        this.load.image('game_background', this.ossBaseUrl + 'background.png'); // Game background

        // Tileset (If still potentially needed)
        this.load.image('tiles', this.ossBaseUrl + 'Tileset/tileset_arranged.png');

        // Player
        this.load.spritesheet('player_car_core', this.ossBaseUrl + 'cars/red-cars-core.png', { frameWidth: 30, frameHeight: 30 }); // W, E, N, S
        this.load.spritesheet('player_car_diag1', this.ossBaseUrl + 'cars/red-cars-1.png', { frameWidth: 30, frameHeight: 30 }); // NW, NE, SW, SE (Standard Diagonals)
        this.load.spritesheet('player_car_diag2', this.ossBaseUrl + 'cars/red-cars-2.png', { frameWidth: 30, frameHeight: 30 }); // SE, NE (Alternative/Drift? Diagonals)

        // Enemies
        this.load.spritesheet('scarab', this.ossBaseUrl + 'Robots/Scarab.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('hornet', this.ossBaseUrl + 'Robots/Hornet.png', { frameWidth: 24, frameHeight: 24 });
        this.load.spritesheet('spider', this.ossBaseUrl + 'Robots/Spider.png', { frameWidth: 16, frameHeight: 16 });

        // Projectiles
        this.load.spritesheet('bullet', this.ossBaseUrl + 'Projectiles/bullets-plasma.png', { frameWidth: 8, frameHeight: 8 });
        // ADDED Grenade Projectile Spritesheet
        // this.load.spritesheet('grenade_projectile', this.ossBaseUrl + 'Projectiles/Grenade.png', { frameWidth: 8, frameHeight: 8 });
        // ADDED RPG Projectile Spritesheet
        this.load.spritesheet('rpg_projectile', this.ossBaseUrl + 'Projectiles/RPG-round.png', { frameWidth: 16, frameHeight: 16 }); // 3 frames, 16x16

        // UI Elements (Add any other UI assets needed, e.g., health bars, numbers)
        this.load.spritesheet('health_bar', this.ossBaseUrl + 'UI/health-bars.png', {
            frameWidth: 48, 
            frameHeight: 16 
        });

        // --- ADDED Overhead Health Bar --- >
        this.load.spritesheet('overhead_health_bar', this.ossBaseUrl + 'UI/overhead-health-bars-green.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        // --- END Overhead Health Bar --- <

        // Effects (Add any effect spritesheets)
        this.load.spritesheet('explosion_small', this.ossBaseUrl + 'Effects/small-explosion.png', { frameWidth: 24, frameHeight: 24 });
        // ADDED Big Explosion Spritesheet
        this.load.spritesheet('big_explosion', this.ossBaseUrl + 'Effects/big-explosion.png', { frameWidth: 32, frameHeight: 32 }); // 11 frames, 32x32

        // --- ADDED Objective Spritesheets ---
        this.load.spritesheet('objective_flag', this.ossBaseUrl + 'UI/objective-flag.png', { frameWidth: 64, frameHeight: 64 }); // 6 frames
        this.load.spritesheet('objective_pulse', this.ossBaseUrl + 'UI/objective-pulse.png', { frameWidth: 64, frameHeight: 64 }); // 8 frames
        // --- END Objective Spritesheets ---

        // --- ADDED Dotted Arrows Spritesheet ---
        // Load as Texture Atlas using the JSON definition
        this.load.atlas('dotted_arrows', 
            this.ossBaseUrl + 'UI/dotted-arrows.png', 
            this.ossBaseUrl + 'UI/dotted-arrows.json' 
        ); 
        // --- ATLAS LOAD DEBUGGING ---
        this.load.on('filecomplete-atlas-dotted_arrows', (key, type, data) => {
            console.log(`[DEBUG Preloader] Successfully loaded atlas: ${key}`);
        });
        this.load.on('loaderror-atlas-dotted_arrows', (file) => {
            console.error(`[DEBUG Preloader] Error loading atlas ${file.key}:`, file);
        });
        // --- END ATLAS LOAD DEBUGGING ---
        // --- END Dotted Arrows Spritesheet ---

        // Game over Assets
        this.load.image('game_over_bg', this.ossBaseUrl + 'game-over.webp');
        
        // Example from user query:
        // this.load.image('dotted_arrows', this.ossBaseUrl + 'UI/dotted-arrows.png');

        // --- Main Menu Assets ---
        this.load.image('logo', this.ossBaseUrl +'logo.webp'); // Load the logo image
        
        // --- UI Icons ---
        this.load.spritesheet('icon-set', this.ossBaseUrl + 'UI/icon-set.png', { frameWidth: 16, frameHeight: 16 }); // Added for pickups
        this.load.image('icon-music-on', this.ossBaseUrl + 'UI/mute-unmute.png');
        this.load.image('icon-music-off', this.ossBaseUrl + 'UI/mute-mute.png');
        this.load.image('icon-sfx-on', this.ossBaseUrl + 'UI/sfx-on.png');
        this.load.image('icon-sfx-off', this.ossBaseUrl + 'UI/sfx-off.png');
        
        // --- Sound Assets ---
        this.load.audio('bgm', this.ossBaseUrl + 'sound/pixel-dreams.mp3');
        this.load.audio('gunshot', this.ossBaseUrl + 'sound/gunshot.mp3');
        this.load.audio('explode', this.ossBaseUrl + 'sound/explode.mp3');

        // --- Add New Sound Assets ---
        this.load.audio('pixel-death', this.ossBaseUrl + 'sound/pixel-death.mp3');
        this.load.audio('game-over', this.ossBaseUrl + 'sound/game-over.mp3');

        // --- Add Pickup Sound Assets (Placeholders - replace with actual file names if available) ---
        this.load.audio('sfx_pickup_health', this.ossBaseUrl + 'sound/pickup-sound.mp3'); // UPDATED
        this.load.audio('sfx_pickup_ammo', this.ossBaseUrl + 'sound/pickup-sound.mp3');   // UPDATED
        this.load.audio('sfx_pickup_powerup', this.ossBaseUrl + 'sound/pickup-sound.mp3'); // UPDATED
        this.load.audio('sfx_pickup_hazard', this.ossBaseUrl + 'sound/pickup-sound.mp3'); // UPDATED

        // --- ADDED Flag Capture Sound (Reusing pickup sound for now) ---
        this.load.audio('sfx_capture_flag', this.ossBaseUrl + 'sound/retro-coin.mp3');
        // --- END Flag Capture Sound ---

        // --- ADDED Main Menu SFX ---
        this.load.audio('sfx_menu_button', this.ossBaseUrl + 'sound/menu-button.mp3');
        this.load.audio('sfx_game_start', this.ossBaseUrl + 'sound/game-start.mp3');
        // --- END Main Menu SFX ---

        // --- ADDED Orange Robot Assets ---
        const orangeRobotBasePath = this.ossBaseUrl + 'Orange-Robot/';
        this.load.spritesheet('orange_robot_idle',    orangeRobotBasePath + 'OrangeRobot_Idle.png',    { frameWidth: 32, frameHeight: 32 }); // 128x64 -> 4x2 frames
        this.load.spritesheet('orange_robot_run',     orangeRobotBasePath + 'OrangeRobot_Run.png',     { frameWidth: 32, frameHeight: 32 }); // 128x64 -> 4x2 frames
        this.load.spritesheet('orange_robot_attack1', orangeRobotBasePath + 'OrangeRobot_Attack1.png', { frameWidth: 32, frameHeight: 32 }); // 64x64 -> 2x2 frames
        this.load.spritesheet('orange_robot_attack2', orangeRobotBasePath + 'OrangeRobot_Attack2.png', { frameWidth: 32, frameHeight: 32 }); // 64x64 -> 2x2 frames
        this.load.spritesheet('orange_robot_hurt',    orangeRobotBasePath + 'OrangeRobot_Hurt.png',    { frameWidth: 32, frameHeight: 32 }); // 64x32 -> 2x1 frames
        this.load.spritesheet('orange_robot_jump',    orangeRobotBasePath + 'OrangeRobot_Jump.png',    { frameWidth: 32, frameHeight: 32 }); // 128x64 -> 4x2 frames
        this.load.spritesheet('orange_robot_land',    orangeRobotBasePath + 'OrangeRobot_Land.png',    { frameWidth: 32, frameHeight: 32 }); // 64x64 -> 2x2 frames
        // --- END Orange Robot Assets ---

        // --- ADDED Orange Robot Health Bars ---
        const healthBarBasePath = this.ossBaseUrl + 'UI/';
        this.load.spritesheet('overhead_health_bars_green', healthBarBasePath + 'overhead-health-bars-green.png', { frameWidth: 16, frameHeight: 16 }); // 16x48 -> 1x3 frames
        this.load.spritesheet('overhead_health_bars_orange', healthBarBasePath + 'overhead-health-bars-orange.png', { frameWidth: 16, frameHeight: 16 }); // 16x48 -> 1x3 frames
        this.load.spritesheet('overhead_health_bars_red',    healthBarBasePath + 'overhead-health-bars-red.png',    { frameWidth: 16, frameHeight: 16 }); // 16x48 -> 1x3 frames
        // Note: green already loaded
        // --- END Orange Robot Health Bars ---
    }

    create ()
    {
        // --- Define Global Animations --- (Moved from Game.js)
        console.log("[DEBUG] Defining global animations...");
        // Scarab Animations
        if (!this.anims.exists('scarab_idle')) {
            this.anims.create({
                key: 'scarab_idle',
                frames: this.anims.generateFrameNumbers('scarab', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!this.anims.exists('scarab_walk')) {
            this.anims.create({
                key: 'scarab_walk',
                frames: this.anims.generateFrameNumbers('scarab', { start: 5, end: 8 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!this.anims.exists('scarab_fire')) {
            this.anims.create({
                key: 'scarab_fire',
                frames: this.anims.generateFrameNumbers('scarab', { start: 10, end: 11 }),
                frameRate: 10,
                repeat: 0
            });
        }
        if (!this.anims.exists('scarab_melee')) {
            this.anims.create({
                key: 'scarab_melee',
                frames: this.anims.generateFrameNumbers('scarab', { start: 15, end: 19 }),
                frameRate: 10,
                repeat: 0
            });
        }
        if (!this.anims.exists('scarab_destroyed')) {
            this.anims.create({
                key: 'scarab_destroyed',
                frames: [ { key: 'scarab', frame: 20 } ],
                frameRate: 1,
                repeat: 0
            });
        }
        // Explosion Animation
        if (!this.anims.exists('explosion_small_anim')) {
             this.anims.create({
                key: 'explosion_small_anim',
                frames: this.anims.generateFrameNumbers('explosion_small', { start: 0, end: 8 }),
                frameRate: 20,
                repeat: 0
             });
        }
        // // ADDED Grenade Animation (COMMENTED OUT)
        // if (!this.anims.exists('grenade_spin')) {
        //      this.anims.create({
        //         key: 'grenade_spin',
        //         frames: this.anims.generateFrameNumbers('grenade_projectile', { start: 0, end: 7 }), // 8 frames total
        //         frameRate: 12, // Adjust speed as needed
        //         repeat: -1 // Loop forever
        //      });
        // }
        // ADDED RPG Fly Animation (uses frame 0 & 1)
        if (!this.anims.exists('rpg_fly')) {
             this.anims.create({
                key: 'rpg_fly',
                frames: this.anims.generateFrameNumbers('rpg_projectile', { start: 0, end: 1 }), // First 2 frames
                frameRate: 10,
                repeat: -1 // Loop
             });
        }
        // ADDED Big Explosion Animation
        if (!this.anims.exists('big_explosion_anim')) {
             this.anims.create({
                key: 'big_explosion_anim',
                frames: this.anims.generateFrameNumbers('big_explosion', { start: 0, end: 10 }), // 11 frames
                frameRate: 20,
                repeat: 0 // No loop
             });
        }

        // --- Hornet Animations ---
        if (!this.anims.exists('hornet_hover')) {
            this.anims.create({
                key: 'hornet_hover',
                frames: this.anims.generateFrameNumbers('hornet', { start: 0, end: 11 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!this.anims.exists('hornet_fire')) {
            this.anims.create({
                key: 'hornet_fire',
                frames: this.anims.generateFrameNumbers('hornet', { start: 12, end: 23 }),
                frameRate: 10,
                repeat: 0 // Play once for firing
            });
        }

        // --- Spider Animations ---
        if (!this.anims.exists('spider_idle')) {
            this.anims.create({
                key: 'spider_idle',
                frames: this.anims.generateFrameNumbers('spider', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!this.anims.exists('spider_walk')) {
            this.anims.create({
                key: 'spider_walk',
                frames: this.anims.generateFrameNumbers('spider', { start: 5, end: 8 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!this.anims.exists('spider_fire')) {
            this.anims.create({
                key: 'spider_fire',
                frames: this.anims.generateFrameNumbers('spider', { start: 10, end: 11 }),
                frameRate: 10,
                repeat: 0 // Play once
            });
        }
        if (!this.anims.exists('spider_melee')) {
            this.anims.create({
                key: 'spider_melee',
                frames: this.anims.generateFrameNumbers('spider', { start: 15, end: 19 }),
                frameRate: 10,
                repeat: 0 // Play once
            });
        }
        if (!this.anims.exists('spider_destroyed')) {
            this.anims.create({
                key: 'spider_destroyed',
                frames: [ { key: 'spider', frame: 20 } ],
                frameRate: 1,
                repeat: 0
            });
        }

        // --- ADDED Objective Animations ---
        if (!this.anims.exists('objective_flag_wave')) {
            this.anims.create({
                key: 'objective_flag_wave',
                frames: this.anims.generateFrameNumbers('objective_flag', { start: 0, end: 5 }), // 6 frames
                frameRate: 10,
                repeat: -1 // Loop
            });
        }
        if (!this.anims.exists('objective_pulse_anim')) {
            this.anims.create({
                key: 'objective_pulse_anim',
                frames: this.anims.generateFrameNumbers('objective_pulse', { start: 0, end: 7 }), // 8 frames
                frameRate: 12,
                repeat: -1 // Loop
            });
        }
        // --- END Objective Animations ---

        // --- ADDED Orange Robot Animations ---
        const animRate = 8;
        if (!this.anims.exists('orange_robot_idle_anim')) {
            this.anims.create({
                key: 'orange_robot_idle_anim',
                frames: this.anims.generateFrameNumbers('orange_robot_idle', { start: 0, end: 4 }), // Frames 0-4
                frameRate: animRate,
                repeat: -1 // Loop idle
            });
        }
        if (!this.anims.exists('orange_robot_run_anim')) {
            this.anims.create({
                key: 'orange_robot_run_anim',
                frames: this.anims.generateFrameNumbers('orange_robot_run', { start: 0, end: 5 }), // Frames 0-5
                frameRate: animRate,
                repeat: -1 // Loop run
            });
        }
        if (!this.anims.exists('orange_robot_attack1_anim')) {
            this.anims.create({
                key: 'orange_robot_attack1_anim',
                frames: this.anims.generateFrameNumbers('orange_robot_attack1', { start: 0, end: 3 }), // Frames 0-3
                frameRate: animRate,
                repeat: 0 // Play once
            });
        }
        if (!this.anims.exists('orange_robot_attack2_anim')) {
            this.anims.create({
                key: 'orange_robot_attack2_anim',
                frames: this.anims.generateFrameNumbers('orange_robot_attack2', { start: 0, end: 3 }), // Frames 0-3
                frameRate: animRate,
                repeat: 0 // Play once
            });
        }
        if (!this.anims.exists('orange_robot_hurt_anim')) {
            this.anims.create({
                key: 'orange_robot_hurt_anim',
                frames: this.anims.generateFrameNumbers('orange_robot_hurt', { start: 0, end: 1 }), // Frames 0-1
                frameRate: animRate,
                repeat: 0 // Play once
            });
        }
        // --- REMOVED JUMP ANIMATION ---
        // if (!this.anims.exists('orange_robot_jump_anim')) {
        //     this.anims.create({
        //         key: 'orange_robot_jump_anim',
        //         frames: this.anims.generateFrameNumbers('orange_robot_jump', { start: 0, end: 4 }), // Frames 0-4
        //         frameRate: animRate,
        //         repeat: 0 // Play once
        //     });
        // }
        // --- REMOVED LAND ANIMATION ---
        // if (!this.anims.exists('orange_robot_land_anim')) {
        //     this.anims.create({
        //         key: 'orange_robot_land_anim',
        //         frames: this.anims.generateFrameNumbers('orange_robot_land', { start: 0, end: 2 }), // Frames 0-2
        //         frameRate: animRate,
        //         repeat: 0 // Play once
        //     });
        // }
        // Simple destroyed state - using last frame of hurt? Or a specific placeholder?
        // Let's use the last hurt frame for now.
        if (!this.anims.exists('orange_robot_destroyed')) {
             this.anims.create({
                 key: 'orange_robot_destroyed',
                 frames: [ { key: 'orange_robot_hurt', frame: 1 } ],
                 frameRate: 1,
                 repeat: 0
             });
        }
        // --- END Orange Robot Animations ---

        console.log('[DEBUG] Global animations defined.');

        // --- Initialize Global Sound Settings in Registry ---
        this.registry.set('musicMuted', true);
        this.registry.set('sfxMuted', false);
        console.log('[DEBUG] Initialized sound settings in registry.');

        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        console.log('[DEBUG] Assets loaded from OSS. Starting MainMenu.');
        this.scene.start('MainMenu');
    }
}
