const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public routes (Pasien)
router.post('/book', patientController.bookQueue);
router.get('/ticket/:bookingCode', patientController.getTicketByBookingCode);
router.get('/history/:nik', patientController.getPatientHistory);

// Authenticated routes (Staff & Dokter)
router.get('/search', authenticate, patientController.searchPatients);
router.get('/details/:id', authenticate, patientController.getPatientHistoryById);

module.exports = router;
