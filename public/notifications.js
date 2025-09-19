// public/notifications.js

document.addEventListener('DOMContentLoaded', () => {
    // Jangan jalankan apapun jika pengguna belum login
    if (!window.currentUser || !window.currentUser.isLoggedIn) {
        return;
    }
    initNotificationSystem();
});

let allNotifications = [];
let socket = null;

function initNotificationSystem() {
    console.log('Initializing Notification System...');

    try {
        // Inisialisasi koneksi socket
        if (typeof io !== 'undefined' && !socket) {
            socket = io();
            console.log('Socket.IO connection initialized.');

            // Listener untuk notifikasi baru
            socket.on('new_notification', (data) => {
                console.log('New notification received:', data);
                const { role, userIdentifier } = window.currentUser;
                const { recipient_scope, recipient_id } = data;

                let isRelevant = false;
                if (recipient_scope === 'all_schools' && role === 'sekolah') {
                    isRelevant = true;
                } else if (recipient_scope === 'admin' && role === 'admin') {
                    isRelevant = true;
                } else if (recipient_scope === 'school' && recipient_id === userIdentifier) {
                    isRelevant = true;
                } else if (recipient_scope === 'kecamatan') {
                    const userKecamatan = window.currentUser.schoolData?.[2];
                    if (userKecamatan && recipient_id === userKecamatan) {
                        isRelevant = true;
                    }
                }

                if (isRelevant) {
                    console.log('Notification is relevant. Fetching updates...');
                    if (typeof showNotification === 'function') {
                        showNotification('Anda memiliki notifikasi baru.', 'info');
                    }
                    fetchNotifications();
                }
            });
        }

        injectBellIcons();

    } catch (error) {
        console.error('Error initializing notification system:', error);
    }
}

function injectBellIcons() {
    try {
        const headers = document.querySelectorAll('.dashboard-header .header-right');
        headers.forEach(header => {
            if (header.querySelector('.notification-bell')) return; // Already injected

            const bellContainer = document.createElement('div');
            bellContainer.className = 'notification-bell';
            bellContainer.innerHTML = `
                <svg class="bell-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <div class="badge" style="display: none;">0</div>
            `;

            bellContainer.addEventListener('click', toggleNotificationPanel);
            header.appendChild(bellContainer);
        });
    } catch (error) {
        console.error('Error injecting bell icons:', error);
    }
}

