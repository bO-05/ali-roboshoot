import { Scene } from 'phaser';

// Constants REMOVED as number sprites are no longer used here
// const NUMBER_SPRITE_WIDTH = 8;
// const NUMBER_SPRITE_HEIGHT = 8;

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
        this.finalScore = 0; // Initialize score property
        this.playerInitials = 'AAA'; // Initialize initials property
    }

    init (data) {
        // Receive score and initials from the previous scene (Game)
        this.finalScore = data.score || 0; // Default to 0 if score not passed
        this.playerInitials = data.initials || 'AAA'; // Default to 'AAA' if initials not passed
        console.log(`GameOver received score: ${this.finalScore}, initials: ${this.playerInitials}`);
    }

    create ()
    {
        this.add.image(512, 384, 'background');

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Add the new background image - Scaled down and moved up even more
        this.add.image(centerX, centerY - 225, 'game_over_bg').setScale(0.5).setDepth(0); // Reduced scale, moved higher, explicit depth 0

        // Game Over Text (REMOVED - Assuming it's part of the background image)
        /*
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);
        */

        // Display Final Score using Text object
        // REMOVED sprite score display
        /*
        this.scoreDigits = this.add.group();
        this.updateScoreDisplay(this.finalScore); // Display the score passed from Game scene
        */
        this.add.text(centerX, centerY + 200, `Final Score: ${this.finalScore}`, { // Adjusted Y position DOWN
            fontFamily: 'Arial Black',
            fontSize: 28, // Slightly smaller than restart
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5).setDepth(1);

        // --- Score Submission Status Text --- (Positioned near the top now)
        this.submissionStatusText = this.add.text(centerX, centerY - 150, 'Saving score...', { // Adjusted Y position UP
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5).setDepth(1); // Ensure depth is above background

        // --- Submit Score with Initials --- (No position change needed for logic)
        this.submitScore(this.finalScore, this.playerInitials);

        // --- Bottom Elements ---

        // Restart Prompt (Moved to bottom, changed to keyboard)
        this.add.text(centerX, centerY + 240, 'Press R to Restart', { // Changed text
            fontFamily: 'Arial Black',
            fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5).setDepth(1);

        // Mute Hint (Moved to bottom)
        this.add.text(centerX, centerY + 275, '(Music/SFX Toggles: Main Menu)', { // Adjusted Y position DOWN and slightly reworded
            fontFamily: 'Arial', fontSize: 16, color: '#dddddd',
            stroke: '#000000', strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(1);

        // --- Main Menu Button (Text Only, Keyboard) ---
        this.add.text(centerX, centerY + 315, 'Main Menu (M)', { // Changed text
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffff00',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(1);

        // --- Add Keyboard Listeners for Restart and Main Menu ---
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

        // Use an update loop or timed check if needed, but keydown might suffice here
        this.input.keyboard.on('keydown-R', this.restartGame, this);
        this.input.keyboard.on('keydown-M', this.goToMainMenu, this);

        // --- Play Game Over Sounds ---
        // 1. Play the short 'game-over' SFX immediately (respecting SFX mute)
        if (!this.registry.get('sfxMuted')) {
            this.sound.play('game-over');
        }

        // 2. Stop any currently playing BGM (from Game scene, if not stopped in shutdown)
        this.sound.stopByKey('bgm');

        // 3. After a delay (e.g., 6 seconds now), start the main BGM (respecting music mute)
        const bgmDelay = 6000; // Delay in milliseconds (4s for game-over + 2s silence)
        this.bgmPlayTimer = this.time.delayedCall(bgmDelay, () => { // Store timer reference
            if (!this.registry.get('musicMuted')) {
                // Ensure it loops and set volume (adjust as needed)
                this.sound.play('bgm', { loop: true, volume: 0.4 });
            }
        }, [], this);
    }

    // --- High Score Display Logic --- (Positioning adjusted inside)
    async displayHighScores() {
        const apiUrl = 'https://highscore-api-ali-bot-service-iwcbnbmnlw.ap-southeast-1.fcapp.run/scores?limit=5';
        const centerX = this.cameras.main.centerX;
        const startY = this.cameras.main.centerY - 50; // Adjusted Y position UP
        const lineHeight = 35;

        // Set depth for title and list elements
        const textDepth = 2;

        this.add.text(centerX, startY, 'Top 5 Scores:', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(textDepth); // Ensure title is visible

        // Add loading indicator
        const loadingTextStyle = {
            fontFamily: 'Arial', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
            align: 'center'
        };
        const listY = startY + lineHeight; // Position list below title
        const loadingText = this.add.text(centerX, listY, 'Loading scores...', loadingTextStyle).setOrigin(0.5, 0).setDepth(textDepth);

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                loadingText.destroy(); // Remove loading text on error
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const scores = await response.json();

            loadingText.destroy(); // Remove loading text on success

            if (!scores || scores.length === 0) {
                this.add.text(centerX, listY, 'No scores yet!', { // Adjusted Y position based on listY
                    fontFamily: 'Arial', fontSize: 18, color: '#ffffff'
                }).setOrigin(0.5).setDepth(textDepth);
                return;
            }

            let scoreText = '';
            scores.forEach((score, index) => {
                const rank = index + 1;
                const initials = score.player_initials || '???';
                const points = score.score;
                scoreText += `${rank}. ${initials} - ${points}\n`;
            });

            this.add.text(centerX, listY, scoreText.trim(), { // Adjusted Y position based on listY
                fontFamily: 'Arial Black',
                fontSize: 24,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                lineSpacing: 8,
                align: 'center'
            }).setOrigin(0.5, 0).setDepth(textDepth); // Use origin 0.5, 0 for multi-line text block

        } catch (error) {
            if (loadingText && loadingText.active) {
                loadingText.destroy(); // Ensure loading text is removed on error
            }
            console.error('Error fetching high scores:', error);
            const listY = startY + lineHeight; // Position list below title
            this.add.text(centerX, listY, 'Could not load scores', { // Adjusted Y position based on listY
                fontFamily: 'Arial Black',
                fontSize: 24,
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(textDepth);
        }
    }
    // --- END High Score Display Logic ---

    async submitScore(score, initials) {
        const apiUrl = 'https://highscore-api-ali-bot-service-iwcbnbmnlw.ap-southeast-1.fcapp.run/scores'; // Append /scores path
        const payload = {
            initials: initials || 'AAA', // Use passed initials or fallback
            score: score
        };
        console.log('Submitting score payload:', payload);

        // --- Ensure status text exists before trying to update ---
        if (!this.submissionStatusText) {
            console.warn("Submission status text not found, skipping update.");
            // Attempt to fetch scores anyway, but skip status update
             try { await this.displayHighScores(); } catch(e) { console.error("Error displaying scores after failed status text lookup:", e); }
            return; // Exit if text object isn't ready
        }

        this.submissionStatusText.setText('Saving score...').setColor('#cccccc'); // Reset/Set initial status

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Handle non-2xx responses
                const errorData = await response.json().catch(() => ({ message: response.statusText })); // Attempt to parse error, fallback to status text
                console.error(`Error submitting score: ${response.status}`, errorData.message || 'Unknown error');
                // Optionally display a message to the user here
                this.submissionStatusText.setText('Error saving score').setColor('#ff0000'); // Update status on error

                // --- Fetch and display scores even if submission fails (optional) ---\
                this.displayHighScores();
            } else {
                const result = await response.json();
                console.log('Score submitted successfully:', result);
                this.submissionStatusText.setText('Score Saved!').setColor('#00ff00'); // Update status on success
                // Optionally display a success message or update UI

                // --- Now fetch and display scores AFTER successful submission ---
                this.displayHighScores();
            }
        } catch (error) {
            console.error('Network or other error submitting score:', error);
            this.submissionStatusText.setText('Network Error').setColor('#ff0000'); // Update status on network error
            // Optionally display a network error message to the user

             // --- Fetch and display scores even if submission fails (optional) ---\
             this.displayHighScores();
        }
    }

    // --- ADD Keyboard Handlers ---
    restartGame() {
        console.log("GameOver screen: Restarting game via R key...");
        this.cleanupListeners(); // Clean up before starting new scene
        this.scene.start('Game');
    }

    goToMainMenu() {
        console.log("GameOver screen: Returning to Main Menu via M key...");
        this.cleanupListeners(); // Clean up before starting new scene
        this.sound.stopByKey('bgm');
        this.scene.stop('GameOver'); // Stop this scene
        this.scene.start('MainMenu'); // Go to Main Menu
    }

    // Helper to remove listeners
    cleanupListeners() {
        this.input.keyboard.off('keydown-R', this.restartGame, this);
        this.input.keyboard.off('keydown-M', this.goToMainMenu, this);
    }

    // Add a shutdown method to ensure listeners are removed if scene is stopped externally
    shutdown() {
        console.log("GameOver scene shutdown.");
        // Ensure the delayed BGM timer is removed if we leave the scene before it fires
        if (this.bgmPlayTimer) {
            this.bgmPlayTimer.remove(false); // Pass false to prevent the callback from firing on removal
            console.log("Removed delayed BGM timer.");
        }
        // --- Stop BGM if it was playing ---
        this.sound.stopByKey('bgm');
        this.cleanupListeners();
    }

    // REMOVED Function to display score using number sprites
    /*
    updateScoreDisplay(newScore) {
        if (!this.scoreDigits) return; // Safety check

        this.scoreDigits.clear(true, true); // Remove old digits

        const scoreString = String(newScore).padStart(1, '0'); // Ensure at least one digit '0'
        const totalWidth = scoreString.length * NUMBER_SPRITE_WIDTH;
        const scoreX = this.cameras.main.centerX - (totalWidth / 2); // Center the score digits block
        const scoreY = this.cameras.main.centerY + 50; // Position below the center (adjust as needed)

        for (let i = 0; i < scoreString.length; i++) {
            const digitChar = scoreString[i];
            let frameIndex = parseInt(digitChar, 10); // '0' -> 0, '1' -> 1, etc.

            // Map digit to frame index (0-9 are frames 0-9 in numbers-red.png)
            if (isNaN(frameIndex) || frameIndex < 0 || frameIndex > 9) {
                 console.warn(`Invalid character in score: ${digitChar}`);
                 frameIndex = 0; // Default to frame '0' if invalid
            }

            const digitSprite = this.scoreDigits.create(
                scoreX + (i * NUMBER_SPRITE_WIDTH),
                scoreY,
                'numbers_red',
                frameIndex
            );
            // Setting origin to 0,0 for consistency as numbers are drawn from top-left
            digitSprite.setOrigin(0, 0).setScrollFactor(0);
        }
    }
    */
}
