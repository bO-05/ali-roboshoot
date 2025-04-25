import { Scene } from 'phaser';

// --- ADJUSTED HEALTH ---
const SCARAB_HEALTH = 25; // Lowered from 100 for 1-hit kill with 25 damage

export class ScarabEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'scarab', 0);
        // The physics group handles adding to the scene and physics world
        // scene.add.existing(this); // REMOVED
        // scene.physics.add.existing(this); // REMOVED
        // The group's get() method will set active/visible and position.
        // Set custom default properties here if needed
        this.health = SCARAB_HEALTH;
        this.maxHealth = SCARAB_HEALTH; // Add maxHealth for potential future use (like health bars)
        this.meleeRange = 30; // Pixels
        this.meleeDamage = 20; // UPDATED Melee Damage
        this.meleeCooldown = 1000; // ms (1 second)
        this.lastMeleeTime = 0;
        this.isAttacking = false;
        this.meleeAnimDuration = 500; // Approx duration (5 frames @ 10fps)
        // Shooting properties
        this.shootingRange = 200; // Pixels
        this.bulletCooldownEnemy = 1500; // ms (1.5 seconds)
        this.lastBulletFiredTime = 0;
        this.bulletSpeed = 250;
        // this.setCollideWorldBounds(true); // Can be set here or by the group/scene logic if preferred

        // --- ADD Health Bar Property ---
        this.healthBar = null;

        // Animation will be played by the spawning logic in Game.js
        // if (this.anims.get('scarab_walk')) { // REMOVED
        //     this.anims.play('scarab_walk', true); // REMOVED
        // } else { // REMOVED
        //     console.warn('Scarab walk animation not found!'); // REMOVED
        //     this.setFrame(5); // REMOVED
        // } // REMOVED
    }

    // Called by the group when recycling/spawning (or now, after creation)
    spawn(x, y) {
        // constructor already sets default damage/cooldowns
        this.setPosition(x, y); // Set position
        this.setActive(true);     // Set active
        this.setVisible(true);    // Set visible
        this.body.enable = true;  // Enable physics body
        this.health = SCARAB_HEALTH;
        this.maxHealth = SCARAB_HEALTH; // Ensure maxHealth is also reset
        this.lastMeleeTime = 0; // Reset timers
        this.lastBulletFiredTime = 0;
        this.isAttacking = false; // Reset state
        this.anims.play('scarab_walk', true); // Play default animation

        // --- ADD Health Bar Creation ---
        // Destroy previous bar if it exists (for recycling)
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        // Create new bar (Frame 0 for Scarab - smallest)
        const barOffsetY = (this.height * this.scaleY / 2) + 4; // Offset above scaled sprite + padding
        this.healthBar = this.scene.add.sprite(this.x, this.y - barOffsetY, 'overhead_health_bar', 0)
            .setOrigin(0.5, 1) // Origin at bottom center
            .setDepth(this.depth + 1); // Ensure it renders above enemy

        console.log(`[DEBUG Spawn] Scarab spawned at (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }

    update(time, delta) {
        // Get player reference from the scene
        const player = this.scene.player;

        // Only process if the enemy is active and has a body
        if (!this.active || !this.body || !player || !player.active) {
            // Optional: Add specific logic if player is missing (e.g., idle behavior)
            if (this.active && this.body) this.body.setVelocity(0, 0); // Stop moving if player is gone
            return;
        }

        // --- ADD Health Bar Position Update ---
        if (this.active && this.healthBar) {
            const barOffsetY = (this.height * this.scaleY / 2) + 4;
            this.healthBar.setPosition(this.x, this.y - barOffsetY);
            this.healthBar.setVisible(true); // Ensure visible if enemy is active
        }

        // --- Main update logic wrapped in try-catch ---
        try {
            const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

            // Check if currently attacking
            if (this.isAttacking) {
                // If attacking, don't move
                this.body.setVelocity(0, 0);
                // Wait for melee animation to finish (handled by animation complete event)
                return;
            }

            // Check for melee OR shooting conditions
            if (distanceToPlayer <= this.meleeRange && time > this.lastMeleeTime + this.meleeCooldown) {
                // Prioritize melee if in range
                this.startMeleeAttack(time, player);
            } else if (distanceToPlayer <= this.shootingRange && time > this.lastBulletFiredTime + this.bulletCooldownEnemy) {
                // Shoot if in range and not meleeing
                this.fireBullet(time, player);
                this.moveTowardsPlayer(player); // Continue moving while shooting
                // Ensure walk animation is playing if not attacking
                if (this.anims.currentAnim?.key !== 'scarab_walk') {
                     this.anims.play('scarab_walk', true);
                }
            } else {
                // Just move if not attacking/shooting
                this.moveTowardsPlayer(player);
                // Ensure walk animation is playing if not attacking
                if (this.anims.currentAnim?.key !== 'scarab_walk') {
                     this.anims.play('scarab_walk', true);
                }
            }
        } catch (error) {
            console.error(`Error in ScarabEnemy update for ${this.x},${this.y}:`, error);
            // Optional: disable enemy on error? this.setActive(false); this.setVisible(false); this.body.enable = false;
        }
    }

    moveTowardsPlayer(player) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const speed = 60;
        this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }

    startMeleeAttack(time, player) {
        if (!this.active) return;

        // console.log(`[DEBUG] startMeleeAttack: Setting isAttacking = true (Time: ${time})`); // Log before
        this.isAttacking = true;
        // console.log(`[DEBUG] startMeleeAttack: isAttacking is now ${this.isAttacking}`); // Log after
        this.lastMeleeTime = time;
        this.body.setVelocity(0, 0); // Stop moving

        const meleeAnimKey = 'scarab_melee';
        if (this.anims.get(meleeAnimKey)) {
            this.anims.play(meleeAnimKey, true);

            // Schedule damage check partway through animation
            this.scene.time.delayedCall(this.meleeAnimDuration / 2, () => {
                if (!this.active || !player.active) return; // Check if enemy/player still active

                const distCheck = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
                if (distCheck <= this.meleeRange && !player.invulnerable) {
                    console.log("[DEBUG] Melee Hit! Applying damage."); // Keep minimal log for now
                    player.health -= this.meleeDamage;
                    // Trigger player feedback/invulnerability directly from here
                    player.invulnerable = true;
                    this.scene.events.emit('player_damaged', player); // Emit event for Game scene
                    this.scene.time.delayedCall(1000, () => { player.invulnerable = false; }); // Basic invulnerability timer
                }
            });

            // Reset state after animation completes
            this.once(`animationcomplete-${meleeAnimKey}`, () => { // Use specific key completion
                this.isAttacking = false;
                if (this.active) {
                    this.anims.play('scarab_walk', true);
                }
            });
        } else {
            console.warn(`Scarab animation '${meleeAnimKey}' not found!`);
            this.isAttacking = false; // Reset if animation fails
        }
    }

    fireBullet(time, player) {
        if (!this.active || !this.scene) return; // Added scene check

        this.lastBulletFiredTime = time;

        // --- Play Fire Animation ---
        const fireAnimKey = 'scarab_fire';
        console.log("[DEBUG Scarab anim] Playing 'scarab_fire'.");
        this.anims.play(fireAnimKey, true);
        this.once(`animationcomplete-${fireAnimKey}`, () => {
            if (this.active && !this.isAttacking) { // Only return to walk if active and not meleeing
                // console.log("[DEBUG Scarab anim] Fire anim complete, returning to walk.");
                this.anims.play('scarab_walk', true);
            }
        });

        // --- Fire Bullet (Delayed slightly after anim starts?) ---
        // Fire immediately for now, can add delay if needed
        const bullet = this.scene.enemyBullets.get(this.x, this.y, 'bullet', 2);

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setFrame(2);
            bullet.setScale(1.5); // Increase enemy bullet scale
            bullet.body.setSize(12, 12, true);
            bullet.setTint(0xff0000); // Red tint for enemy bullets

            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.scene.physics.velocityFromRotation(angle, this.bulletSpeed, bullet.body.velocity);

            // Assign damage to the bullet
            bullet.damage = 10; // UPDATED Ranged Damage
        }
    }

    // Called by Game.js when player bullet hits
    takeDamage(amount) {
        if (!this.active) {
            // console.log("[DEBUG Scarab takeDamage] Enemy inactive."); // Already logged elsewhere if needed
            return false;
        }
        console.log(`[DEBUG Scarab takeDamage] Health before: ${this.health} (Type: ${typeof this.health}), Damage: ${amount}`);
        this.health -= amount;
        const currentHealth = this.health; // Store current value
        const isLethal = currentHealth <= 0; // Perform check
        // console.log(`[DEBUG Scarab takeDamage] Health after: ${currentHealth} (Type: ${typeof currentHealth}). Checking if <= 0: ${isLethal}`); // Log value, type, and check result

        if (isLethal) { // Use the check result
            console.log("[DEBUG Scarab takeDamage] Health check PASSED (<= 0), calling die().");
            this.die();
            return false;
        } else {
            // console.log("[DEBUG Scarab takeDamage] Health check FAILED (> 0)."); // Optional: Log failure
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

    // Handles death effects and removal (moved from playDestroyedAnimation)
    die() {
        console.log("[DEBUG Scarab die] Method called.");
        if (!this.active) return; // Prevent multiple calls

        console.log("Scarab died!");
        this.setActive(false);
        // this.setVisible(false); // Keep visible for destroyed frame
        this.body.enable = false; // Disable physics body immediately

        // --- ADD Destroyed Frame ---
        this.anims.stop(); // Stop any current animation
        this.setFrame(20); // Set to the destroyed frame

        // --- Health Bar Destruction ---
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null; // Clear reference
        }

        // --- Spawn Explosion & Play Sound ---
        if (this.scene) { // Check if scene exists
             const explosion = this.scene.add.sprite(this.x, this.y, 'explosion_small');
            explosion.setScale(1.5);
            explosion.setDepth(this.depth + 1);
            explosion.play('explosion_small_anim');
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });

            // Play sound
             if (!this.scene.registry.get('sfxMuted')) {
                 // console.log("[DEBUG Sound] Playing explode (volume 0.2) - Scarab Die()"); // DEBUG
                 this.scene.sound.play('explode', { volume: 0.2 });
             }
        }

        // Destroy the enemy sprite itself AFTER setting up effects
         this.destroy();
    }

    // Call this method when the enemy should be destroyed
    playDestroyedAnimation() {
        if (!this.active) return; // Prevent multiple calls

        // This method is now obsolete, replaced by die()
        console.warn("playDestroyedAnimation() called on Scarab - this method is obsolete. Use die().");
        this.die(); // Call the new method just in case
    }
}
