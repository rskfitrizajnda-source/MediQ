const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.use(authorize('DOCTOR', 'ADMIN'));

router.get('/queues', doctorController.getDoctorQueues);
router.get('/schedule', doctorController.getDoctorSchedule);
router.put('/schedule', doctorController.updateDoctorSchedule);

module.exports = router;

