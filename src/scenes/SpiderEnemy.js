import Phaser from 'phaser';

// Spider has melee and ranged attacks, damage multiplier 1.5x
// Scarab Melee=20, Ranged=10 -> Spider Melee=30, Ranged=15
const SPIDER_MELEE_DAMAGE = 30; // 20 * 1.5 = 30
const SPIDER_RANGED_DAMAGE = 15; // 10 * 1.5 = 15
const SPIDER_HEALTH = 75; // Lowered from 120 for 3-hit kill with 25 damage

export class SpiderEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'spider', 0); // Use spider texture

        this.health = SPIDER_HEALTH;
        this.maxHealth = SPIDER_HEALTH; // Add maxHealth
        this.healthBar = null;
        this.meleeRange = 25; // Slightly shorter than Scarab?
        this.meleeDamage = SPIDER_MELEE_DAMAGE;
        this.meleeCooldown = 800; // Faster melee?
        this.lastMeleeTime = 0;
        this.isAttacking = false;
        this.meleeAnimDuration = 500; // Approx duration (5 frames @ 10fps)

        this.shootingRange = 180; // Shorter shooting range?
        this.bulletCooldownEnemy = 1000; // Faster shooting?
        this.lastBulletFiredTime = 0;
        this.bulletSpeed = 200; // Slower bullets?

        this.movementSpeed = 80; // Faster base movement
        this.chargeSpeed = 150; // Speed when charging for melee
        this.chargeDistance = 100; // Distance to start charging from
        this.isCharging = false; // State for charging behavior
    }

    // Called by the group when recycling/spawning
    spawn(x, y) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.health = SPIDER_HEALTH;
        this.maxHealth = SPIDER_HEALTH; // Reset maxHealth
        this.lastMeleeTime = 0;
        this.lastBulletFiredTime = 0;
        this.isAttacking = false;
        this.isCharging = false;
        console.log("[DEBUG Spider anim] Playing 'spider_walk' in spawn.");
        this.anims.play('spider_walk', true); // Start walking

        if (this.healthBar) {
            this.healthBar.destroy();
        }
        const barOffsetY = (this.height * this.scaleY / 2) + 4;
        this.healthBar = this.scene.add.sprite(this.x, this.y - barOffsetY, 'overhead_health_bar', 2)
            .setOrigin(0.5, 1)
            .setDepth(this.depth + 1);
    }

    update(time, delta) {
        const player = this.scene.player;

        if (!this.active || !this.body || !player || !player.active) {
            if (this.active && this.body) this.body.setVelocity(0, 0);
            return;
        }

        try {
            const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

            // Check if currently performing melee attack
            if (this.isAttacking) {
                this.body.setVelocity(0, 0);
                return; // Wait for melee to finish
            }

            // Check if currently performing ranged attack (and let anim finish)
            const currentAnimKey = this.anims.currentAnim?.key;
            if (currentAnimKey === 'spider_fire' && !this.anims.currentFrame.isLast) {
                 this.body.setVelocity(0, 0); // Stop while firing
                return; // Wait for fire animation
            }

            // Check for melee OR shooting conditions
            if (distanceToPlayer <= this.meleeRange && time > this.lastMeleeTime + this.meleeCooldown) {
                // Melee attack
                this.startMeleeAttack(time, player);
            } else if (distanceToPlayer <= this.shootingRange && time > this.lastBulletFiredTime + this.bulletCooldownEnemy && !this.isCharging) {
                // Shoot if in range and not meleeing/charging
                this.fireBullet(time, player);
                this.moveTowardsPlayer(player, this.movementSpeed); // Normal speed while shooting
                // Ensure walk animation is playing if not attacking
                if (this.anims.currentAnim?.key !== 'spider_walk' && this.anims.currentAnim?.key !== 'spider_fire') {
                     this.anims.play('spider_walk', true);
                }
            } else if (distanceToPlayer <= this.chargeDistance && distanceToPlayer > this.meleeRange && !this.isAttacking) {
                 // Charge if close enough but not meleeing
                // this.chargeTowardsPlayer(player);
                 // Ensure walk animation is playing
                if (this.anims.currentAnim?.key !== 'spider_walk' && this.anims.currentAnim?.key !== 'spider_melee') {
                     this.anims.play('spider_walk', true);
                }
            } else {
                // Just move normally if not attacking/shooting/charging
                this.moveTowardsPlayer(player, this.movementSpeed);
                // --- ADD Animation Check ---
                // Ensure walk animation plays only if not already playing walk/melee/fire
                const currentKey = this.anims.currentAnim?.key;
                if (currentKey !== 'spider_walk' && currentKey !== 'spider_melee' && currentKey !== 'spider_fire') {
                     this.anims.play('spider_walk', true);
                }
            }

            if (this.active && this.healthBar) {
                const barOffsetY = (this.height * this.scaleY / 2) + 4;
                this.healthBar.setPosition(this.x, this.y - barOffsetY);
                this.healthBar.setVisible(true);
            }
        } catch (error) {
            console.error(`Error in SpiderEnemy update for ${this.x},${this.y}:`, error);
        }
    }

    moveTowardsPlayer(player) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.body.setVelocity(Math.cos(angle) * this.movementSpeed, Math.sin(angle) * this.movementSpeed);
    }

    startMeleeAttack(time, player) {
        if (!this.active || !this.scene) return;

        // console.log(`[DEBUG Spider] startMeleeAttack`);
        this.isAttacking = true;
        this.lastMeleeTime = time;
        this.body.setVelocity(0, 0); // Stop moving

        const meleeAnimKey = 'spider_melee';
        // console.log("[DEBUG Spider anim] Playing 'spider_melee' in startMeleeAttack.");
        this.anims.play(meleeAnimKey, true);

        // Add listener IMMEDIATELY after playing
        this.once(`animationcomplete-${meleeAnimKey}`, () => {
            // console.log("[DEBUG Spider anim] Melee animation complete."); // LOG
            this.isAttacking = false;
            if (this.active) {
                // console.log("[DEBUG Spider anim] Playing 'spider_walk' after melee complete.");
                this.anims.play('spider_walk', true);
            }
        });

        // Damage check partway through animation (frame 10 is contact frame according to ref)
        // Animation is 5 frames @ 10fps = 500ms total. Frame 10 is index 2 (0-based). (2/5) * 500 = 200ms?
        const damageTime = (2.5 / 5) * this.meleeAnimDuration; // Hit slightly after midpoint?

        this.scene.time.delayedCall(damageTime, () => {
            if (!this.active || !player.active) return;

            const distCheck = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            // Use a slightly larger check radius for melee hit to be forgiving
            if (distCheck <= this.meleeRange * 1.2 && !player.invulnerable) {
                console.log("[DEBUG Spider] Melee Hit! Applying damage.");
                player.health -= this.meleeDamage;
                player.invulnerable = true;
                this.scene.events.emit('player_damaged', player);
                this.scene.time.delayedCall(1000, () => { if(player) player.invulnerable = false; });
            }
        });
    }

    fireBullet(time, player) {
        if (!this.active || !this.scene) return;

        // console.log("[DEBUG Spider anim] Playing 'spider_fire' in fireBullet.");
        this.anims.play('spider_fire', true);
        this.lastBulletFiredTime = time;
        this.body.setVelocity(0, 0); // Stop while firing anim plays

        // Add listener IMMEDIATELY after playing
        this.once('animationcomplete-spider_fire', () => {
            // console.log("[DEBUG Spider anim] Fire animation complete."); // LOG
            if (this.active) {
                // console.log("[DEBUG Spider anim] Playing 'spider_walk' after fire complete.");
                this.anims.play('spider_walk', true);
            }
        });

        // Get bullet slightly after animation starts (frame 7 is flash)
        // 2 frames @ 6 fps = ~333ms total. Frame 7 is index 1. (1/2) * 333 = ~167ms?
        const fireDelay = 150;
        this.scene.time.delayedCall(fireDelay, () => {
            if (!this.active || !this.scene) return; // Check again after delay

            const bullet = this.scene.enemyBullets.get(this.x, this.y, 'bullet', 2);
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.setFrame(2);
                bullet.setScale(1.5);
                bullet.body.setSize(12, 12, true);
                bullet.setTint(0xff8800); // Orange tint for Spider bullets?

                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.scene.physics.velocityFromRotation(angle, this.bulletSpeed, bullet.body.velocity);
                bullet.damage = SPIDER_RANGED_DAMAGE; // Assign damage
            }
        });
    }

    // Called by Game.js when player bullet hits
    takeDamage(amount) {
        if (!this.active) {
            // console.log("[DEBUG Spider takeDamage] Enemy inactive.");
            return false;
        }
        console.log(`[DEBUG Spider takeDamage] Health before: ${this.health} (Type: ${typeof this.health}), Damage: ${amount}`);
        this.health -= amount;
        const currentHealth = this.health; // Store current value
        const isLethal = currentHealth <= 0; // Perform check
        // console.log(`[DEBUG Spider takeDamage] Health after: ${currentHealth} (Type: ${typeof currentHealth}). Checking if <= 0: ${isLethal}`); // Log value, type, and check result

        if (this.active && this.healthBar) {
            const healthPercent = Math.max(0, this.health) / this.maxHealth;
            if (healthPercent <= (1/3)) {      // ~33% threshold for Spider (2 hits)
                this.healthBar.setFrame(0); // Small bar
            } else if (healthPercent <= (2/3)) { // ~66% threshold for Spider (1 hit)
                this.healthBar.setFrame(1); // Medium bar
            } else {
                this.healthBar.setFrame(2); // Large bar
            }
        }

        if (isLethal) { // Use the check result
            console.log("[DEBUG Spider takeDamage] Health check PASSED (<= 0), calling die().");
            this.die();
            return false;
        } else {
            // console.log("[DEBUG Spider takeDamage] Health check FAILED (> 0).");
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
        console.log("[DEBUG Spider die] Method called.");
        if (!this.active) return;

        console.log("Spider died!");
        this.setActive(false);
        // this.setVisible(false); // Keep visible for destroyed frame
        this.body.enable = false;

        // --- ADD Destroyed Frame ---
        this.anims.stop();
        this.setFrame(20); // Set to the destroyed frame

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
                 // console.log("[DEBUG Sound] Playing explode (volume 0.2) - Spider Die()"); // DEBUG
                 this.scene.sound.play('explode', { volume: 0.2 });
             }
        }

        this.destroy();
    }

    // Spiders likely deal damage on contact
    onPlayerContact(player) {
        if (!this.active || !player || !player.active || player.invulnerable) {
            return;
        }
        // Apply melee damage directly on contact?
        // Or let the main Player vs Enemy collider in Game.js handle it?
        // Let Game.js handle it for consistency, like Scarab.
        console.log("Spider collided with player");
    }
} 