const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queue.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public routes (Pasien & Smart TV)
router.get('/display', queueController.getTvDisplayData);
router.get('/track/:code', queueController.trackQueue);

// Protected routes (Admin & Resepsionis & Dokter)
router.get('/', authenticate, queueController.getTodayQueues);
router.post('/check-in', authenticate, queueController.checkIn);
router.post('/walk-in', authenticate, queueController.walkInRegister);

// Doctor queue control routes
router.post('/:queueId/call', authenticate, authorize('DOCTOR', 'ADMIN'), queueController.call);
router.post('/:queueId/recall', authenticate, authorize('DOCTOR', 'ADMIN'), queueController.recall);
router.post('/:queueId/start', authenticate, authorize('DOCTOR', 'ADMIN'), queueController.start);
router.post('/:queueId/finish', authenticate, authorize('DOCTOR', 'ADMIN'), queueController.finish);
router.post('/:queueId/skip', authenticate, authorize('DOCTOR', 'ADMIN'), queueController.skip);

module.exports = router;

