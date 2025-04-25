import Phaser from 'phaser';

// Assuming Hornet only has ranged attack, damage multiplier 1.25x (Scarab Ranged = 10 -> Hornet Ranged = 13)
const HORNET_RANGED_DAMAGE = 13; // 10 * 1.25 = 12.5, rounded up
const HORNET_HEALTH = 50; // Lowered from 100 for 2-hit kill with 25 damage

export class HornetEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'hornet', 0); // Use hornet texture

        this.health = HORNET_HEALTH;
        this.maxHealth = HORNET_HEALTH; // Add maxHealth
        this.shootingRange = 250; // Slightly longer range than scarab?
        this.bulletCooldownEnemy = 1200; // Slightly faster firing rate?
        this.lastBulletFiredTime = 0;
        this.bulletSpeed = 300; // Slightly faster bullets?
        this.movementSpeed = 70; // Base speed
        this.strafeSpeed = 40; // Speed for side-to-side movement
        this.strafeDirection = (Math.random() < 0.5) ? -1 : 1; // Initial strafe direction
        this.timeToChangeStrafe = 0; // Timer for changing strafe direction

        // --- ADD Health Bar Property ---
        this.healthBar = null;
    }

    // Called by the group when recycling/spawning
    spawn(x, y) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.health = HORNET_HEALTH;
        this.maxHealth = HORNET_HEALTH; // Ensure maxHealth is also reset
        this.lastBulletFiredTime = 0;
        // console.log("[DEBUG Hornet anim] Playing 'hornet_hover' in spawn.");
        this.anims.play('hornet_hover', true);

        // --- ADJUST Physics Body for 24x24 sprite ---
        const newWidth = 24 * this.scaleX; // 24 * 1.5 = 36
        const newHeight = 24 * this.scaleY; // 24 * 1.5 = 36
        this.body.setSize(newWidth, newHeight, true); // Center aligned by default
        // Optional: Adjust offset if needed, e.g., this.body.setOffset(x, y);

        // Reset strafing
        this.strafeDirection = (Math.random() < 0.5) ? -1 : 1;
        this.timeToChangeStrafe = 0;

        // --- ADD Health Bar Creation ---
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        // Create new bar (Frame 1 for Hornet - medium)
        // --- ADJUST Health Bar Offset for 24px height ---
        const barOffsetY = (24 * this.scaleY / 2) + 4; // Use base height 24
        this.healthBar = this.scene.add.sprite(this.x, this.y - barOffsetY, 'overhead_health_bar', 1)
            .setOrigin(0.5, 1)
            .setDepth(this.depth + 1);
    }

    update(time, delta) {
        const player = this.scene.player;

        // --- ADD Health Bar Position Update ---
        if (this.active && this.healthBar) {
            // --- ADJUST Health Bar Offset for 24px height ---
            const barOffsetY = (24 * this.scaleY / 2) + 4; // Use base height 24
            this.healthBar.setPosition(this.x, this.y - barOffsetY);
            this.healthBar.setVisible(true);
        }

        if (!this.active || !this.body || !player || !player.active) {
            // If player is gone or self is inactive, maybe just hover idly or disable?
            if (this.active && this.body) this.body.setVelocity(0, 0);
            return;
        }

        try {
            const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

            // --- Movement ---
            // Maintain a certain distance, strafe side to side
            const idealDistance = this.shootingRange * 0.75; // Try to stay within 3/4 of max range
            const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

            // Forward/Backward movement
            let moveSpeed = 0;
            if (distanceToPlayer > idealDistance + 20) {
                moveSpeed = this.movementSpeed; // Move closer
            } else if (distanceToPlayer < idealDistance - 20) {
                moveSpeed = -this.movementSpeed / 2; // Back away slowly
            }

            // Strafe movement
            if (time > this.timeToChangeStrafe) {
                this.strafeDirection *= -1; // Change direction
                this.timeToChangeStrafe = time + Phaser.Math.Between(1000, 3000); // Change again in 1-3 seconds
            }
            // Calculate strafe velocity perpendicular to player angle
            const strafeAngle = angleToPlayer + (Math.PI / 2) * this.strafeDirection;
            const strafeVx = Math.cos(strafeAngle) * this.strafeSpeed;
            const strafeVy = Math.sin(strafeAngle) * this.strafeSpeed;

            // Combine forward/backward and strafe velocities
            const forwardVx = Math.cos(angleToPlayer) * moveSpeed;
            const forwardVy = Math.sin(angleToPlayer) * moveSpeed;

            this.body.setVelocity(forwardVx + strafeVx, forwardVy + strafeVy);


            // --- Attack ---
            if (distanceToPlayer <= this.shootingRange && time > this.lastBulletFiredTime + this.bulletCooldownEnemy) {
                this.fireBullet(time, player);
            }

            // --- Animation ---
            // Check if firing animation is playing, if so, let it finish
            const currentAnimKey = this.anims.currentAnim?.key;
            if (currentAnimKey === 'hornet_fire' && !this.anims.currentFrame.isLast) {
                // Firing animation in progress
            } else {
                // Default to hover animation
                 if (currentAnimKey !== 'hornet_hover') {
                     // console.log("[DEBUG Hornet anim] Playing 'hornet_hover' in update (default).");
                     this.anims.play('hornet_hover', true);
                 }
            }
        } catch (error) {
            console.error(`Error in HornetEnemy update for ${this.x},${this.y}:`, error);
        }
    }

    fireBullet(time, player) {
        if (!this.active || !this.scene) return; // Add scene check

        // Play firing animation (it's short, plays once)
        console.log("[DEBUG Hornet anim] Playing 'hornet_fire' in fireBullet.");
        this.anims.play('hornet_fire', true);

        this.lastBulletFiredTime = time;
        // Use the scene's enemy bullet group
        const bullet = this.scene.enemyBullets.get(this.x, this.y, 'bullet', 2);

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setFrame(2); // Standard bullet frame
            bullet.setScale(1.5); // Match other bullets
            bullet.body.setSize(12, 12, true);
            bullet.setTint(0x00ff00); // Green tint for Hornet bullets?

            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.scene.physics.velocityFromRotation(angle, this.bulletSpeed, bullet.body.velocity);

            // Hornet bullet damage is handled in Game.js overlap check based on tint/origin?
            // We need a way to distinguish bullet sources in Game.js or pass damage here.
            // Simplest for now: Game.js checks bullet properties (e.g., tint)
            // Alternative: Give bullets a 'damage' property when fired.
            bullet.damage = HORNET_RANGED_DAMAGE; // Assign damage to the bullet itself
        }
    }

    // Called by Game.js when player bullet hits
    takeDamage(amount) {
        if (!this.active) {
            // console.log("[DEBUG Hornet takeDamage] Enemy inactive.");
            return false;
        }
        console.log(`[DEBUG Hornet takeDamage] Health before: ${this.health} (Type: ${typeof this.health}), Damage: ${amount}`);
        this.health -= amount;
        const currentHealth = this.health; // Store current value
        const isLethal = currentHealth <= 0; // Perform check
        // console.log(`[DEBUG Hornet takeDamage] Health after: ${currentHealth} (Type: ${typeof currentHealth}). Checking if <= 0: ${isLethal}`); // Log value, type, and check result

        // --- ADD Health Bar Frame Update ---
        if (this.active && this.healthBar) { // Check active state again
            const healthPercent = Math.max(0, this.health) / this.maxHealth;
            if (healthPercent <= 0.5) { // 50% threshold for Hornet (1 hit)
                this.healthBar.setFrame(0); // Small bar
            } else {
                this.healthBar.setFrame(1); // Medium bar
            }
        }

        if (isLethal) { // Use the check result
            console.log("[DEBUG Hornet takeDamage] Health check PASSED (<= 0), calling die().");
            this.die();
            return false;
        } else {
            // console.log("[DEBUG Hornet takeDamage] Health check FAILED (> 0).");
            // Hit flash effect
            if (this.scene) { // Ensure scene exists
                this.setTint(0xff0000); // Red tint
                this.scene.time.delayedCall(100, () => {
                    if (this.active) { // Check if still active before clearing tint
                         this.clearTint(); // Clear tint after 100ms
                    }
                });
            }
            return true;
        }
    }

    // Handles death effects and removal
    die() {
        console.log("[DEBUG Hornet die] Method called.");
        if (!this.active) return; // Prevent multiple calls

        console.log("Hornet died!");
        this.setActive(false);
        // this.setVisible(false); // Keep visible for destroyed frame
        this.body.enable = false;

        // --- Use Generic Destroyed Frame ---
        this.anims.stop();
        this.setTexture('spider', 20); // Use spider spritesheet, frame 20

        // --- Health Bar Destruction ---
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }

        // --- Spawn Explosion & Play Sound ---
        if (this.scene) {
            const explosion = this.scene.add.sprite(this.x, this.y, 'explosion_small');
            explosion.setScale(1.5);
            explosion.setDepth(this.depth + 1);
            explosion.play('explosion_small_anim');
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });

            // Play sound
             if (!this.scene.registry.get('sfxMuted')) {
                 // console.log("[DEBUG Sound] Playing explode (volume 0.2) - Hornet Die()"); // DEBUG
                 this.scene.sound.play('explode', { volume: 0.2 });
             }
        }

        // Destroy the enemy sprite itself
        this.destroy();

        // Note: Score and pickup spawning are handled in Game.js based on takeDamage result
    }

    // Optional: Handle player collision (Hornet likely pushes back rather than meleeing)
    onPlayerContact(player) {
        if (!this.active || !player || !player.active || player.invulnerable) {
            return;
        }
        // No damage, maybe just a slight knockback effect?
        // Or trigger player damage like a normal collision in Game.js handles it?
        // For consistency, let Game.js handle player damage on overlap/collide.
        // console.log("Hornet collided with player (no direct damage)");
    }
} 