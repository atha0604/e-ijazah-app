// Monitor performa dan optimisasi aplikasi
const PerformanceMonitor = {
    metrics: {
        loadTimes: [],
        renderTimes: [],
        memoryUsage: [],
        errors: []
    },

    // Inisialisasi monitoring
    init: function() {
        console.log('Performance Monitor initialized');
        this.startMonitoring();
        this.setupErrorHandling();
        this.monitorMemoryUsage();
    },

    // Mulai monitoring performa
    startMonitoring: function() {
        // Monitor page load time
        window.addEventListener('load', () => {
            // Use newer Performance API
            const perfEntries = performance.getEntriesByType('navigation');
            if (perfEntries.length > 0) {
                const loadTime = perfEntries[0].loadEventEnd - perfEntries[0].startTime;
                if (loadTime > 0) {
                    this.recordLoadTime(loadTime);
                }
            } else {
                // Fallback with validation
                const timing = performance.timing;
                if (timing.loadEventEnd > 0 && timing.navigationStart > 0) {
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    if (loadTime > 0 && loadTime < 30000) { // Max 30 seconds reasonable
                        this.recordLoadTime(loadTime);
                    }
                }
            }
        });

        // Monitor render times
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.measureRenderPerformance());
        }
    },

    // Setup error handling
    setupErrorHandling: function() {
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: new Date().toISOString()
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                timestamp: new Date().toISOString()
            });
        });
    },

    // Monitor penggunaan memory
    monitorMemoryUsage: function() {
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
                
                this.metrics.memoryUsage.push(memInfo);
                
                // Keep only last 50 measurements
                if (this.metrics.memoryUsage.length > 50) {
                    this.metrics.memoryUsage.shift();
                }
                
                // Alert jika memory usage tinggi
                const usagePercent = (memInfo.used / memInfo.limit) * 100;
                if (usagePercent > 80) {
                    console.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
                    this.optimizeMemory();
                }
            }, 30000); // Check every 30 seconds
        }
    },

    // Record load time
    recordLoadTime: function(loadTime) {
        this.metrics.loadTimes.push({
            time: loadTime,
            timestamp: Date.now()
        });

        // Keep only last 20 measurements
        if (this.metrics.loadTimes.length > 20) {
            this.metrics.loadTimes.shift();
        }

        console.log(`Page load time: ${loadTime}ms`);
    },

    // Measure render performance
    measureRenderPerformance: function() {
        const start = performance.now();
        
        // Trigger a small render operation
        requestAnimationFrame(() => {
            const renderTime = performance.now() - start;
            
            this.metrics.renderTimes.push({
                time: renderTime,
                timestamp: Date.now()
            });

            if (this.metrics.renderTimes.length > 50) {
                this.metrics.renderTimes.shift();
            }
        });
    },

    // Record error
    recordError: function(error) {
        this.metrics.errors.push(error);
        
        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
            this.metrics.errors.shift();
        }
        
        console.error('Error recorded:', error);
        
        // Log to activity log if SecurityUtils is available
        if (window.SecurityUtils) {
            SecurityUtils.logActivity('ERROR_OCCURRED', error.message);
        }
    },

    // Optimisasi memory
    optimizeMemory: function() {
        console.log('Running memory optimization...');
        
        // Clear old data dari database
        if (window.database) {
            // Clear cache yang mungkin ada
            if (database.cache) {
                database.cache = {};
            }
        }
        
        // Clear old metrics
        this.metrics.loadTimes = this.metrics.loadTimes.slice(-10);
        this.metrics.renderTimes = this.metrics.renderTimes.slice(-25);
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-25);
        this.metrics.errors = this.metrics.errors.slice(-50);
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log('Memory optimization completed');
    },

    // Dapatkan laporan performa
    getPerformanceReport: function() {
        const avgLoadTime = this.metrics.loadTimes.length > 0 
            ? this.metrics.loadTimes.reduce((sum, item) => sum + item.time, 0) / this.metrics.loadTimes.length
            : 0;
            
        const avgRenderTime = this.metrics.renderTimes.length > 0
            ? this.metrics.renderTimes.reduce((sum, item) => sum + item.time, 0) / this.metrics.renderTimes.length
            : 0;
            
        const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        
        return {
            loadTime: {
                average: Math.round(avgLoadTime),
                latest: this.metrics.loadTimes[this.metrics.loadTimes.length - 1]?.time || 0,
                count: this.metrics.loadTimes.length
            },
            renderTime: {
                average: Math.round(avgRenderTime * 100) / 100,
                count: this.metrics.renderTimes.length
            },
            memory: latestMemory ? {
                used: Math.round(latestMemory.used / 1024 / 1024), // MB
                total: Math.round(latestMemory.total / 1024 / 1024), // MB
                usagePercent: Math.round((latestMemory.used / latestMemory.limit) * 100)
            } : null,
            errors: {
                total: this.metrics.errors.length,
                recent: this.metrics.errors.slice(-5)
            }
        };
    },

    // Deteksi bottleneck
    detectBottlenecks: function() {
        const report = this.getPerformanceReport();
        const issues = [];
        
        if (report.loadTime.average > 3000) {
            issues.push({
                type: 'slow_load',
                message: `Waktu loading lambat: ${report.loadTime.average}ms`,
                severity: 'warning'
            });
        }
        
        if (report.memory && report.memory.usagePercent > 70) {
            issues.push({
                type: 'high_memory',
                message: `Penggunaan memory tinggi: ${report.memory.usagePercent}%`,
                severity: report.memory.usagePercent > 85 ? 'critical' : 'warning'
            });
        }
        
        if (report.errors.total > 10) {
            issues.push({
                type: 'frequent_errors',
                message: `Terlalu banyak error: ${report.errors.total}`,
                severity: 'critical'
            });
        }
        
        return issues;
    },

    // Optimisasi DOM
    optimizeDOM: function() {
        // Remove unused elements
        const unusedElements = document.querySelectorAll('[style*="display: none"]:not([id])');
        unusedElements.forEach(el => {
            if (!el.classList.contains('modal') && !el.id) {
                el.remove();
            }
        });
        
        // Optimize images
        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            if (!img.loading) {
                img.loading = 'lazy';
            }
        });
        
        console.log(`DOM optimized: removed ${unusedElements.length} unused elements`);
    },

    // Export performance data
    exportPerformanceData: function() {
        const data = {
            timestamp: new Date().toISOString(),
            report: this.getPerformanceReport(),
            bottlenecks: this.detectBottlenecks(),
            userAgent: navigator.userAgent,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            } : null
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `performance-report-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (window.showNotification) {
            showNotification('Laporan performa berhasil diunduh!', 'success');
        }
    }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
    PerformanceMonitor.init();
});

window.PerformanceMonitor = PerformanceMonitor;