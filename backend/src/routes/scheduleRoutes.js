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


// Add these routes to scheduleRoutes.js
router.get('/:id/program/:programId', authenticate, scheduleController.getScheduleByProgram);
router.get('/:id/department/:departmentId', authenticate, scheduleController.getScheduleByDepartment);
// Additional routes
router.get('/semester/:semesterId', authenticate, scheduleController.getSchedulesBySemester);
// Add this route before the '/:id' route to avoid path conflicts
router.get('/semester/:semesterId/active', authenticate, scheduleController.getActiveSemesterSchedule);
router.get('/:id/conflicts', authenticate, scheduleController.getScheduleConflicts);
router.put('/conflicts/:conflictId/resolve', authenticate, authorize('admin'), scheduleController.resolveConflict);

router.put('/conflicts/:conflictId/revert', authenticate, authorize('admin'), scheduleController.revertConflictResolution);

module.exports = router;
