import Phaser from 'phaser';
import pickupsConfig from '../config/pickupsConfig'; // Import the configuration

export class Pickup extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, pickupKey) {
        // Get the configuration data for this specific pickup type
        const config = pickupsConfig[pickupKey];
        if (!config) {
            console.error(`[Pickup Error] Invalid pickup key: ${pickupKey}`);
            // Optionally handle the error, e.g., don't create the sprite or use a default
            return; 
        }

        // Call the parent constructor (Sprite)
        // Use spritesheet from config if specified, otherwise default to 'icon-set'
        const spritesheet = config.spritesheet || 'icon-set';
        super(scene, x, y, spritesheet, config.frame);

        this.pickupData = config; // Store the config data
        this.pickupKey = pickupKey; // Store the key for easy identification

        // Add to the scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Make it non-movable by default (it shouldn't be pushed by physics)
        this.body.setImmovable(true);
        // Set scale based on the global scale factor if needed (using 1.5x from progress.md)
        this.setScale(1.5);
        // Adjust physics body size after scaling
        this.body.setSize(this.width, this.height); 


        // Add a simple visual effect (e.g., bobbing)
        this.addBobbingTween();
    }

    addBobbingTween() {
        this.scene.tweens.add({
            targets: this,
            y: this.y - 3, // Bob up slightly
            duration: 750, // Time for one direction
            ease: 'Sine.easeInOut',
            yoyo: true, // Go back down
            repeat: -1 // Repeat forever
        });
    }

    // Called when the pickup is collected
    collect() {
        console.log(`[Pickup] Collected ${this.pickupKey}`);
        // Optional: Add particle effect or tween animation on collect
        this.destroy(); // Remove the pickup sprite
    }
} 