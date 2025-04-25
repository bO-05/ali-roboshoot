import { Scene } from 'phaser';

// Configuration
const MOVE_SPEED = 400; // Faster than other enemies -> MUCH FASTER
const MELEE_DAMAGE = 90; // 3x Spider Melee Damage (30 * 3)
const MELEE_RANGE = 50; // Pixel distance to trigger melee attack
const HEALTH = 225; // 9 hits * 25 damage per player bullet
const SCORE_VALUE = 100;
const JUMP_CHANCE = 0.005; // Chance per update tick to try jumping
const JUMP_VELOCITY_Y = -350;
const JUMP_DURATION = 1000; // ms
const LAND_DURATION = 375; // ms (3 frames / 8 fps)
const HURT_DURATION = 250; // ms (2 frames / 8 fps)
const ATTACK_DURATION = 500; // ms (4 frames / 8 fps)

// --- NEW AI Constants ---
const FLAG_AGGRO_RADIUS = 400; // Engage player if they are within this distance of the *flag*
const FLAG_RETURN_RADIUS = 600; // If player moves further than this from the *flag*, return to guard
const GUARD_POSITION_RADIUS = 40; // How close the robot needs to be to the flag to be considered 'guarding'

// --- REFACTOR: Extend Container instead of Sprite ---
export class OrangeRobotEnemy extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        // Container constructor
        super(scene, x, y);

        // --- Add Container to Scene FIRST ---
        scene.add.existing(this);
        scene.physics.add.existing(this); // Enable physics ON THE CONTAINER

        this.setName('OrangeRobotContainer_' + scene.sys.displayList.length); // Unique name for debugging

        // --- Create the main robot sprite AS A CHILD ---
        this.robotSprite = scene.add.sprite(0, 0, 'orange_robot_idle'); // Position relative to container origin (0,0)
        this.add(this.robotSprite); // Add sprite to the container

        // --- Create the health bar sprite AS A CHILD ---
        // Position relative to container origin (0,0)
        // --- SIMPLIFIED POSITIONING --- >
        const healthBarYOffset = -25; // Simple fixed offset above origin
        this.healthBarSprite = scene.add.sprite(0, healthBarYOffset, 'overhead_health_bars_green', 2) 
            .setOrigin(0.5, 1) // Anchor bottom-center
            .setVisible(true);
        // <--- END SIMPLIFIED POSITIONING ---
        this.add(this.healthBarSprite); // Add health bar to the container

        // --- DEBUG: Log Health Bar Initial State ---
        console.log(`[OrangeRobot ${this.name}] HealthBar Initial: Texture=${this.healthBarSprite?.texture?.key}, Frame=${this.healthBarSprite?.frame?.name}, Visible=${this.healthBarSprite?.visible}, X=${this.healthBarSprite?.x?.toFixed(1)}, Y=${this.healthBarSprite?.y?.toFixed(1)}`);
        // --- END DEBUG ---

        // --- Configure CONTAINER Physics Body ---
        // Size based on the VISUAL sprite dimensions
        const bodyWidth = this.robotSprite.width * 0.8; // Use robotSprite for dimensions
        const bodyHeight = this.robotSprite.height * 0.9;
        this.body.setSize(bodyWidth, bodyHeight);
        // Offset relative to the CONTAINER's origin (which is usually the center of the visual sprite)
        this.body.setOffset(-bodyWidth / 2 + (this.robotSprite.width * 0.1), -bodyHeight / 2 + (this.robotSprite.height * 0.05)); // Adjust offset based on size
        this.body.setCollideWorldBounds(true);

        // --- Set Container Properties (Scale, Depth) ---
        this.setScale(1.5); // Scale the container (and children)
        this.setDepth(9); // Set container depth

        // --- Custom Properties (remain on container) ---
        this.health = HEALTH;
        this.maxHealth = HEALTH;
        this.moveSpeed = MOVE_SPEED;
        this.meleeDamage = MELEE_DAMAGE;
        this.scoreValue = SCORE_VALUE;
        this.targetFlag = null;
        this.isHurt = false;
        this.isAttacking = false;

        // --- Set Health Bar Depth (relative to container is fine) ---
        this.healthBarSprite.setDepth(1); // Render above robot sprite within container

        // --- Play initial animation ON THE ROBOT SPRITE ---
        this.robotSprite.play('orange_robot_idle_anim');

        console.log(`[Spawn OrangeRobot] Container ${this.name} created at (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }

    setTargetFlag(flag) {
        this.targetFlag = flag;
        console.log(`[OrangeRobot ${this.name}] Target flag set.`);
    }

    update(time, delta) {
        // Use container's active state
        if (!this.active || !this.body) { // Added check for body existence
            return;
        }

        // State machine check (no change needed)
        if (this.isHurt || this.isAttacking) {
            this.body.setVelocity(0); // Use container body
            this.updateHealthBar();
            return;
        }

        const player = this.scene.player;
        const flag = this.targetFlag;

        // --- Guardian AI Logic ---
        let target = null; // Who the robot should move towards (player or flag)
        let targetAnimation = 'orange_robot_idle_anim'; // Default animation

        // Conditions: Player and Flag must exist and be active
        if (player && player.active && flag && flag.active) {
            const distancePlayerToFlag = Phaser.Math.Distance.Between(player.x, player.y, flag.x, flag.y);
            const distanceRobotToFlag = Phaser.Math.Distance.Between(this.x, this.y, flag.x, flag.y);

            if (distancePlayerToFlag <= FLAG_AGGRO_RADIUS) {
                // Player is close to the flag - ATTACK PLAYER
                target = player;
                targetAnimation = 'orange_robot_run_anim';

                // Check melee range only when targeting player
                const distanceRobotToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
                if (distanceRobotToPlayer <= MELEE_RANGE) {
                    this.startAttack(); // Attack state will stop movement
                    targetAnimation = this.robotSprite.anims.currentAnim.key; // Keep attack anim playing
                }
            } else if (distanceRobotToFlag > GUARD_POSITION_RADIUS) {
                 // Player is FAR from flag, AND Robot is FAR from flag - RETURN TO FLAG
                 target = flag;
                 targetAnimation = 'orange_robot_run_anim';
            } else {
                 // Player is FAR from flag, AND Robot is CLOSE to flag - IDLE/GUARD
                 target = null; // Stop moving
                 targetAnimation = 'orange_robot_idle_anim';
            }
        } else if (flag && flag.active) {
            // No player, but flag exists - RETURN TO FLAG if not already there
            const distanceRobotToFlag = Phaser.Math.Distance.Between(this.x, this.y, flag.x, flag.y);
            if (distanceRobotToFlag > GUARD_POSITION_RADIUS) {
                target = flag;
                targetAnimation = 'orange_robot_run_anim';
            } else {
                target = null;
                targetAnimation = 'orange_robot_idle_anim';
            }
        } else {
            // No active flag - IDLE
            target = null;
            targetAnimation = 'orange_robot_idle_anim';
        }

        // --- Apply Movement and Animation ---
        if (target && !this.isAttacking) { // Only move if not currently attacking
            // Check if close enough to target to stop (avoid jittering)
            const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
            if (distanceToTarget > (target === player ? MELEE_RANGE : GUARD_POSITION_RADIUS)) {
                this.scene.physics.moveToObject(this, target, this.moveSpeed);
            } else {
                this.body.setVelocity(0);
                // If stopped at flag, switch to idle anim
                if (target === flag) {
                    targetAnimation = 'orange_robot_idle_anim';
                }
            }
        } else if (!this.isAttacking) { // No target and not attacking
            this.body.setVelocity(0);
        }

        // Play animation ON ROBOT SPRITE (unless attacking, which sets its own anim)
        if (!this.isAttacking) {
            this.robotSprite.play(targetAnimation, true);
        }

        this.updateHealthBar();
    }

    updateHealthBar() {
        if (!this.healthBarSprite || !this.healthBarSprite.active) return; // Check if sprite exists and is active

        const health = this.health;
        const maxHealth = this.maxHealth;
        let textureKey = 'overhead_health_bars_green';
        let frameIndex = 0; // Default to smallest/lowest frame

        if (health <= 0) {
            this.healthBarSprite.setVisible(false);
            return;
        }

        // Precise 9-step logic based on HEALTH points (assuming 225 max)
        // Each step represents 25 health (225 / 9 steps = 25 health/step)
        if (health > 175) { // Steps 9, 8, 7 (Green)
            textureKey = 'overhead_health_bars_green';
            if (health > 200) frameIndex = 2;      // > 8 steps (Full)
            else if (health > 175) frameIndex = 1; // > 7 steps
            else frameIndex = 0;                   // = 7 steps
        } else if (health > 100) { // Steps 6, 5, 4 (Orange)
            textureKey = 'overhead_health_bars_orange';
            if (health > 150) frameIndex = 2;      // > 6 steps
            else if (health > 125) frameIndex = 1; // > 5 steps
            else frameIndex = 0;                   // = 4 steps 
        } else { // Steps 3, 2, 1 (Red)
            textureKey = 'overhead_health_bars_red';
            if (health > 50) frameIndex = 2;       // > 2 steps
            else if (health > 25) frameIndex = 1;  // > 1 step
            else frameIndex = 0;                    // = 1 step
        }

        this.healthBarSprite.setVisible(true);

        // Set Texture if different - TRY setting texture first
        if (this.healthBarSprite.texture.key !== textureKey) {
            try {
                this.healthBarSprite.setTexture(textureKey);
            } catch(e) {
                console.error("Error setting health bar TEXTURE:", e, "Target Texture:", textureKey);
                return; // Don't try setting frame if texture failed
            }
        }
        
        // Set Frame if different (compare index directly)
        if (this.healthBarSprite.frame.sourceIndex !== frameIndex) { 
             try {
                 // Use the numeric frame index directly
                 this.healthBarSprite.setFrame(frameIndex);
                 // ++LOG: Verify frame AFTER setting
                 // console.log(`[HealthBar SetFrame] Attempted frame ${frameIndex}. Actual frame: ${this.healthBarSprite.frame.sourceIndex}, Name: ${this.healthBarSprite.frame.name}`);
             } catch (e) {
                 console.error("Error setting health bar FRAME:", e, "Target frame Index:", frameIndex, "Current Texture:", this.healthBarSprite.texture.key);
             }
        }
    }

    takeDamage(amount) {
        // Check CONTAINER active state
        if (!this.active) {
            return true; 
        }
        if (this.isHurt) return true; 

        this.health -= amount;
        console.log(`[OrangeRobot ${this.name}] Took ${amount} damage. Health: ${this.health}/${this.maxHealth}`);
        this.isHurt = true;
        // Play animation and tint ON ROBOT SPRITE
        this.robotSprite.play('orange_robot_hurt_anim');
        this.robotSprite.setTint(0xff0000);
        // Also clear tint on health bar in case it inherits?
        if (this.healthBarSprite) this.healthBarSprite.clearTint(); 
        this.scene.time.delayedCall(100, () => { 
            if (this.robotSprite) this.robotSprite.clearTint(); 
            // No need to clear health bar tint again here
        });

        this.updateHealthBar();

        this.scene.time.delayedCall(HURT_DURATION, () => {
            this.isHurt = false;
        });

        if (this.health <= 0) {
            this.destroySelf();
            return false; // Died
        }
        return true; // Survived
    }

    startAttack() {
        // Check CONTAINER active state
        if (!this.active || this.isAttacking || this.isHurt) {
            return; 
        }
        console.log(`[OrangeRobot ${this.name}] Starting melee attack.`);
        this.isAttacking = true;
        // Set velocity ON CONTAINER BODY
        this.body.setVelocity(0);

        const attackAnimKey = Math.random() < 0.5 ? 'orange_robot_attack1_anim' : 'orange_robot_attack2_anim';
        // Play animation ON ROBOT SPRITE
        this.robotSprite.play(attackAnimKey);

        // Deal Damage (use container position for distance check)
        const player = this.scene.player;
        if (player && player.active) {
            const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (distanceToPlayer <= MELEE_RANGE && !player.invulnerable) {
                console.log(`[OrangeRobot ${this.name}] Melee hit player!`);
                player.health -= this.meleeDamage;
                this.scene.events.emit('player_damaged', player);
                player.invulnerable = true;
                this.scene.time.delayedCall(1000, () => { if (player && player.active) player.invulnerable = false; });
            }
        }
        
        this.scene.time.delayedCall(ATTACK_DURATION, () => {
            this.isAttacking = false;
        }, [], this);
    }

    destroySelf() {
        console.log(`[OrangeRobot Container ${this.name}] Starting destroySelf. Current Health: ${this.health}`);
        // Use CONTAINER active state
        if (!this.active) return;
        this.setActive(false); // Set container inactive

        // Signal flag (no change needed)
        if (this.targetFlag && typeof this.targetFlag.setGuardianDestroyed === 'function') {
            console.log(`[OrangeRobot Container ${this.name}] About to call setGuardianDestroyed for flag ${this.targetFlag.name}.`);
            this.targetFlag.setGuardianDestroyed();
        }

        // Disable CONTAINER physics body
        if (this.body) { // Check body exists
            this.body.enable = false; 
            this.body.setVelocity(0);
        }
        // Hide health bar
        if (this.healthBarSprite) {
            this.healthBarSprite.setVisible(false);
        }

        // Play destroyed animation ON ROBOT SPRITE
        try {
            if (this.robotSprite) { // Check sprite exists
                this.robotSprite.play('orange_robot_destroyed');
            }
        } catch (e) { console.error("Error playing destroyed anim", e); }

        // Use the big_explosion sprite that's already defined in the preloader
        const explosion = this.scene.add.sprite(this.x, this.y, 'big_explosion').setScale(2.0);
        explosion.play('big_explosion_anim');
        explosion.once('animationcomplete', () => { explosion.destroy(); });
        
        // Add a flash effect for more impact
        const flash = this.scene.add.sprite(this.x, this.y, 'big_explosion', 0).setScale(2.5).setAlpha(0.6).setTint(0xffffff);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 3.0,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Schedule actual CONTAINER destruction
        this.scene.time.delayedCall(500, () => {
            // Container's destroy method handles children by default
            super.destroy(); 
        });
    }

    // Container's destroy method handles destroying children, so preDestroy override might not be needed
    // unless specific cleanup beyond children is required.
    // preDestroy() {
    //     console.log("[OrangeRobot Container] preDestroy called");
    //     // Cleanup references or timers specific to the container if any
    //     this.targetFlag = null;
    //     super.preDestroy(); 
    // }
} 