/*
 * COMPONENT LOADER - Non-destructive modular HTML system
 * Purpose: Load HTML components dynamically without touching original code
 * Rollback: Remove this file and components/ folder to restore monolith
 */

(function() {
    'use strict';

    const ComponentLoader = {
        // Configuration
        config: {
            componentBasePath: '/components/',
            fallbackEnabled: true,
            debugMode: false,
            cacheComponents: true
        },

        // Component cache
        cache: new Map(),

        // Initialize component loading system
        init: function() {
            console.log('[ComponentLoader] Initializing modular component system...');
            this.addDebugControls();
        },

        // Load a component into target element
        async loadComponent(componentName, targetSelector) {
            try {
                const target = document.querySelector(targetSelector);
                if (!target) {
                    console.warn(`[ComponentLoader] Target element not found: ${targetSelector}`);
                    return false;
                }

                // Check cache first
                let html;
                if (this.config.cacheComponents && this.cache.has(componentName)) {
                    html = this.cache.get(componentName);
                    if (this.config.debugMode) {
                        console.log(`[ComponentLoader] Loading ${componentName} from cache`);
                    }
                } else {
                    // Fetch component
                    const response = await fetch(`${this.config.componentBasePath}${componentName}.html`);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    html = await response.text();

                    // Cache it
                    if (this.config.cacheComponents) {
                        this.cache.set(componentName, html);
                    }

                    if (this.config.debugMode) {
                        console.log(`[ComponentLoader] Loaded ${componentName} from server`);
                    }
                }

                // Insert HTML
                target.innerHTML = html;

                // Trigger custom event for component loaded
                target.dispatchEvent(new CustomEvent('componentLoaded', {
                    detail: { componentName, target: targetSelector }
                }));

                return true;

            } catch (error) {
                console.error(`[ComponentLoader] Failed to load component ${componentName}:`, error);

                if (this.config.fallbackEnabled) {
                    return this.handleFallback(componentName, targetSelector);
                }

                return false;
            }
        },

        // Handle fallback when component loading fails
        handleFallback(componentName, targetSelector) {
            console.log(`[ComponentLoader] Using fallback for ${componentName}`);

            const target = document.querySelector(targetSelector);
            if (target) {
                target.innerHTML = `
                    <div class="component-fallback" style="padding: 20px; border: 1px dashed #ccc; margin: 10px;">
                        <p><strong>Component Loading Failed:</strong> ${componentName}</p>
                        <p><em>Fallback: Using original monolithic structure</em></p>
                        <button onclick="ComponentLoader.retryLoad('${componentName}', '${targetSelector}')">Retry</button>
                    </div>
                `;
            }

            return false;
        },

        // Retry loading a component
        async retryLoad(componentName, targetSelector) {
            console.log(`[ComponentLoader] Retrying ${componentName}...`);
            // Clear cache for this component
            this.cache.delete(componentName);
            return await this.loadComponent(componentName, targetSelector);
        },

        // Load multiple components
        async loadComponents(components) {
            const promises = components.map(({ name, target }) =>
                this.loadComponent(name, target)
            );

            const results = await Promise.allSettled(promises);

            const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
            const failed = results.length - successful;

            console.log(`[ComponentLoader] Loaded ${successful}/${results.length} components`);

            if (failed > 0) {
                console.warn(`[ComponentLoader] ${failed} components failed to load`);
            }

            return { successful, failed, total: results.length };
        },

        // Clear component cache
        clearCache: function() {
            this.cache.clear();
            console.log('[ComponentLoader] Cache cleared');
        },

        // Get cache statistics
        getCacheStats: function() {
            return {
                size: this.cache.size,
                components: Array.from(this.cache.keys())
            };
        },

        // Add debug controls (only in development)
        addDebugControls: function() {
            if (window.location.hostname === 'localhost' && this.config.debugMode) {
                const debugPanel = document.createElement('div');
                debugPanel.innerHTML = `
                    <div style="position: fixed; top: 60px; right: 10px; background: white;
                                border: 1px solid #ccc; padding: 10px; border-radius: 4px;
                                font-size: 11px; z-index: 10001; max-width: 200px;">
                        <strong>Component Loader</strong><br>
                        <div id="component-stats">Components: 0 cached</div>
                        <button onclick="ComponentLoader.clearCache()">Clear Cache</button>
                        <button onclick="ComponentLoader.reloadPage()">Reload All</button>
                    </div>
                `;
                document.body.appendChild(debugPanel);

                // Update stats periodically
                setInterval(() => {
                    const stats = this.getCacheStats();
                    const statsEl = document.getElementById('component-stats');
                    if (statsEl) {
                        statsEl.textContent = `Components: ${stats.size} cached`;
                    }
                }, 2000);
            }
        },

        // Reload entire page (for testing)
        reloadPage: function() {
            window.location.reload();
        },

        // Check if modular system is supported
        isSupported: function() {
            return 'fetch' in window && 'Promise' in window && 'Map' in window;
        }
    };

    // Auto-initialize
    if (ComponentLoader.isSupported()) {
        ComponentLoader.init();

        // Make available globally
        window.ComponentLoader = ComponentLoader;

        console.log('[ComponentLoader] System ready. Available methods:', Object.keys(ComponentLoader));
    } else {
        console.warn('[ComponentLoader] Browser not supported, falling back to monolithic structure');
    }

})();