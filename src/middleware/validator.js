// Input Validation Middleware
const { body, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validasi gagal',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Login validation rules
const validateLogin = [
    body('appCode')
        .trim()
        .notEmpty().withMessage('Kode aplikasi harus diisi')
        .isLength({ min: 3, max: 50 }).withMessage('Kode aplikasi harus 3-50 karakter')
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Kode aplikasi hanya boleh huruf dan angka'),
    body('kurikulum')
        .notEmpty().withMessage('Kurikulum harus dipilih')
        .isIn(['Merdeka', 'K13']).withMessage('Kurikulum tidak valid'),
    handleValidationErrors
];

// Admin login validation rules
const validateAdminLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username harus diisi')
        .isLength({ min: 3, max: 50 }).withMessage('Username harus 3-50 karakter')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya boleh huruf, angka, dan underscore'),
    body('password')
        .notEmpty().withMessage('Password harus diisi')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    handleValidationErrors
];

// Data import validation
const validateDataImport = [
    body('data')
        .notEmpty().withMessage('Data tidak boleh kosong')
        .isArray().withMessage('Data harus berupa array'),
    handleValidationErrors
];

// NISN validation
const validateNISN = [
    body('nisn')
        .trim()
        .notEmpty().withMessage('NISN harus diisi')
        .isLength({ min: 10, max: 10 }).withMessage('NISN harus 10 digit')
        .isNumeric().withMessage('NISN hanya boleh angka'),
    handleValidationErrors
];

// Sekolah validation
const validateSekolah = [
    body('npsn')
        .optional()
        .trim()
        .isLength({ min: 8, max: 8 }).withMessage('NPSN harus 8 digit')
        .isNumeric().withMessage('NPSN hanya boleh angka'),
    body('namaSekolahLengkap')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 }).withMessage('Nama sekolah harus 5-200 karakter'),
    handleValidationErrors
];

// Nilai validation
const validateNilai = [
    body('nisn')
        .trim()
        .notEmpty().withMessage('NISN harus diisi')
        .isNumeric().withMessage('NISN hanya boleh angka'),
    body('semester')
        .notEmpty().withMessage('Semester harus diisi'),
    body('subject')
        .trim()
        .notEmpty().withMessage('Mata pelajaran harus diisi'),
    body('value')
        .notEmpty().withMessage('Nilai harus diisi')
        .isNumeric().withMessage('Nilai harus berupa angka')
        .isFloat({ min: 0, max: 100 }).withMessage('Nilai harus 0-100'),
    handleValidationErrors
];

// Sanitize common XSS patterns
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove potential XSS patterns
                obj[key] = obj[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
};

module.exports = {
    validateLogin,
    validateAdminLogin,
    validateDataImport,
    validateNISN,
    validateSekolah,
    validateNilai,
    sanitizeInput,
    handleValidationErrors
};
