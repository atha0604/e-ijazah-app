// Colorful Education Theme with Gamification
// Fun, Interactive Dashboard for Educational Environment

// Initialize Colorful Theme
function initColorfulTheme() {
    // Add weather widget
    addWeatherWidget();

    // Add gamification dashboard
    addGamificationDashboard();

    // Add motivational quotes
    addMotivationalQuotes();

    // Add educational calendar
    addEducationalCalendar();

    // Initialize interactive effects
    initInteractiveEffects();

    // Update achievements
    updateAchievements();
}

// Add Weather Widget
function addWeatherWidget() {
    const header = document.querySelector('.dashboard-header');
    if (header && !header.querySelector('.weather-widget')) {
        const weatherWidget = document.createElement('div');
        weatherWidget.className = 'weather-widget';
        weatherWidget.innerHTML = `
            <div>☀️ 28°C</div>
            <div style="font-size: 0.8rem; opacity: 0.8;">Jakarta</div>
        `;
        header.appendChild(weatherWidget);
    }
}

// Add Gamification Dashboard
function addGamificationDashboard() {
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminDashboard && !adminDashboard.querySelector('.gamification-stats')) {
        const gamificationHTML = `
            <div class="quote-container">
                <div class="quote-text">"Education is the most powerful weapon which you can use to change the world."</div>
                <div class="quote-author">- Nelson Mandela</div>
            </div>

            <div class="gamification-stats">
                <div class="achievement-card gold pulse-animation">
                    <div class="achievement-icon">🏫</div>
                    <div class="achievement-number" data-target="0">0</div>
                    <div class="achievement-label">Sekolah</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 85%"></div>
                        </div>
                        <div class="progress-text">85% Target Tercapai</div>
                    </div>
                </div>

                <div class="achievement-card silver">
                    <div class="achievement-icon">👥</div>
                    <div class="achievement-number" data-target="0">0</div>
                    <div class="achievement-label">Siswa Aktif</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 92%"></div>
                        </div>
                        <div class="progress-text">92% Completion Rate</div>
                    </div>
                </div>

                <div class="achievement-card bronze">
                    <div class="achievement-icon">📊</div>
                    <div class="achievement-number" data-target="0">0</div>
                    <div class="achievement-label">Data Records</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 78%"></div>
                        </div>
                        <div class="progress-text">Level 3 Achievement</div>
                    </div>
                </div>

                <div class="achievement-card gold">
                    <div class="achievement-icon">⭐</div>
                    <div class="achievement-number" data-target="95">0</div>
                    <div class="achievement-label">System Score</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 95%"></div>
                        </div>
                        <div class="progress-text">Excellent Performance!</div>
                    </div>
                </div>

                <div class="achievement-card bronze">
                    <div class="achievement-icon">🎯</div>
                    <div class="achievement-number" data-target="12">0</div>
                    <div class="achievement-label">Goals Achieved</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 60%"></div>
                        </div>
                        <div class="progress-text">Keep Going! 💪</div>
                    </div>
                </div>

                <div class="achievement-card silver">
                    <div class="achievement-icon">📈</div>
                    <div class="achievement-number" data-target="67">0</div>
                    <div class="achievement-label">Growth Rate</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 67%"></div>
                        </div>
                        <div class="progress-text">Trending Up! 📈</div>
                    </div>
                </div>
            </div>
        `;

        // Insert after dashboard title
        const title = adminDashboard.querySelector('h2');
        if (title) {
            title.insertAdjacentHTML('afterend', gamificationHTML);
        }
    }
}

