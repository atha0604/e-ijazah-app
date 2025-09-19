// Configuration and constants for E-Ijazah Application
// Safe global constants and API configuration

// API Configuration
const API_BASE = window.location.origin;
const apiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;

// Application Constants
const APP_CONFIG = {
    // UI Constants
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,

    // Date formats
    DATE_FORMAT_ID: 'DD MMMM YYYY',

    // Pagination
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,

    // File upload limits
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],

    // Indonesian months for date formatting
    MONTHS_ID: [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ],

    // Grade calculation constants
    MIN_GRADE: 0,
    MAX_GRADE: 100,
    PASSING_GRADE: 75
};

// API Endpoints
const API_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    DATA_ALL: '/api/data/all',
    DATA_SEKOLAH: '/api/data/sekolah',
    DATA_SISWA: '/api/data/siswa',
    BACKUP_SAVE: '/api/data/backup/save',
    BACKUP_LIST: '/api/data/backup/list'
};