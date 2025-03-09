// timeSlotRoutes.js
const express = require('express');
const timeSlotController = require('../controllers/timeSlotController');

const router = express.Router();

// Main time slot routes
router.get('/', timeSlotController.getAllTimeSlots);
router.get('/:id', timeSlotController.getTimeSlotById);
router.post('/', timeSlotController.createTimeSlot);
router.put('/:id', timeSlotController.updateTimeSlot);
router.delete('/:id', timeSlotController.deleteTimeSlot);

// Get time slots by day
router.get('/day/:day', timeSlotController.getTimeSlotsByDay);

module.exports = router;