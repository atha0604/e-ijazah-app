// Utility functions for E-Ijazah Application
// These are safe, standalone functions with no dependencies

// Function to format date to Indonesian format
function formatDateToIndonesian(dateString) {
    if (!dateString || !dateString.includes('-')) return '';
    const [year, month, day] = dateString.split('-');
    if(!year || !month || !day) return '';
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

// Function to convert text to title case (capitalize each word)
function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

// Function to clean and normalize string data
function cleanString(str) {
    if (!str) return '';
    return str.toString().trim().replace(/\s+/g, ' ');
}

// Function to validate email format
function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to format number with thousand separators
function formatNumber(num) {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}