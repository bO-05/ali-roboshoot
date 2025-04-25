const pickupsConfig = {
    'repair_heart': {
        frame: 3,
        pickupType: 'resource',
        key: 'repair_heart',
        healAmount: 50,
        sfx: 'sfx_pickup_health'
    },
    'ammo_clip': {
        frame: 0, // ammo-1 (white) Frame: 14 (Row 1, Col 0) for ammo-2 (yellow)
        pickupType: 'resource',
        key: 'ammo_clip',
        value: 35, // Increased ammo given
        sfx: 'sfx_pickup_ammo'
    },
    /* // Commented out grenade pickup
    'grenade_pickup': {
        frame: 1, // stick-hand-grenade-2 (Row 1, Col 1)
        pickupType: 'resource',
        key: 'grenade_pickup',
        value: 2,
        sfx: 'sfx_pickup_ammo' // Reuse ammo sound for now
    },
    */
    'rpg_pickup': { // Added RPG pickup
        frame: 30, // stick-hand-grenade-3 (Row 2, Col 1) from icon-set.txt - using this as RPG visual
        spritesheet: 'rpg_projectile', // Use the RPG projectile sheet
        frame: 2, // Use the 3rd frame (index 2) for the pickup visual
        pickupType: 'resource',
        key: 'rpg_pickup',
        value: 2, // Gives 2 RPG ammo
        sfx: 'sfx_pickup_ammo' // Reuse ammo sound
    },
    'overdrive_bolt': {
        frame: 2, // energy-3 (Big yellow energy) (Row 2, Col 2) -- CHECK THIS FRAME INDEX
        pickupType: 'temp_buff',
        key: 'overdrive_bolt',
        duration: 8, // seconds
        sfx: 'sfx_pickup_powerup'
    },
};

export default pickupsConfig; 