function toggleNotificationPanel() {
    try {
        const existingPanel = document.getElementById('notificationPanel');
        if (existingPanel) {
            existingPanel.classList.toggle('show');
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'notificationPanel';
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-panel-header">Notifikasi</div>
            <div class="notification-list">
                <div style="text-align: center; padding: 20px; color: #666;">
                    Memuat notifikasi...
                </div>
            </div>
            <div class="notification-panel-footer">
                <a href="#" onclick="showAllNotifications()">Lihat Semua</a>
            </div>
        `;

        document.body.appendChild(panel);
        panel.classList.add('show');
        fetchNotifications();
    } catch (error) {
        console.error('Error toggling notification panel:', error);
    }
}

function fetchNotifications() {
    console.log('Fetching notifications...');

    setTimeout(async () => {
        try {
            console.log('Current user role:', window.currentUser?.role);
            console.log('Current user data:', window.currentUser);

            const containerId = window.currentUser.role === 'admin' ? 'adminNotificationCenterContent' : 'sekolahNotificationCenterContent';
            const contentArea = document.getElementById(containerId);

            console.log(`Attempting to find container: #${containerId}. Found:`, !!contentArea);

            if (!contentArea) {
                console.log(`Container ${containerId} tidak ditemukan di DOM!`);
                return;
            }

            const token = localStorage.getItem('jwtToken');
            if (!token) {
                console.log('No JWT token found');
                return;
            }

            const response = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                allNotifications = result.data || [];
                console.log('Data notifications loaded:', allNotifications.length, 'items');

                renderNotificationCenterPage();
                updateNotificationUI();

                console.log('Render notification page completed');
            } else {
                throw new Error(result.message || 'Gagal mengambil data notifikasi');
            }
        } catch (error) {
            console.error('Gagal mengambil notifikasi:', error);
            const containerId = window.currentUser.role === 'admin' ? 'adminNotificationCenterContent' : 'sekolahNotificationCenterContent';
            const contentArea = document.getElementById(containerId);
            if (contentArea) {
                contentArea.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat notifikasi: ${error.message}</p>`;
            }
        }
    }, 0);
}

function updateNotificationUI() {
    try {
        const unreadCount = allNotifications.filter(n => !n.is_read).length;

        // Update badge di semua bell icon
        document.querySelectorAll('.notification-bell .badge').forEach(badge => {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });

        // Update panel dropdown
        const notificationList = document.querySelector('.notification-list');
        if (notificationList) {
            if (allNotifications.length === 0) {
                notificationList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Tidak ada notifikasi.</div>';
            } else {
                const recentNotifications = allNotifications.slice(0, 5);
                notificationList.innerHTML = recentNotifications.map(notif => {
                    const date = new Date(notif.created_at).toLocaleDateString('id-ID', {timeZone: 'Asia/Jakarta'}) + ' ' + new Date(notif.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'}) + ' WIB';
                    return `
                        <div class="notification-item ${notif.is_read ? '' : 'unread'}" onclick="markAsRead(${notif.id})">
                            <div class="message">${notif.message}</div>
                            <div class="timestamp">${date}</div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error updating notification UI:', error);
    }
}

function renderNotificationCenterPage() {
    try {
        const userRole = window.currentUser?.role;

        if (userRole === 'admin') {
            renderAdminNotificationCenter();
        } else if (userRole === 'sekolah') {
            renderSekolahNotificationCenter();
        }
    } catch (error) {
        console.error('Error rendering notification center page:', error);
    }
}

function renderAdminNotificationCenter() {
    try {
        const container = document.getElementById('adminNotificationCenterContent');
        if (!container) return;

        container.innerHTML = `
            <div class="admin-notification-center">
                <div style="margin-bottom: 30px;">
                    <h3>📢 Kirim Pengumuman Baru</h3>
                    <form id="adminBroadcastForm" onsubmit="handleBroadcast(event)">
                        <div style="margin-bottom: 15px;">
                            <label>Pesan Pengumuman:</label>
                            <textarea id="broadcastMessage" rows="4" placeholder="Ketik pengumuman di sini..." required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label>Kirim ke:</label>
                            <select id="recipientScope" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                <option value="all_schools">Semua Sekolah</option>
                                <option value="kecamatan">Kecamatan Tertentu</option>
                                <option value="school">Sekolah Tertentu</option>
                            </select>
                        </div>
                        <div id="recipientIdGroup" style="display: none; margin-bottom: 15px;">
                            <label>ID Penerima:</label>
                            <input type="text" id="recipientId" placeholder="Masukkan kode/ID" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <button type="submit" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
                            Kirim Pengumuman
                        </button>
                    </form>
                </div>

                <div>
                    <h3>📋 Daftar Pengumuman (${allNotifications.length})</h3>
                    <div id="notificationList">
                        ${allNotifications.length === 0 ?
                            '<p style="text-align: center; color: #666; padding: 40px;">Belum ada pengumuman yang dikirim.</p>' :
                            allNotifications.map(notif => {
                                const createdDate = new Date(notif.created_at);
                                return `
                                    <div style="padding: 15px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 10px;">
                                        <div style="display: flex; justify-content: between; align-items: flex-start; gap: 10px;">
                                            <div style="flex: 1;">
                                                <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
                                                    ${createdDate.toLocaleDateString('id-ID', {timeZone: 'Asia/Jakarta'})} ${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'})} WIB - ${notif.recipient_scope}
                                                </div>
                                                <div style="color: #333;">${notif.message}</div>
                                            </div>
                                            <div style="display: flex; gap: 5px; flex-shrink: 0;">
                                                <button onclick="editNotification(${notif.id})" style="background: #f59e0b; color: white; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                                    Edit
                                                </button>
                                                <button onclick="deleteNotification(${notif.id})" style="background: #ef4444; color: white; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')
                        }
                    </div>
                </div>
            </div>
        `;

        // Setup event listener untuk recipient scope
        const scopeSelect = document.getElementById('recipientScope');
        const recipientGroup = document.getElementById('recipientIdGroup');

        if (scopeSelect && recipientGroup) {
            scopeSelect.addEventListener('change', () => {
                if (scopeSelect.value === 'all_schools') {
                    recipientGroup.style.display = 'none';
                    document.getElementById('recipientId').required = false;
                } else {
                    recipientGroup.style.display = 'block';
                    document.getElementById('recipientId').required = true;
                }
            });
        }

    } catch (error) {
        console.error('Error rendering admin notification center:', error);
        const container = document.getElementById('adminNotificationCenterContent');
        if (container) {
            container.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat panel admin: ${error.message}</p>`;
        }
    }
}