// Add Educational Calendar
function addEducationalCalendar() {
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminDashboard && !adminDashboard.querySelector('.calendar-container')) {
        const calendarHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    📚 Educational Timeline & Events
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 15px; border-radius: 15px; text-align: center;">
                        <div style="font-size: 1.5rem; margin-bottom: 5px;">📝</div>
                        <div style="font-weight: 600;">Ujian Semester</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">15 Des 2024</div>
                    </div>

                    <div style="background: linear-gradient(45deg, #4ecdc4, #45b7d1); color: white; padding: 15px; border-radius: 15px; text-align: center;">
                        <div style="font-size: 1.5rem; margin-bottom: 5px;">🎓</div>
                        <div style="font-weight: 600;">Wisuda</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">20 Jan 2025</div>
                    </div>

                    <div style="background: linear-gradient(45deg, #a29bfe, #fd79a8); color: white; padding: 15px; border-radius: 15px; text-align: center;">
                        <div style="font-size: 1.5rem; margin-bottom: 5px;">📋</div>
                        <div style="font-weight: 600;">Pendaftaran</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">1 Feb 2025</div>
                    </div>

                    <div style="background: linear-gradient(45deg, #96ceb4, #00d2d3); color: white; padding: 15px; border-radius: 15px; text-align: center;">
                        <div style="font-size: 1.5rem; margin-bottom: 5px;">🏆</div>
                        <div style="font-weight: 600;">Kompetisi</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">10 Mar 2025</div>
                    </div>
                </div>
            </div>
        `;

        // Insert after gamification stats
        const gamificationStats = adminDashboard.querySelector('.gamification-stats');
        if (gamificationStats) {
            gamificationStats.insertAdjacentHTML('afterend', calendarHTML);
        }
    }
}

// Add Motivational Quotes Rotation
function addMotivationalQuotes() {
    const quotes = [
        {
            text: "Education is the most powerful weapon which you can use to change the world.",
            author: "Nelson Mandela"
        },
        {
            text: "The beautiful thing about learning is that no one can take it away from you.",
            author: "B.B. King"
        },
        {
            text: "Education is not preparation for life; education is life itself.",
            author: "John Dewey"
        },
        {
            text: "Success is the sum of small efforts repeated day in and day out.",
            author: "Robert Collier"
        },
        {
            text: "The expert in anything was once a beginner.",
            author: "Helen Hayes"
        }
    ];

    let currentQuote = 0;

    setInterval(() => {
        const quoteContainer = document.querySelector('.quote-container');
        if (quoteContainer) {
            currentQuote = (currentQuote + 1) % quotes.length;
            const quote = quotes[currentQuote];

            quoteContainer.style.opacity = '0';
            setTimeout(() => {
                quoteContainer.querySelector('.quote-text').textContent = quote.text;
                quoteContainer.querySelector('.quote-author').textContent = `- ${quote.author}`;
                quoteContainer.style.opacity = '1';
            }, 300);
        }
    }, 10000); // Change every 10 seconds
}

// Fun Counter Animation with Confetti Effect
function animateCounterWithConfetti(element, target, duration = 3000) {
    const start = parseInt(element.textContent) || 0;
    const range = target - start;
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;
    let frame = 0;

    function updateCounter() {
        frame++;
        const progress = frame / totalFrames;
        const eased = 1 - Math.pow(1 - progress, 4); // Ease out quart
        const value = Math.round(start + (range * eased));

        element.textContent = value;

        // Add percentage for system score
        if (element.closest('.achievement-card').querySelector('.achievement-label').textContent === 'System Score') {
            element.textContent = value + '%';
        }

        if (frame < totalFrames) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
            if (element.closest('.achievement-card').querySelector('.achievement-label').textContent === 'System Score') {
                element.textContent = target + '%';
            }

            // Add celebration effect
            celebrateAchievement(element.closest('.achievement-card'));
        }
    }

    requestAnimationFrame(updateCounter);
}

// Celebrate Achievement with Fun Effects
function celebrateAchievement(card) {
    // Add bounce animation
    card.style.animation = 'bounce 1s ease-in-out';

    // Add temporary glow
    card.style.boxShadow = '0 0 30px rgba(255, 107, 107, 0.5)';

    // Create confetti effect
    createConfetti(card);

    // Reset after animation
    setTimeout(() => {
        card.style.animation = '';
        card.style.boxShadow = '';
    }, 1000);
}

// Create Confetti Effect
function createConfetti(element) {
    for (let i = 0; i < 10; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57'][Math.floor(Math.random() * 4)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: confettiFall 2s ease-out forwards;
        `;

        const rect = element.getBoundingClientRect();
        confetti.style.left = (rect.left + Math.random() * rect.width) + 'px';
        confetti.style.top = (rect.top + rect.height / 2) + 'px';

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 2000);
    }
}

// Add Confetti Animation CSS
function addConfettiCSS() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confettiFall {
            to {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize Interactive Effects
function initInteractiveEffects() {
    // Add click sound effect (visual feedback)
    const cards = document.querySelectorAll('.achievement-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            // Show fun notification
            showFunNotification();
        });
    });

    // Add hover sound effects (visual feedback)
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.filter = 'brightness(1.1)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.filter = '';
        });
    });
}

// Show Fun Notification
function showFunNotification() {
    const messages = [
        "🎉 Great job exploring!",
        "⭐ Keep up the awesome work!",
        "🚀 You're doing amazing!",
        "💪 Stay motivated!",
        "🎯 Achievement unlocked!"
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    if (typeof showNotification === 'function') {
        showNotification(message, 'success');
    }
}

// Update Achievement Numbers
function updateAchievements() {
    if (window.database) {
        const siswaCount = window.database.siswa ? window.database.siswa.length : 0;
        const sekolahCount = window.database.sekolah ? window.database.sekolah.length : 0;
        const totalRecords = siswaCount + sekolahCount;

        const achievementNumbers = document.querySelectorAll('.achievement-number');
        if (achievementNumbers.length >= 6) {
            // Stagger animations for dramatic effect
            setTimeout(() => animateCounterWithConfetti(achievementNumbers[0], sekolahCount), 500);
            setTimeout(() => animateCounterWithConfetti(achievementNumbers[1], siswaCount), 1000);
            setTimeout(() => animateCounterWithConfetti(achievementNumbers[2], totalRecords), 1500);
            setTimeout(() => animateCounterWithConfetti(achievementNumbers[3], 95), 2000);
            setTimeout(() => animateCounterWithConfetti(achievementNumbers[4], 12), 2500);
            setTimeout(() => animateCounterWithConfetti(achievementNumbers[5], 67), 3000);
        }
    }
}

// Initialize Colorful Theme
function initializeColorfulTheme() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                initColorfulTheme();
                addConfettiCSS();

                // Update achievements when data is available
                if (window.database) {
                    updateAchievements();
                } else {
                    // Wait for data to load
                    const checkData = setInterval(() => {
                        if (window.database) {
                            updateAchievements();
                            clearInterval(checkData);
                        }
                    }, 1000);
                }
            }, 500);
        });
    } else {
        setTimeout(() => {
            initColorfulTheme();
            addConfettiCSS();
            updateAchievements();
        }, 500);
    }
}

// Fun Background Pattern Generator
function addBackgroundPattern() {
    const pattern = document.createElement('div');
    pattern.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(78, 205, 196, 0.1) 0%, transparent 50%);
        pointer-events: none;
        z-index: -1;
    `;
    document.body.appendChild(pattern);
}

// Initialize when script loads
initializeColorfulTheme();