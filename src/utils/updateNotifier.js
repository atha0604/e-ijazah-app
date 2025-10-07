// Update Notification System - In-App notification (No Email)
// Simplified version focusing on in-app notifications only

class UpdateNotifier {
    constructor() {
        this.updateData = null;
        this.broadcastHistory = [];
    }

    // Set update information
    setUpdateInfo(updateData) {
        this.updateData = updateData;
    }

    // Generate update message content
    generateUpdateMessage(format = 'text') {
        if (!this.updateData) return '';

        const { version, releaseDate, type, features, bugfixes } = this.updateData;

        if (format === 'html') {
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #4caf50, #45a049); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">🎉 Update Aplikasi E-Ijazah v${version}</h1>
                        <p style="margin: 10px 0 0 0;">Versi terbaru sudah tersedia!</p>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h2 style="color: #333; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">📋 Apa yang Baru?</h2>

                        <div style="margin: 20px 0;">
                            <h3 style="color: #4caf50;">✨ Fitur Baru:</h3>
                            <ul style="color: #555;">
                                ${features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                        </div>

                        <div style="margin: 20px 0;">
                            <h3 style="color: #ff9800;">🔧 Perbaikan:</h3>
                            <ul style="color: #555;">
                                ${bugfixes.map(fix => `<li>${fix}</li>`).join('')}
                            </ul>
                        </div>

                        <div style="margin: 30px 0; text-align: center;">
                            <a href="https://nilai-e-ijazah.koyeb.app"
                               style="background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                🌐 Akses Aplikasi Sekarang
                            </a>
                        </div>

                        <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3;">
                            <p style="margin: 0; color: #333;">
                                <strong>📱 Mode Aplikasi:</strong><br>
                                • Web: Otomatis ter-update<br>
                                • Desktop: <a href="https://github.com/atha0604/e-ijazah-app/releases/latest">Download versi terbaru</a>
                            </p>
                        </div>
                    </div>

                    <div style="padding: 20px; text-align: center; background: #333; color: white;">
                        <p style="margin: 0;">Aplikasi Nilai E-Ijazah - Sistem Pengelolaan Nilai Modern</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">Tim Pengembang E-Ijazah</p>
                    </div>
                </div>
            `;
        }

        // Text format untuk WhatsApp/SMS
        return `
🎉 *UPDATE APLIKASI E-IJAZAH v${version}*

📅 Tanggal Rilis: ${this.formatDate(releaseDate)}
🆕 Tipe Update: ${this.getUpdateTypeLabel(type)}

✨ *FITUR BARU:*
${features.map(feature => `• ${feature}`).join('\n')}

🔧 *PERBAIKAN:*
${bugfixes.map(fix => `• ${fix}`).join('\n')}

🌐 *CARA MENGAKSES:*
• Web: https://nilai-e-ijazah.koyeb.app (otomatis update)
• Desktop: Download di GitHub Releases

📱 Update ini akan meningkatkan performa dan pengalaman penggunaan aplikasi.

---
Tim Pengembang E-Ijazah
        `.trim();
    }

    // Log broadcast event (No email sending)
    async logBroadcastEvent(updateData) {
        const broadcast = {
            version: updateData.version,
            timestamp: new Date().toISOString(),
            type: 'in-app',
            status: 'success'
        };

        this.broadcastHistory.push(broadcast);
        console.log(`✅ Broadcast logged for v${updateData.version} at ${broadcast.timestamp}`);

        return broadcast;
    }

    // Generate WhatsApp message (can be sent via WhatsApp Business API)
    generateWhatsAppMessage() {
        return this.generateUpdateMessage('text');
    }

    // Create announcement post for social media
    generateSocialMediaPost() {
        const { version, features } = this.updateData;

        return `
🚀 Aplikasi E-Ijazah v${version} telah dirilis!

✨ Highlights update ini:
${features.slice(0, 3).map(feature => `• ${feature}`).join('\n')}

💡 Akses sekarang di: nilai-e-ijazah.koyeb.app

#EIjazah #SekolahDigital #SistemNilai #Update #Pendidikan
        `.trim();
    }

    // Create detailed release notes for website
    generateReleaseNotes() {
        const { version, releaseDate, type, features, bugfixes } = this.updateData;

        return {
            title: `Release Notes - E-Ijazah v${version}`,
            date: releaseDate,
            type: type,
            summary: `E-Ijazah v${version} membawa ${features.length} fitur baru dan ${bugfixes.length} perbaikan untuk meningkatkan pengalaman pengguna.`,
            features: features,
            bugfixes: bugfixes,
            upgradeInstructions: [
                'Web users: Refresh halaman untuk mendapat update otomatis',
                'Desktop users: Download installer terbaru dari GitHub Releases',
                'Data akan tetap aman selama proses update'
            ],
            compatibility: 'Kompatibel dengan semua versi database existing',
            support: 'Hubungi tim support jika ada pertanyaan'
        };
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getUpdateTypeLabel(type) {
        const labels = {
            'major': 'Update Besar',
            'minor': 'Fitur Baru',
            'patch': 'Perbaikan',
            'hotfix': 'Hotfix'
        };
        return labels[type] || 'Update';
    }

    // Main notification broadcast function (In-app only, no email)
    async broadcastUpdate(updateData) {
        this.setUpdateInfo(updateData);

        console.log(`📢 Broadcasting update v${updateData.version} via in-app notification...`);

        try {
            // Log the broadcast event
            const broadcast = await this.logBroadcastEvent(updateData);

            console.log('✅ Update broadcast completed successfully');
            console.log('ℹ️  All active users will see notification on next login/auto-check');

            return {
                success: true,
                message: `Update v${updateData.version} is now available for all users`,
                broadcastType: 'in-app',
                timestamp: broadcast.timestamp,
                notificationMethod: 'Auto-check (30 min interval) + In-app banner',
                whatsappMessageReady: true,
                socialMediaPostReady: true,
                releaseNotesReady: true
            };
        } catch (error) {
            console.error('❌ Error broadcasting update:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = UpdateNotifier;