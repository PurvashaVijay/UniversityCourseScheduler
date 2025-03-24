// scheduleRoutes.js
const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Main schedule routes
//router.get('/', scheduleController.getAllSchedules);
//router.get('/:id', scheduleController.getScheduleById);
//router.post('/', scheduleController.createSchedule);
//router.put('/:id', scheduleController.updateSchedule);
//router.delete('/:id', scheduleController.deleteSchedule);

// Additional routes
//router.get('/semester/:semesterId', scheduleController.getSchedulesBySemester);
//router.get('/:id/conflicts', scheduleController.getScheduleConflicts);
//router.put('/conflicts/:conflictId/resolve', scheduleController.resolveConflict);

// Public or authenticated-only routes
router.get('/', authenticate, scheduleController.getAllSchedules);
router.get('/:id', authenticate, scheduleController.getScheduleById);

// Admin-only routes
router.post('/', authenticate, authorize('admin'), scheduleController.createSchedule);
router.put('/:id', authenticate, authorize('admin'), scheduleController.updateSchedule);
router.delete('/:id', authenticate, authorize('admin'), scheduleController.deleteSchedule);

// Additional routes
router.get('/semester/:semesterId', authenticate, scheduleController.getSchedulesBySemester);
router.get('/:id/conflicts', authenticate, scheduleController.getScheduleConflicts);
router.put('/conflicts/:conflictId/resolve', authenticate, authorize('admin'), scheduleController.resolveConflict);



module.exports = router;