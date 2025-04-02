const Department = require('./Department');
const Program = require('./Program');
const Admin = require('./Admin');
const Professor = require('./Professor');
const Course = require('./Course');
const CourseProgram = require('./CourseProgram');
const CourseSemester = require('./CourseSemester');
const CoursePrerequisite = require('./CoursePrerequisite');
const TimeSlot = require('./TimeSlot');
const ProfessorAvailability = require('./ProfessorAvailability');
const Semester = require('./Semester');
const Schedule = require('./Schedule');
const ScheduledCourse = require('./ScheduledCourse');
const Conflict = require('./Conflict');
const ConflictCourse = require('./ConflictCourse');
// Add this line to your associations.js after importing ProfessorCourse
const ProfessorCourse = require('./ProfessorCourse');

function defineAssociations() {
  // Department associations
  Department.hasMany(Program, { foreignKey: 'department_id' });
  Department.hasMany(Admin, { foreignKey: 'department_id' });
  Department.hasMany(Professor, { foreignKey: 'department_id' });
  Department.hasMany(Course, { foreignKey: 'department_id' });

  // Program associations
  Program.belongsTo(Department, { foreignKey: 'department_id' });
  Program.belongsToMany(Course, { through: CourseProgram, foreignKey: 'program_id', otherKey: 'course_id' });

  // Admin associations
  Admin.belongsTo(Department, { foreignKey: 'department_id' });

  // Professor associations
  Professor.belongsTo(Department, { foreignKey: 'department_id' });
  Professor.hasMany(ProfessorAvailability, { foreignKey: 'professor_id' });
  Professor.hasMany(ScheduledCourse, { foreignKey: 'professor_id' });

  // Add these direct associations
  ProfessorCourse.belongsTo(Professor, { foreignKey: 'professor_id' });
  Professor.hasMany(ProfessorCourse, { foreignKey: 'professor_id' });

  ProfessorCourse.belongsTo(Course, { foreignKey: 'course_id' });
  Course.hasMany(ProfessorCourse, { foreignKey: 'course_id' });

  // Course associations
  Course.belongsTo(Department, { foreignKey: 'department_id' });
  Course.belongsToMany(Program, { through: CourseProgram, foreignKey: 'course_id', otherKey: 'program_id' });

  // Course and CourseSemester associations
  Course.hasMany(CourseSemester, { 
    foreignKey: 'course_id',
    onDelete: 'CASCADE'
  });
  CourseSemester.belongsTo(Course, { 
    foreignKey: 'course_id'
  });
  
  // Course Prerequisites (self-referencing)
  Course.belongsToMany(Course, { 
    through: CoursePrerequisite,
    as: 'prerequisites',
    foreignKey: 'course_id',
    otherKey: 'prerequisite_course_id'
  });
  
  Course.belongsToMany(Course, { 
    through: CoursePrerequisite,
    as: 'prerequisiteFor',
    foreignKey: 'prerequisite_course_id',
    otherKey: 'course_id'
  });
  
  // TimeSlot associations
  TimeSlot.hasMany(ProfessorAvailability, { foreignKey: 'timeslot_id' });
  TimeSlot.hasMany(ScheduledCourse, { foreignKey: 'timeslot_id' });
  TimeSlot.hasMany(Conflict, { foreignKey: 'timeslot_id' });

  // ProfessorAvailability associations
  ProfessorAvailability.belongsTo(Professor, { foreignKey: 'professor_id' });
  ProfessorAvailability.belongsTo(TimeSlot, { foreignKey: 'timeslot_id' });

  // Semester associations
  Semester.hasMany(Schedule, { foreignKey: 'semester_id' });

  // Schedule associations
  Schedule.belongsTo(Semester, { foreignKey: 'semester_id' });
  Schedule.hasMany(ScheduledCourse, { foreignKey: 'schedule_id' });
  Schedule.hasMany(Conflict, { foreignKey: 'schedule_id' });

  // ScheduledCourse associations
  ScheduledCourse.belongsTo(Schedule, { foreignKey: 'schedule_id' });
  ScheduledCourse.belongsTo(Course, { foreignKey: 'course_id' });
  ScheduledCourse.belongsTo(Professor, { foreignKey: 'professor_id' });
  ScheduledCourse.belongsTo(TimeSlot, { foreignKey: 'timeslot_id' });
  ScheduledCourse.belongsToMany(Conflict, { through: ConflictCourse, foreignKey: 'scheduled_course_id', otherKey: 'conflict_id' });

  // Conflict associations
  Conflict.belongsTo(Schedule, { foreignKey: 'schedule_id' });
  Conflict.belongsTo(TimeSlot, { foreignKey: 'timeslot_id' });
  Conflict.belongsToMany(ScheduledCourse, { through: ConflictCourse, foreignKey: 'conflict_id', otherKey: 'scheduled_course_id' });

  // ConflictCourse associations
  ConflictCourse.belongsTo(Conflict, { foreignKey: 'conflict_id' });
  ConflictCourse.belongsTo(ScheduledCourse, { foreignKey: 'scheduled_course_id' });

  // Add these associations
  Professor.belongsToMany(Course, { through: ProfessorCourse, foreignKey: 'professor_id', otherKey: 'course_id' });
  Course.belongsToMany(Professor, { through: ProfessorCourse, foreignKey: 'course_id', otherKey: 'professor_id' });

}

module.exports = defineAssociations;