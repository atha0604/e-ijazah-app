/*
 * UI SIMPLIFY CONTROLLER - Non-destructive animation/effect controller
 * Purpose: Toggle between original and simplified UI without code modification
 * Rollback: Remove this file to restore full functionality
 */

(function() {
    'use strict';

    const UISimplify = {
        // Configuration
        config: {
            enableSimplifiedMode: true,
            disableParticles: true,
            reduceAnimations: true,
            debugMode: false
        },

        // Initialize simplification
        init: function() {
            console.log('[UI-Simplify] Initializing non-destructive UI improvements...');

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.apply());
            } else {
                this.apply();
            }

            // Add toggle controls for testing
            this.addToggleControls();
        },

        // Apply simplifications
        apply: function() {
            const body = document.body;

            if (this.config.enableSimplifiedMode) {
                body.classList.add('simplified-ui');
                console.log('[UI-Simplify] Simplified mode activated');
            }

            if (this.config.disableParticles) {
                body.classList.add('no-particles');
                this.disableParticleAnimations();
                console.log('[UI-Simplify] Particle animations disabled');
            }

            if (this.config.reduceAnimations) {
                this.reduceMotionEffects();
                console.log('[UI-Simplify] Motion effects reduced');
            }

            if (this.config.debugMode) {
                body.classList.add('debug');
                console.log('[UI-Simplify] Debug mode enabled');
            }
        },

        // Disable particle animations safely
        disableParticleAnimations: function() {
            // Stop any existing particle animations
            const particles = document.querySelectorAll('.particle');
            particles.forEach(particle => {
                particle.style.animation = 'none';
                particle.style.display = 'none';
            });

            // Prevent new particles from being created
            if (window.createParticles) {
                window.createParticles = function() {
                    console.log('[UI-Simplify] Particle creation blocked');
                    return false;
                };
            }
        },

        // Reduce motion effects
        reduceMotionEffects: function() {
            // Override any CSS animations with reduced motion
            const style = document.createElement('style');
            style.textContent = `
                .simplified-ui * {
                    animation-duration: 0.1s !important;
                    transition-duration: 0.1s !important;
                }

                .simplified-ui *[class*="fade"],
                .simplified-ui *[class*="slide"],
                .simplified-ui *[class*="bounce"] {
                    animation: none !important;
                }
            `;
            document.head.appendChild(style);
        },

        // Add toggle controls for testing (removable)
        addToggleControls: function() {
            // Only add in development/testing
            if (window.location.hostname === 'localhost') {
                const togglePanel = document.createElement('div');
                togglePanel.innerHTML = `
                    <div style="position: fixed; top: 10px; right: 10px; background: white;
                                border: 1px solid #ccc; padding: 10px; border-radius: 4px;
                                font-size: 12px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <strong>UI Controls (DEV ONLY)</strong><br>
                        <label><input type="checkbox" id="toggle-simplified" ${this.config.enableSimplifiedMode ? 'checked' : ''}> Simplified UI</label><br>
                        <label><input type="checkbox" id="toggle-particles" ${this.config.disableParticles ? 'checked' : ''}> Disable Particles</label><br>
                        <label><input type="checkbox" id="toggle-animations" ${this.config.reduceAnimations ? 'checked' : ''}> Reduce Animations</label><br>
                        <button id="reload-ui" style="margin-top: 5px; padding: 2px 8px;">Apply</button>
                    </div>
                `;
                document.body.appendChild(togglePanel);

                // Add event listeners
                document.getElementById('reload-ui').addEventListener('click', () => {
                    this.config.enableSimplifiedMode = document.getElementById('toggle-simplified').checked;
                    this.config.disableParticles = document.getElementById('toggle-particles').checked;
                    this.config.reduceAnimations = document.getElementById('toggle-animations').checked;

                    // Remove current classes
                    document.body.classList.remove('simplified-ui', 'no-particles', 'debug');

                    // Reapply with new config
                    this.apply();
                });
            }
        },

        // Rollback function (restore original)
        rollback: function() {
            console.log('[UI-Simplify] Rolling back to original design...');

            const body = document.body;
            body.classList.remove('simplified-ui', 'no-particles', 'debug');

            // Remove any injected styles
            const injectedStyles = document.querySelectorAll('style[data-ui-simplify]');
            injectedStyles.forEach(style => style.remove());

            // Restore particle animations if they exist
            if (window.originalCreateParticles) {
                window.createParticles = window.originalCreateParticles;
            }

            console.log('[UI-Simplify] Rollback completed');
        }
    };

    // Auto-initialize
    UISimplify.init();

    // Make available globally for manual control
    window.UISimplify = UISimplify;

    console.log('[UI-Simplify] Loaded successfully. Use UISimplify.rollback() to restore original design.');

})();