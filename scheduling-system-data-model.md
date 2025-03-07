# Scheduling System - Detailed Data Model/Schema

## Core Entities

### Department
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the department |
| `name` | String | Name of the department |
| `description` | String | Brief description of the department |
| `created_at` | DateTime | When the department was created |
| `updated_at` | DateTime | When the department was last updated |

### Program
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the program |
| `name` | String | Name of the program (e.g., "MS in Computer Science") |
| `department_id` | UUID | Foreign key to the department that manages this program |
| `description` | String | Brief description of the program |
| `created_at` | DateTime | When the program was created |
| `updated_at` | DateTime | When the program was last updated |

### Course
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the course |
| `code` | String | Course code (e.g., "CS501") |
| `title` | String | Course title |
| `description` | String | Course description |
| `duration_minutes` | Integer | Duration of the course in minutes (55, 80, 180) |
| `is_core` | Boolean | Flag indicating if this is a core course (true) or elective (false) |
| `owner_department_id` | UUID | Foreign key to the department that owns this course |
| `prerequisites` | Array[UUID] | List of prerequisite course IDs |
| `num_sections` | Integer | Number of sections for this course |
| `created_at` | DateTime | When the course was created |
| `updated_at` | DateTime | When the course was last updated |

### CourseEligibility
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the eligibility record |
| `course_id` | UUID | Foreign key to the course |
| `program_id` | UUID | Foreign key to the eligible program |
| `created_at` | DateTime | When the record was created |

### CourseSection
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the course section |
| `course_id` | UUID | Foreign key to the course |
| `section_number` | Integer | Section identifier (1, 2, etc.) |
| `professor_id` | UUID | Foreign key to the assigned professor |
| `schedule_id` | UUID | Foreign key to the schedule this section belongs to |
| `time_slot_id` | UUID | Foreign key to the assigned time slot |
| `day_of_week` | Enum | Day this section meets (MONDAY, TUESDAY, etc.) |
| `has_conflicts` | Boolean | Flag indicating if this section has scheduling conflicts |
| `manually_overridden` | Boolean | Flag indicating if this section was manually placed |
| `override_notes` | String | Admin notes explaining manual override reasons |
| `created_at` | DateTime | When the section was created |
| `updated_at` | DateTime | When the section was last updated |

### Professor
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the professor |
| `name` | String | Professor's name |
| `email` | String | Professor's email address |
| `department_id` | UUID | Foreign key to the professor's department |
| `created_at` | DateTime | When the professor record was created |
| `updated_at` | DateTime | When the professor record was last updated |

### ProfessorAvailability
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the availability record |
| `professor_id` | UUID | Foreign key to the professor |
| `day_of_week` | Enum | Day of the week (MONDAY, TUESDAY, etc.) |
| `time_slot_id` | UUID | Foreign key to the time slot |
| `is_available` | Boolean | Flag indicating if the professor is available at this time |
| `created_at` | DateTime | When the availability record was created |
| `updated_at` | DateTime | When the availability record was last updated |

### TimeSlot
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the time slot |
| `start_time` | Time | Start time (e.g., "09:10:00") |
| `end_time` | Time | End time (e.g., "10:05:00") |
| `duration_minutes` | Integer | Duration in minutes |
| `label` | String | Human-readable label (e.g., "Morning Slot 1") |
| `created_at` | DateTime | When the time slot was created |
| `updated_at` | DateTime | When the time slot was last updated |

### Schedule
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the schedule |
| `name` | String | Schedule name/identifier |
| `semester` | Enum | Semester (FALL, SPRING, SUMMER) |
| `year` | Integer | Academic year |
| `status` | Enum | Schedule status (DRAFT, PUBLISHED, ARCHIVED) |
| `generated_date` | DateTime | When the schedule was generated |
| `last_modified_date` | DateTime | When the schedule was last modified |
| `last_modified_by` | UUID | Foreign key to the admin who last modified the schedule |
| `created_at` | DateTime | When the schedule record was created |
| `updated_at` | DateTime | When the schedule record was last updated |