function renderSekolahNotificationCenter() {
    try {
        const container = document.getElementById('sekolahNotificationCenterContent');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px;">
                Menu notifikasi untuk sekolah sudah dipindah ke menu "Info Terbaru ⭐"
            </div>
        `;
    } catch (error) {
        console.error('Error rendering sekolah notification center:', error);
    }
}

function handleBroadcast(event) {
    event.preventDefault();

    try {
        const message = document.getElementById('broadcastMessage').value;
        const recipient_scope = document.getElementById('recipientScope').value;
        const recipient_id = document.getElementById('recipientId').value;

        if (!message.trim()) {
            if (typeof showNotification === 'function') {
                showNotification('Pesan pengumuman wajib diisi.', 'error');
            }
            return;
        }

        // Send broadcast
        sendBroadcast(message, recipient_scope, recipient_id);
    } catch (error) {
        console.error('Error handling broadcast:', error);
        if (typeof showNotification === 'function') {
            showNotification('Gagal mengirim pengumuman: ' + error.message, 'error');
        }
    }
}

async function sendBroadcast(message, recipient_scope, recipient_id) {
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        const response = await fetch('/api/notifications/broadcast', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                recipient_scope,
                recipient_id: recipient_scope === 'all_schools' ? null : recipient_id
            })
        });

        const result = await response.json();

        if (result.success) {
            if (typeof showNotification === 'function') {
                showNotification('Pengumuman berhasil dikirim.', 'success');
            }
            document.getElementById('broadcastMessage').value = '';
            fetchNotifications(); // Refresh list
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error sending broadcast:', error);
        if (typeof showNotification === 'function') {
            showNotification('Gagal mengirim pengumuman: ' + error.message, 'error');
        }
    }
}

function markAsRead(notificationId) {
    try {
        markNotificationsAsRead([notificationId]);
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

async function markNotificationsAsRead(notification_ids) {
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) return;

        await fetch('/api/notifications/read', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notification_ids })
        });

        // Refresh notifikasi setelah menandai
        fetchNotifications();
    } catch (error) {
        console.error('Gagal menandai notifikasi:', error);
    }
}

function showAllNotifications() {
    try {
        // Tutup panel dropdown
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('show');
        }

        // Switch ke halaman notification center
        if (window.currentUser?.role === 'admin') {
            const menuItem = document.querySelector('[data-target="notificationCenterSection"]');
            if (menuItem) {
                menuItem.click();
            }
        } else {
            const menuItem = document.querySelector('[data-target="infoTerbaruSection"]');
            if (menuItem) {
                menuItem.click();
            }
        }
    } catch (error) {
        console.error('Error showing all notifications:', error);
    }
}

function editNotification(notificationId) {
    try {
        const notification = allNotifications.find(n => n.id === notificationId);
        if (!notification) {
            if (typeof showNotification === 'function') {
                showNotification('Notifikasi tidak ditemukan.', 'error');
            }
            return;
        }

        // Isi modal dengan data notification
        document.getElementById('editNotificationId').value = notificationId;
        document.getElementById('editNotificationMessage').innerHTML = notification.message;

        // Update character counter
        updateCharCounter();

        // Tampilkan modal
        const modal = document.getElementById('editNotificationModal');
        if (modal) {
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Error editing notification:', error);
        if (typeof showNotification === 'function') {
            showNotification('Gagal mengedit pengumuman: ' + error.message, 'error');
        }
    }
}

function deleteNotification(notificationId) {
    try {
        const notification = allNotifications.find(n => n.id === notificationId);
        if (!notification) {
            if (typeof showNotification === 'function') {
                showNotification('Notifikasi tidak ditemukan.', 'error');
            }
            return;
        }

        const confirmDelete = confirm('Apakah Anda yakin ingin menghapus pengumuman ini?');
        if (confirmDelete) {
            removeNotification(notificationId);
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        if (typeof showNotification === 'function') {
            showNotification('Gagal menghapus pengumuman: ' + error.message, 'error');
        }
    }
}

async function updateNotification(notificationId, newMessage) {
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: newMessage })
        });

        const result = await response.json();

        if (result.success) {
            if (typeof showNotification === 'function') {
                showNotification('Pengumuman berhasil diperbarui.', 'success');
            }
            fetchNotifications(); // Refresh list
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error updating notification:', error);
        if (typeof showNotification === 'function') {
            showNotification('Gagal memperbarui pengumuman: ' + error.message, 'error');
        }
    }
}

async function removeNotification(notificationId) {
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            if (typeof showNotification === 'function') {
                showNotification('Pengumuman berhasil dihapus.', 'success');
            }
            fetchNotifications(); // Refresh list
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error removing notification:', error);
        if (typeof showNotification === 'function') {
            showNotification('Gagal menghapus pengumuman: ' + error.message, 'error');
        }
    }
}

// Rich Text Editor Functions
function execCommand(command) {
    document.execCommand(command, false, null);
    updateEditorState();
}

function updateEditorState() {
    const commands = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'insertUnorderedList', 'insertOrderedList'];

    commands.forEach(command => {
        const btn = document.querySelector(`[data-command="${command}"]`);
        if (btn) {
            if (document.queryCommandState(command)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

function updateCharCounter() {
    const content = document.getElementById('editNotificationMessage');
    const charCounter = document.getElementById('charCounter');
    const wordCounter = document.getElementById('wordCounter');

    if (content && charCounter) {
        const text = content.innerText || content.textContent || '';
        charCounter.textContent = text.length;

        // Update word counter
        if (wordCounter) {
            const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
            wordCounter.textContent = words;
        }
    }
}

// Event listeners untuk modal edit notification
document.addEventListener('DOMContentLoaded', () => {
    // Close modal events
    const closeModalBtn = document.getElementById('closeEditNotificationModalBtn');
    const cancelBtn = document.getElementById('cancelEditNotification');
    const modal = document.getElementById('editNotificationModal');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Rich text editor toolbar events
    document.querySelectorAll('.editor-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.getAttribute('data-command');
            if (command) {
                execCommand(command);
            }
        });
    });

    // Editor content events
    const editor = document.getElementById('editNotificationMessage');
    if (editor) {
        editor.addEventListener('input', updateCharCounter);
        editor.addEventListener('keyup', updateEditorState);
        editor.addEventListener('mouseup', updateEditorState);

        // Keyboard shortcuts
        editor.addEventListener('keydown', (e) => {
            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                const form = document.getElementById('editNotificationForm');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }

            // Tab untuk indentasi
            if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertText', false, '    '); // 4 spaces
            }
        });
    }

    // Handle form submission
    const editForm = document.getElementById('editNotificationForm');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const notificationId = document.getElementById('editNotificationId').value;
            const newMessage = document.getElementById('editNotificationMessage').innerHTML.trim();

            if (!newMessage || newMessage === '<br>' || newMessage === '<div><br></div>') {
                if (typeof showNotification === 'function') {
                    showNotification('Pesan pengumuman wajib diisi.', 'error');
                }
                return;
            }

            // Close modal
            if (modal) modal.style.display = 'none';

            // Update notification
            updateNotification(parseInt(notificationId), newMessage);
        });
    }
});