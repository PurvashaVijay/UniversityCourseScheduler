/**
 * Scheduler module index
 * Main entry point for the course scheduling system using Python OR-Tools
 */

const schedulerService = require('../services/schedulerService');

// Export the main functions needed by controllers
module.exports = {
  /**
   * Generate a new schedule for a semester
   * @param {string} semesterId - ID of the semester to schedule
   * @param {string} name - Name of the schedule
   * @returns {Promise<Object>} - The created schedule with conflicts
   */
  generateSchedule: async (semesterId, name) => {
    return await schedulerService.generateSchedule(semesterId, name);
  },
  
  /**
   * Resolve a scheduling conflict
   * @param {string} conflictId - ID of the conflict to resolve
   * @param {string} resolutionNotes - Notes about how the conflict was resolved
   * @returns {Promise<Object>} - The updated conflict
   */
  resolveConflict: async (conflictId, resolutionNotes) => {
    return await schedulerService.resolveConflict(conflictId, resolutionNotes);
  },
  
  /**
   * Create a manual override for a scheduled course
   * @param {Object} overrideData - Data for the manual override
   * @returns {Promise<Object>} - The newly scheduled course with override flag
   */
  createOverride: async (overrideData) => {
    return await schedulerService.createOverride(overrideData);
  }
};