### ScheduleConflict
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the conflict |
| `schedule_id` | UUID | Foreign key to the schedule |
| `primary_section_id` | UUID | Foreign key to the first conflicting section |
| `secondary_section_id` | UUID | Foreign key to the second conflicting section |
| `conflict_type` | Enum | Type of conflict (TIME_OVERLAP, PROFESSOR_CONFLICT, etc.) |
| `severity` | Enum | Conflict severity (HIGH, MEDIUM, LOW) |
| `resolution_status` | Enum | Status (PENDING, RESOLVED, APPROVED_WITH_CONFLICT) |
| `resolution_notes` | String | Notes on the conflict resolution |
| `resolved_by` | UUID | Foreign key to the admin who resolved the conflict |
| `resolved_at` | DateTime | When the conflict was resolved |
| `created_at` | DateTime | When the conflict was detected |
| `updated_at` | DateTime | When the conflict record was last updated |

### User
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier for the user |
| `username` | String | Username for login |
| `email` | String | User's email address |
| `password_hash` | String | Hashed password |
| `role` | Enum | User role (ADMIN, PROFESSOR) |
| `department_id` | UUID | Foreign key to the user's department (for admins) |
| `professor_id` | UUID | Foreign key to professor record (for professors) |
| `last_login` | DateTime | When the user last logged in |
| `created_at` | DateTime | When the user account was created |
| `updated_at` | DateTime | When the user account was last updated |

## Relationships

1. **Department to Program**
   - One department can have multiple programs
   - Relationship: One-to-Many

2. **Department to Course**
   - One department can own multiple courses
   - Relationship: One-to-Many

3. **Course to CourseEligibility**
   - One course can be eligible for multiple programs (through CourseEligibility)
   - Relationship: One-to-Many

4. **Program to CourseEligibility**
   - One program can have multiple eligible courses (through CourseEligibility)
   - Relationship: One-to-Many

5. **Course to CourseSection**
   - One course can have multiple sections
   - Relationship: One-to-Many

6. **Professor to CourseSection**
   - One professor can teach multiple course sections
   - Relationship: One-to-Many

7. **Professor to ProfessorAvailability**
   - One professor can have multiple availability records
   - Relationship: One-to-Many

8. **TimeSlot to ProfessorAvailability**
   - One time slot can be referenced in multiple availability records
   - Relationship: One-to-Many

9. **TimeSlot to CourseSection**
   - One time slot can be assigned to multiple course sections
   - Relationship: One-to-Many

10. **Schedule to CourseSection**
    - One schedule contains multiple course sections
    - Relationship: One-to-Many

11. **Schedule to ScheduleConflict**
    - One schedule can have multiple conflicts
    - Relationship: One-to-Many

12. **CourseSection to ScheduleConflict**
    - One course section can be involved in multiple conflicts
    - Relationship: One-to-Many

13. **User to Department**
    - Many users (admins) can belong to one department
    - Relationship: Many-to-One

14. **User to Professor**
    - One professor has one user account
    - Relationship: One-to-One

## Indexes

For performance optimization, the following indexes should be created:

1. Department: `name` (unique)
2. Program: `name`, `department_id`
3. Course: `code` (unique), `owner_department_id`, `is_core`
4. CourseEligibility: `course_id`, `program_id`
5. CourseSection: `course_id`, `professor_id`, `schedule_id`, `time_slot_id`, `day_of_week`
6. Professor: `email` (unique), `department_id`
7. ProfessorAvailability: `professor_id`, `day_of_week`, `time_slot_id`
8. TimeSlot: `start_time`, `end_time`
9. Schedule: `semester`, `year`, `status`
10. ScheduleConflict: `schedule_id`, `primary_section_id`, `secondary_section_id`, `resolution_status`
11. User: `username` (unique), `email` (unique), `role`

## Constraints and Business Rules

1. A course section cannot be scheduled at a time when the assigned professor is unavailable
2. Core courses from the same program must not conflict with each other
3. If a course has multiple sections, they can be scheduled at different times
4. A professor cannot be assigned to two overlapping course sections
5. Course prerequisite relationships must not create circular dependencies
6. A course eligible for multiple programs must maintain the same time slot across all programs for the same section
7. When a course's time slot changes, all conflicts must be recalculated
8. User roles determine permissions (admins can modify schedules, professors can only update availability)
