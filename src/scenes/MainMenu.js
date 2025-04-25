import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
        // REMOVE properties related to DOM input
        // this.initialsInputContainer = null;
        // this.confirmButtonHandler = null;
    }

    create ()
    {
        this.add.image(512, 384, 'background');

        // --- ADD Sound Toggle Buttons ---
        this.createSoundToggles();

        // --- Generate/Retrieve Initials using Session Storage ---
        let playerInitials = sessionStorage.getItem('playerInitials');
        if (!playerInitials) {
            console.log('No initials found in sessionStorage. Generating new ones.');
            // Default to 'AAA' instead of random initials
            playerInitials = 'AAA';
            sessionStorage.setItem('playerInitials', playerInitials);
        } else {
            console.log(`Found initials in sessionStorage: ${playerInitials}`);
        }

        // Store the determined initials in the registry for other scenes
        console.log(`Using initials: ${playerInitials}`);
        this.registry.set('playerInitials', playerInitials);

        // --- Logo Float ---
        const logoY = 240; // Lower starting position
        const logo = this.add.image(512, logoY, 'logo').setScale(0.8); // Make smaller
        this.tweens.add({
            targets: logo,
            y: logoY - 10, // Float slightly above new starting position
            duration: 2000, // Duration of one way (seconds)
            ease: 'Sine.easeInOut', // Smooth easing
            yoyo: true, // Animate back and forth
            repeat: -1 // Repeat indefinitely
        });

        // --- SHARED TOP Y FOR ALIGNMENT ---
        const sharedTopY = 420;
        const centerX = 512;
        const controlsX = 200;
        const scoresX = 850;

        // Controls (left)
        this.add.text(
          controlsX, sharedTopY,
          'Capture Flags!\nDestroy Robots!\n\nMove: WASD/Arrows\nShoot: Left Mouse Click\nRPG: R\nPause: P/ESC\nMusic: M\nSFX: F',
          {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'left',
            lineSpacing: 5
          }
        ).setOrigin(0.5, 0); // align top

        // Initials label (center)
        this.add.text(
          centerX, sharedTopY,
          'YOUR INITIALS:',
          {
            fontFamily: 'Arial Black',
            fontSize: 25,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
          }
        ).setOrigin(0.5, 0); // align top

        // Initialize currentInitials from playerInitials
        this.currentInitials = playerInitials.split('');
        this.selectedLetterIndex = 0; // Currently selected letter position (0-2)

        // Place initials letters BELOW the label
        const initialsLettersY = sharedTopY + 50;
        const letterSpacing = 35;
        this.initialLetters = [];
        for (let i = 0; i < 3; i++) {
            const letterX = centerX + (i * letterSpacing) - letterSpacing;
            const letterBg = this.add.rectangle(letterX, initialsLettersY, 30, 35, 0x333333)
                .setOrigin(0.5);
            const letterText = this.add.text(letterX, initialsLettersY, this.currentInitials[i], {
                fontFamily: 'Arial Black',
                fontSize: 28,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            this.initialLetters.push({
                background: letterBg,
                text: letterText,
                index: i
            });
        }
        // Keyboard controls instruction below initials
        this.add.text(centerX, initialsLettersY + 35, 'Press < > to select, ↑↓ to change', {
            fontFamily: 'Arial',
            fontSize: 14,
            color: '#dddddd',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0);

        // Add keyboard controls for modifying initials
        this.input.keyboard.on('keydown-LEFT', this.selectPreviousLetter, this);
        this.input.keyboard.on('keydown-RIGHT', this.selectNextLetter, this);
        this.input.keyboard.on('keydown-UP', this.cyclePreviousLetter, this);
        this.input.keyboard.on('keydown-DOWN', this.cycleNextLetter, this);

        // Highlight the initially selected letter
        this.highlightSelectedLetter();

        // High Scores (right)
        this.displayHighScores = async () => {
            const apiUrl = 'https://highscore-api-ali-bot-service-iwcbnbmnlw.ap-southeast-1.fcapp.run/scores?limit=5';
            const playerInitials = this.registry.get('playerInitials') || '???';
            const listX = scoresX;
            const startY = sharedTopY;
            const lineHeight = 30;
            this.add.text(
              listX, startY,
              `Top 5 Scores:\n(You: ${playerInitials})`,
              {
                fontFamily: 'Arial Black',
                fontSize: 22,
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 5
              }
            ).setOrigin(0.5, 0);
            const loadingTextStyle = {
                fontFamily: 'Arial Black',
                fontSize: 18,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            };
            const loadingText = this.add.text(listX, startY + 2 * lineHeight, 'Loading scores...', loadingTextStyle).setOrigin(0.5, 0);
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    loadingText.destroy();
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const scores = await response.json();
                loadingText.destroy();
                const listStartY = startY + 2 * lineHeight + 10;
                if (!scores || scores.length === 0) {
                    this.add.text(listX, listStartY, 'No scores yet!', {
                        fontFamily: 'Arial Black',
                        fontSize: 18,
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 4
                    }).setOrigin(0.5, 0);
                    return;
                }
                let scoreText = '';
                scores.forEach((score, index) => {
                    const rank = index + 1;
                    const initials = score.player_initials || '???';
                    const points = score.score;
                    scoreText += `${rank}. ${initials.padEnd(4)} ${String(points).padStart(7, ' ')}\n`;
                });
                this.add.text(listX, listStartY, scoreText.trim(), {
                    fontFamily: 'Arial Black',
                    fontSize: 18,
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4,
                    lineSpacing: 8
                }).setOrigin(0.5, 0);
            } catch (error) {
                if (loadingText && loadingText.active) {
                    loadingText.destroy();
                }
                const listStartY = startY + 2 * lineHeight;
                this.add.text(listX, listStartY, 'Could not load scores', {
                    fontFamily: 'Arial Black',
                    fontSize: 18,
                    color: '#ff0000',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5, 0);
            }
        };
        this.displayHighScores();

        // --- NEW POSITION: Start Prompt (Top Left) ---
        const startPromptX = 80;
        const startPromptY = 80;
        
        // Create box background
        this.add.rectangle(startPromptX, startPromptY, 105, 90, 0x000000, 0.5)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffff00);
            
        // Create multi-line text for "Press Enter to start"
        this.startPromptText = this.add.text(startPromptX, startPromptY, 'Press\nEnter\nto start', {
            fontFamily: 'Arial Black', // Changed to Arial Black for consistency
            fontSize: 18, 
            fontWeight: 'bold',
            color: '#ffff00',
            stroke: '#000000', 
            strokeThickness: 4, // Increased stroke thickness
            align: 'left',
            lineSpacing: 5
        }).setOrigin(0.5);

        // Add pulse effect to the text
        this.tweens.add({
            targets: this.startPromptText,
            scale: 1.05, // Slightly larger scale for glow
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // --- ADD Keyboard listeners for Mute Toggles ---
        this.input.keyboard.on('keydown-M', this.toggleMusicMute, this);
        this.input.keyboard.on('keydown-F', this.toggleSfxMute, this);

        // --- DEBUG: Go directly to GameOver scene ---
        /* Developer mode - commented out for production
        this.input.keyboard.on('keydown-G', () => {
            console.log('DEBUG: Jumping directly to GameOver scene...');
            const debugScore = 100;
            const playerInitials = this.registry.get('playerInitials') || 'DBG'; // Use registry initials or fallback
            this.scene.start('GameOver', { score: debugScore, initials: playerInitials });
        });
        */
        
        // --- Define startGame function ---
        const startGame = () => {
            console.log(`Starting game with initials from registry: ${this.registry.get('playerInitials')}`);

            // --- Play Start Game Sound ---
            if (!this.registry.get('sfxMuted')) {
                this.sound.play('sfx_game_start');
            }

            // --- Start BGM only if not muted AND not already playing ---
            const musicMuted = this.registry.get('musicMuted');
            const bgm = this.sound.get('bgm'); // Get existing instance if any

            if (!musicMuted) {
                 // Try to play only if the context is running AND (no instance exists OR the existing one isn't playing)
                 if (this.sound.context.state === 'running') {
                     if (!bgm || !bgm.isPlaying) {
                        // Use this.sound.play which should handle creating/retrieving
                        const existingBgm = this.sound.get('bgm');
                        if (!existingBgm || !existingBgm.isPlaying) {
                            this.sound.play('bgm', { loop: true, volume: 0.4 });
                        }
                     }
                 } else {
                     // Context suspended, try to resume and play
                     this.sound.context.resume().then(() => {
                        // Double check mute state and play state after resume
                        if (!this.registry.get('musicMuted')) {
                            const currentBgm = this.sound.get('bgm');
                            if (!currentBgm || !currentBgm.isPlaying) {
                                this.sound.play('bgm', { loop: true, volume: 0.4 });
                            }
                        }
                     }).catch(e => console.error('[DEBUG BGM] Error resuming context on game start:', e));
                 }
            } else {
                // Explicitly stop if it somehow was playing
                if (bgm && bgm.isPlaying) {
                    bgm.stop();
                }
            }

            // --- Clean up listeners before starting ---
            this.input.keyboard.off('keydown-ENTER', startGame);

            this.scene.start('Game');
        };

        // --- Add ENTER key handler for starting the game ---
        this.input.keyboard.once('keydown-ENTER', startGame);
    }

    createSoundToggles() {
        const startX = 980; // Position icons further top-right
        const startY = 50;
        const lineHeight = 30;

        // --- Music Icon Toggle ---
        const initialMusicIcon = this.registry.get('musicMuted') ? 'icon-music-off' : 'icon-music-on';
        this.musicToggleIcon = this.add.image(startX, startY, initialMusicIcon)
            .setScale(1.5)
            .setOrigin(1, 0.5) // Align to right edge, vertically centered
            .setInteractive({ useHandCursor: true });
        this.musicToggleIcon.on('pointerdown', this.toggleMusicMute, this);

        // --- SFX Icon Toggle ---
        const initialSfxIcon = this.registry.get('sfxMuted') ? 'icon-sfx-off' : 'icon-sfx-on';
        this.sfxToggleIcon = this.add.image(startX, startY + this.musicToggleIcon.displayHeight + 10, initialSfxIcon) // Position below music icon with padding
            .setScale(1.5)
            .setOrigin(1, 0.5) // Align to right edge, vertically centered
            .setInteractive({ useHandCursor: true });
        this.sfxToggleIcon.on('pointerdown', this.toggleSfxMute, this);
    }

    updateMusicIcon() {
        if (!this.musicToggleIcon || !this.musicToggleIcon.active) return; // Guard
        const isMuted = this.registry.get('musicMuted');
        this.musicToggleIcon.setTexture(isMuted ? 'icon-music-off' : 'icon-music-on');
    }

    updateSfxIcon() {
        if (!this.sfxToggleIcon || !this.sfxToggleIcon.active) return; // Guard
        const isMuted = this.registry.get('sfxMuted');
        this.sfxToggleIcon.setTexture(isMuted ? 'icon-sfx-off' : 'icon-sfx-on');
    }

    applyMusicMuteState() {
        const isMuted = this.registry.get('musicMuted');
        // Always try to get the current instance
        const bgm = this.sound.get('bgm');

        console.log(`[DEBUG BGM Apply] Mute state: ${isMuted}, BGM instance found: ${!!bgm}, Is playing: ${bgm?.isPlaying}`);

        if (isMuted) {
            // Mute request
            if (bgm && bgm.isPlaying) {
                bgm.stop();
                // console.log("[DEBUG BGM Apply] Music STOPPED via toggle.");
            } else {
                // console.log("[DEBUG BGM Apply] Music already stopped or not found (Mute request).");
            }
        } else {
            // Unmute request
            if (this.sound.context.state === 'suspended') {
                 // console.log("[DEBUG BGM Apply] Audio context suspended, attempting resume (Unmute).");
                  this.sound.context.resume().then(() => {
                    // console.log('[DEBUG BGM Apply] AudioContext resumed via unmute.');
                    // Check mute state AGAIN after resume, as it might have changed
                    if (!this.registry.get('musicMuted')) {
                         // Re-fetch instance after resume, just in case
                         const currentBgm = this.sound.get('bgm');
                         if (currentBgm) {
                            if (!currentBgm.isPlaying) {
                                currentBgm.play(); // Should resume if stopped/paused
                                // console.log("[DEBUG BGM Apply] Resumed existing BGM after context resume.");
                            } else {
                                // console.log("[DEBUG BGM Apply] Existing BGM already playing after context resume.");
                            }
                         } else {
                            // No instance exists, play fresh
                            this.sound.play('bgm', { loop: true, volume: 0.4 });
                            // console.log("[DEBUG BGM Apply] Played BGM for first time after context resume.");
                         }
                    } else {
                        // console.log('[DEBUG BGM Apply] Music was muted again before context finished resuming.');
                    }
                 }).catch(e => console.error('[DEBUG BGM Apply] Error resuming context via unmute:', e));
            } else {
                 // Context is running
                 const currentBgm = this.sound.get('bgm');
                 if (currentBgm) {
                     if (!currentBgm.isPlaying) {
                         currentBgm.play(); // Resume
                         // console.log("[DEBUG BGM Apply] Resumed existing BGM (Context running).");
                     } else {
                         // console.log("[DEBUG BGM Apply] Existing BGM already playing (Context running).");
                     }
                 } else {
                     // No instance exists, play fresh
                     this.sound.play('bgm', { loop: true, volume: 0.4 });
                     // console.log("[DEBUG BGM Apply] Played BGM for first time (Context running).");
                 }
            }
        }
    }

    // --- ADD Keyboard Handlers for Mute Toggles ---
    toggleMusicMute() {
        console.log("'M' key pressed - toggling music");
        const currentMuteState = this.registry.get('musicMuted');
        this.registry.set('musicMuted', !currentMuteState);
        this.updateMusicIcon();
        this.applyMusicMuteState();
    }

    toggleSfxMute() {
        console.log("'F' key pressed - toggling SFX");
        const currentMuteState = this.registry.get('sfxMuted');
        this.registry.set('sfxMuted', !currentMuteState);
        this.updateSfxIcon();
        // No immediate action needed here, applied when SFX are played
    }

    shutdown() {
        console.log('MainMenu shutdown called.');

        // --- Clean up keyboard listeners ---
        this.input.keyboard.off('keydown-M', this.toggleMusicMute, this);
        this.input.keyboard.off('keydown-F', this.toggleSfxMute, this);
        this.input.keyboard.off('keydown-G'); // Clean up debug listener
        
        // Clean up initials keyboard controls
        this.input.keyboard.off('keydown-LEFT', this.selectPreviousLetter, this);
        this.input.keyboard.off('keydown-RIGHT', this.selectNextLetter, this);
        this.input.keyboard.off('keydown-UP', this.cyclePreviousLetter, this);
        this.input.keyboard.off('keydown-DOWN', this.cycleNextLetter, this);
    }

    highlightSelectedLetter() {
        // Highlight the selected letter
        this.tweens.add({
            targets: this.initialLetters[this.selectedLetterIndex].background,
            fillColor: 0xffff00, // Yellow flash
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.initialLetters[this.selectedLetterIndex].background.fillColor = 0x333333; // Return to original color
            }
        });
        
        // Play sound effect if not muted
        if (!this.registry.get('sfxMuted')) {
            // Use a sound we know exists, like 'select' or 'click' if available
            // Otherwise, handle potential missing sound
            const soundKey = 'explode'; // Use a sound we know exists
            if (this.sound.get(soundKey)) {
                this.sound.play(soundKey, { volume: 0.2 }); // Play at lower volume
            }
        }
    }

    selectPreviousLetter() {
        this.selectedLetterIndex = (this.selectedLetterIndex - 1 + 3) % 3;
        this.highlightSelectedLetter();
        // --- Play Sound ---
        if (!this.registry.get('sfxMuted')) {
            this.sound.play('sfx_menu_button');
        }
    }

    selectNextLetter() {
        this.selectedLetterIndex = (this.selectedLetterIndex + 1) % 3;
        this.highlightSelectedLetter();
        // --- Play Sound ---
        if (!this.registry.get('sfxMuted')) {
            this.sound.play('sfx_menu_button');
        }
    }

    cyclePreviousLetter() {
        const currentLetterCode = this.currentInitials[this.selectedLetterIndex].charCodeAt(0);
        let nextLetterCode = currentLetterCode - 1;
        if (nextLetterCode < 'A'.charCodeAt(0)) {
            nextLetterCode = 'Z'.charCodeAt(0);
        }
        this.currentInitials[this.selectedLetterIndex] = String.fromCharCode(nextLetterCode);
        this.initialLetters[this.selectedLetterIndex].text.setText(this.currentInitials[this.selectedLetterIndex]);
        this.saveInitials(); // Save immediately on change
        // --- Play Sound ---
        if (!this.registry.get('sfxMuted')) {
            this.sound.play('sfx_menu_button');
        }
    }

    cycleNextLetter() {
        const currentLetterCode = this.currentInitials[this.selectedLetterIndex].charCodeAt(0);
        let nextLetterCode = currentLetterCode + 1;
        if (nextLetterCode > 'Z'.charCodeAt(0)) {
            nextLetterCode = 'A'.charCodeAt(0);
        }
        this.currentInitials[this.selectedLetterIndex] = String.fromCharCode(nextLetterCode);
        this.initialLetters[this.selectedLetterIndex].text.setText(this.currentInitials[this.selectedLetterIndex]);
        this.saveInitials(); // Save immediately on change
        // --- Play Sound ---
        if (!this.registry.get('sfxMuted')) {
            this.sound.play('sfx_menu_button');
        }
    }

    // Add a method to save initials
    saveInitials() {
        const newInitials = this.currentInitials.join('');
        sessionStorage.setItem('playerInitials', newInitials);
        this.registry.set('playerInitials', newInitials);
        console.log(`Auto-saved initials: ${newInitials}`);
    }
}
