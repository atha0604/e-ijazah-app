// Utility functions untuk keamanan aplikasi
const SecurityUtils = {
    // Validasi input untuk mencegah XSS
    sanitizeInput: function(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    // Validasi NISN (10 digit angka)
    validateNISN: function(nisn) {
        const nisnRegex = /^\d{10}$/;
        return nisnRegex.test(nisn);
    },

    // Validasi NIS (maksimal 20 karakter alphanumerik)
    validateNIS: function(nis) {
        const nisRegex = /^[a-zA-Z0-9]{1,20}$/;
        return nisRegex.test(nis);
    },

    // Validasi nama (hanya huruf, spasi, dan tanda hubung)
    validateName: function(name) {
        const nameRegex = /^[a-zA-Z\s\-\.]+$/;
        return nameRegex.test(name) && name.trim().length >= 2;
    },

    // Validasi nilai (0-100)
    validateGrade: function(grade) {
        const numGrade = parseFloat(grade);
        return !isNaN(numGrade) && numGrade >= 0 && numGrade <= 100;
    },

    // Rate limiting untuk mencegah spam
    rateLimiter: {
        attempts: {},
        
        isAllowed: function(key, maxAttempts = 5, windowMs = 60000) {
            const now = Date.now();
            
            if (!this.attempts[key]) {
                this.attempts[key] = [];
            }
            
            // Bersihkan attempts yang sudah expired
            this.attempts[key] = this.attempts[key].filter(time => now - time < windowMs);
            
            if (this.attempts[key].length >= maxAttempts) {
                return false;
            }
            
            this.attempts[key].push(now);
            return true;
        }
    },

    // Enkripsi sederhana untuk data sensitif
    simpleEncrypt: function(text, key = 'e-ijazah-2024') {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return btoa(result);
    },

    // Dekripsi
    simpleDecrypt: function(encrypted, key = 'e-ijazah-2024') {
        try {
            const decoded = atob(encrypted);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(
                    decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            return result;
        } catch (e) {
            return null;
        }
    },

    // Log aktivitas untuk audit trail
    logActivity: function(action, details = '') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: this.sanitizeInput(action),
            details: this.sanitizeInput(details),
            user: currentUser?.schoolData?.[0] || 'unknown',
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        // Simpan ke localStorage dengan rotation (max 100 entries)
        let activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
        activityLog.push(logEntry);
        
        // Keep only last 100 entries
        if (activityLog.length > 100) {
            activityLog = activityLog.slice(-100);
        }
        
        localStorage.setItem('activityLog', JSON.stringify(activityLog));
    },

    // Deteksi session hijacking sederhana
    validateSession: function() {
        const storedSession = localStorage.getItem('currentUserSession');
        if (!storedSession) return false;
        
        try {
            const session = JSON.parse(storedSession);
            const sessionAge = Date.now() - (session.loginTime || 0);
            
            // Session expired after 24 hours
            if (sessionAge > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('currentUserSession');
                return false;
            }
            
            return true;
        } catch (e) {
            localStorage.removeItem('currentUserSession');
            return false;
        }
    }
};

// Export untuk digunakan di script utama
window.SecurityUtils = SecurityUtils;