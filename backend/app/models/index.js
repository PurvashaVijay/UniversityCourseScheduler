const Department = require('./Department');
const Program = require('./Program');
const Admin = require('./Admin');
const Professor = require('./Professor');
const Course = require('./Course');
const CourseProgram = require('./CourseProgram');
const CoursePrerequisite = require('./CoursePrerequisite');
const TimeSlot = require('./TimeSlot');
const ProfessorAvailability = require('./ProfessorAvailability');
const Semester = require('./Semester');
const Schedule = require('./Schedule');
const ScheduledCourse = require('./ScheduledCourse');
const Conflict = require('./Conflict');
const ConflictCourse = require('./ConflictCourse');
const defineAssociations = require('./associations');

// Initialize associations
defineAssociations();

module.exports = {
  Department,
  Program,
  Admin,
  Professor,
  Course,
  CourseProgram,
  CoursePrerequisite,
  TimeSlot,
  ProfessorAvailability,
  Semester,
  Schedule,
  ScheduledCourse,
  Conflict,
  ConflictCourse
};