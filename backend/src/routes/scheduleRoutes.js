// scheduleRoutes.js
const express = require('express');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

// Main schedule routes
router.get('/', scheduleController.getAllSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

// Additional routes
router.get('/semester/:semesterId', scheduleController.getSchedulesBySemester);
router.get('/:id/conflicts', scheduleController.getScheduleConflicts);
router.put('/conflicts/:conflictId/resolve', scheduleController.resolveConflict);

module.exports = router;