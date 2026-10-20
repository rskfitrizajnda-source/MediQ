const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinic.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public routes
router.get('/polyclinics', clinicController.getPolyclinics);
router.get('/doctors', clinicController.getDoctors);
router.get('/settings', clinicController.getClinicSettings);

// Protected routes (Admin / Receptionist)
router.get('/overview', authenticate, authorize('ADMIN', 'RECEPTIONIST'), clinicController.getAdminOverview);
router.put('/settings', authenticate, authorize('ADMIN'), clinicController.updateClinicSettings);

module.exports = router;

