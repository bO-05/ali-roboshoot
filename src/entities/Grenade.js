// --- File Content Commented Out ---
/*
import Phaser from 'phaser';

export class Grenade extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'grenade_projectile'); // Use the grenade spritesheet

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.sceneRef = scene; // Keep reference to the scene

        // Properties
        this.fuseTimer = null;
        this.explosionRadius = 60; // Slightly smaller than RPG but still significant
        this.explosionDamage = 40; // Damage dealt by explosion
        this.launchSpeed = 300;
        this.bounceDamping = 0.5; // How much velocity is lost on bounce
        this.lifespan = 3000; // ms before auto-exploding

        // Setup Physics Body
        this.setCollideWorldBounds(true);
        this.setBounce(this.bounceDamping);
        this.setDrag(50); // Slight air drag
        this.body.setCircle(4); // Small circular body for better rolling/bouncing
        this.setScale(1.5); // Match other projectiles

        // Start spinning animation
        this.play('grenade_spin');

        // Add collider with enemies (but handled differently - explodes on contact)
        this.sceneRef.physics.add.collider(this, this.sceneRef.enemies, this.explode, null, this);

        // Start the fuse timer
        this.fuseTimer = this.sceneRef.time.delayedCall(this.lifespan, this.explode, [], this);
    }

    launch(pointer) {
        if (!this.body) return; // Safety check

        // Calculate angle towards pointer
        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        this.sceneRef.physics.velocityFromRotation(angle, this.launchSpeed, this.body.velocity);

        // Add some angular velocity for tumbling (optional)
        this.setAngularVelocity(Phaser.Math.Between(-200, 200));

        console.log(`[Grenade Entity] Launched towards (${pointer.worldX.toFixed(0)}, ${pointer.worldY.toFixed(0)})`);
    }

    explode() {
        if (!this.active) return; // Don't explode if already inactive

        console.log(`[Grenade Entity] Exploding at (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);

        // Stop the fuse timer if it's still running
        if (this.fuseTimer) {
            this.fuseTimer.remove(false);
            this.fuseTimer = null;
        }

        // --- Visual Explosion ---
        // Use the small explosion for grenades for visual distinction
        const explosion = this.sceneRef.add.sprite(this.x, this.y, 'explosion_small').setScale(2.5); // Slightly larger scale than bullet impact
        explosion.play('explosion_small_anim');
        explosion.once('animationcomplete', () => { explosion.destroy(); });

        // --- Sound ---
        if (!this.sceneRef.registry.get('sfxMuted')) {
            this.sceneRef.sound.play('explode', { volume: 0.25 }); // Slightly louder than bullet impact
        }

        // --- Area Damage ---
        this.sceneRef.enemies.getChildren().forEach(enemy => {
            if (enemy && enemy.active) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (distance <= this.explosionRadius) {
                    console.log(`[Grenade Entity] Damaging enemy in radius.`);
                    if (enemy.takeDamage) {
                        const stillAlive = enemy.takeDamage(this.explosionDamage);
                        if (!stillAlive && enemy.active) {
                            console.log("[Grenade Entity] Enemy destroyed by explosion.");
                            this.sceneRef.score += 10;
                            this.sceneRef.updateScoreText();
                            // Play small sound?
                             if (!this.sceneRef.registry.get('sfxMuted')) {
                                 this.sceneRef.sound.play('explode', { volume: 0.1 });
                             }
                            this.sceneRef.trySpawnPickup(enemy.x, enemy.y);
                        }
                    } else {
                        console.warn("[Grenade Entity] Target lacks takeDamage, destroying directly.");
                        const enemyX = enemy.x;
                        const enemyY = enemy.y;
                        enemy.setActive(false).setVisible(false).destroy();
                        this.sceneRef.score += 5;
                        this.sceneRef.updateScoreText();
                        this.sceneRef.trySpawnPickup(enemyX, enemyY);
                    }
                }
            }
        });

        // Destroy the grenade sprite itself
        this.destroy();
    }

    // Override preDestroy to ensure timer is cleared
    preDestroy() {
        if (this.fuseTimer) {
            this.fuseTimer.remove(false);
            this.fuseTimer = null;
            console.log("[Grenade Entity] Fuse timer cleared in preDestroy.");
        }
        super.preDestroy();
    }
} 
*/ 