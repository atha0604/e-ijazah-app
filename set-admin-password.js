// Script to set admin password
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setAdminPassword() {
    console.log('🔐 Admin Password Setup');
    console.log('='.repeat(50));

    const username = await question('Enter admin username (default: admin): ') || 'admin';
    const password = await question('Enter new password: ');

    if (!password || password.length < 6) {
        console.error('❌ Password must be at least 6 characters');
        rl.close();
        return;
    }

    const confirmPassword = await question('Confirm password: ');

    if (password !== confirmPassword) {
        console.error('❌ Passwords do not match');
        rl.close();
        return;
    }

    console.log('\n🔄 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('💾 Updating database...');

    const db = new sqlite3.Database(dbPath);

    db.serialize(() => {
        // Check if user exists
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) {
                console.error('❌ Database error:', err);
                db.close();
                rl.close();
                return;
            }

            if (row) {
                // Update existing user
                db.run(
                    'UPDATE users SET password = ? WHERE username = ?',
                    [hashedPassword, username],
                    function(updateErr) {
                        if (updateErr) {
                            console.error('❌ Update failed:', updateErr);
                        } else {
                            console.log(`✅ Password updated for user: ${username}`);
                        }
                        db.close();
                        rl.close();
                    }
                );
            } else {
                // Insert new user
                db.run(
                    'INSERT INTO users (username, login_code, password) VALUES (?, ?, ?)',
                    [username, username.toLowerCase(), hashedPassword],
                    function(insertErr) {
                        if (insertErr) {
                            console.error('❌ Insert failed:', insertErr);
                        } else {
                            console.log(`✅ Admin user created: ${username}`);
                        }
                        db.close();
                        rl.close();
                    }
                );
            }
        });
    });
}

setAdminPassword().catch(err => {
    console.error('❌ Error:', err);
    rl.close();
});
