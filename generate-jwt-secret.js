#!/usr/bin/env node

/**
 * JWT Secret Generator
 *
 * Script untuk generate secure random JWT secret key
 * Usage: node generate-jwt-secret.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('JWT SECRET GENERATOR - Aplikasi Nilai E-Ijazah');
console.log('='.repeat(80));
console.log();

// Generate secure random JWT secret (512 bits = 64 bytes = 128 hex characters)
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('✅ Secure JWT Secret generated successfully!');
console.log();
console.log('Your JWT_SECRET:');
console.log('-'.repeat(80));
console.log(jwtSecret);
console.log('-'.repeat(80));
console.log();

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
    console.log('⚠️  WARNING: .env file already exists!');
    console.log();
    console.log('Options:');
    console.log('1. Manually copy the JWT_SECRET above to your .env file');
    console.log('2. Or run: node generate-jwt-secret.js --force (to overwrite)');
    console.log();

    if (process.argv.includes('--force')) {
        updateEnvFile(envPath, jwtSecret);
    }
} else {
    // Create .env from .env.example
    if (fs.existsSync(envExamplePath)) {
        console.log('📝 Creating .env file from .env.example...');
        let envContent = fs.readFileSync(envExamplePath, 'utf8');

        // Replace placeholder with actual secret
        envContent = envContent.replace(
            'JWT_SECRET=GENERATE_A_SECURE_RANDOM_STRING_HERE_MINIMUM_64_CHARACTERS',
            `JWT_SECRET=${jwtSecret}`
        );

        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created successfully!');
        console.log();
        console.log('Next steps:');
        console.log('1. Review and update .env file with your configuration');
        console.log('2. NEVER commit .env file to git!');
        console.log('3. Add production origins to CORS_ORIGINS in .env');
    } else {
        console.log('❌ ERROR: .env.example not found!');
        console.log('Please create .env manually with the JWT_SECRET above');
    }
}

console.log();
console.log('='.repeat(80));
console.log('SECURITY REMINDERS:');
console.log('='.repeat(80));
console.log('✓ Keep your JWT_SECRET private and secure');
console.log('✓ Never commit .env file to version control');
console.log('✓ Use different secrets for development and production');
console.log('✓ Rotate JWT_SECRET periodically for better security');
console.log('='.repeat(80));
console.log();

function updateEnvFile(envPath, newSecret) {
    console.log('📝 Updating .env file with new JWT_SECRET...');

    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace existing JWT_SECRET
    if (envContent.includes('JWT_SECRET=')) {
        envContent = envContent.replace(
            /JWT_SECRET=.*/,
            `JWT_SECRET=${newSecret}`
        );
    } else {
        // Add JWT_SECRET if not exists
        envContent = `JWT_SECRET=${newSecret}\n` + envContent;
    }

    // Backup old .env
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`📦 Old .env backed up to: ${path.basename(backupPath)}`);

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated successfully!');
    console.log();
}