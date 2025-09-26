
// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middleware/authMiddleware');

// Semua rute di bawah ini dilindungi oleh token
router.use(verifyToken);

// Rute untuk mengambil notifikasi bagi pengguna yang login
router.get('/', notificationController.getNotifications);

// Rute untuk menandai notifikasi sebagai sudah dibaca
router.post('/read', notificationController.markAsRead);

// Rute khusus admin untuk membuat pengumuman/broadcast
router.post('/broadcast', notificationController.createBroadcast);

// Rute khusus admin untuk edit pengumuman
router.put('/:id', notificationController.updateNotification);

// Rute khusus admin untuk hapus pengumuman
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
