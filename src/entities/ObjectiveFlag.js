import Phaser from 'phaser';
import { Scene } from 'phaser';

export class ObjectiveFlag extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Call the parent constructor (Sprite)
        // console.log("[DEBUG ObjectiveFlag] Constructor called."); // FLAG LOG
        super(scene, x, y, 'objective_flag'); // Use the flag spritesheet

        this.scene = scene;

        // Create the pulse sprite slightly behind the flag
        this.pulse = scene.add.sprite(x, y, 'objective_pulse');
        this.pulse.setDepth(this.depth - 1); // Ensure pulse is behind flag
        this.pulse.play('objective_pulse_anim'); // Play pulse animation

        // Add this flag sprite to the scene's display list and update list
        scene.add.existing(this);
        scene.physics.add.existing(this); // Add to physics system

        // Flag specific properties
        this.body.setCircle(32); // Set a circular physics body roughly matching the visual
        this.body.setImmovable(true); // Flags don't move when hit
        this.body.setAllowGravity(false);

        // --- FLAG FIX: Set active/visible in constructor --- >
        this.setActive(true).setVisible(true);

        this.play('objective_flag_wave'); // Play flag animation

        // console.log(`[ObjectiveFlag] Created at (${x.toFixed(0)}, ${y.toFixed(0)})`);

        // --- NEW: Guardian Status ---
        this.isCapturable = false; // Start as not capturable
        this.guardian = null; // Reference to the guardian robot (optional but potentially useful)
        // --- End Guardian Status ---
    }

    // Method to handle being collected
    collect() {
        // console.log(`[ObjectiveFlag] Collected at (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        // Play capture sound (handled in Game scene)
        // Add score (handled in Game scene)

        // Destroy both the flag and pulse sprites
        if (this.pulse) {
            this.pulse.destroy();
            this.pulse = null; // Clear reference
        }
        this.destroy(); // Destroy the flag sprite itself
    }

    // Override destroy to ensure pulse is also destroyed
    destroy(fromScene) {
        if (this.pulse) {
            this.pulse.destroy(fromScene);
            this.pulse = null;
        }
        super.destroy(fromScene);
    }

    // Optional: Pre-update if needed, but likely not for static flags
    // preUpdate(time, delta) {
    //     super.preUpdate(time, delta);
    // }

    // Method called by the guardian when it's destroyed
    setGuardianDestroyed() {
        console.log(`[ObjectiveFlag ${this.name}] setGuardianDestroyed called. Setting isCapturable = true.`);
        this.isCapturable = true;
        this.guardian = null;
        // Optional: Add a visual cue (e.g., tint change, particle effect)
        this.setTint(0x00ff00); // Tint green when capturable
        this.scene.time.delayedCall(1000, () => { this.clearTint(); }); // Remove tint after 1s
    }

    // Optional: Method to link the guardian initially
    setGuardian(robot) {
        this.guardian = robot;
    }

    // Called when the player captures the flag (from Game scene overlap handler)
    collect() {
        console.log(`[ObjectiveFlag ${this.name}] Being collected.`);
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        
        // Optional: Add collection effect (particles, sound handled in Game)
        // ...

        // Schedule destruction
        // Use scene timer if available, otherwise destroy immediately
        if (this.scene && this.scene.time) {
             this.scene.time.delayedCall(100, () => {
                if (this.pulse) this.pulse.destroy();
                super.destroy();
            });
        } else {
            if (this.pulse) this.pulse.destroy();
            super.destroy();
        }
    }

     // Override preDestroy to clean up pulse effect
     preDestroy() {
        if (this.pulse) {
            this.pulse.destroy();
            this.pulse = null;
        }
        // Call the original preDestroy if extending a class that has one
        // super.preDestroy(); 
    }
} 