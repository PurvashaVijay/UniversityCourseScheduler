-- Course Scheduling System Database Schema (Updated)
-- PostgreSQL Implementation

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS conflict_course CASCADE;
DROP TABLE IF EXISTS conflict CASCADE;
DROP TABLE IF EXISTS scheduled_course CASCADE;
DROP TABLE IF EXISTS schedule CASCADE;
DROP TABLE IF EXISTS semester CASCADE;
DROP TABLE IF EXISTS professor_availability CASCADE;
DROP TABLE IF EXISTS time_slot CASCADE;
DROP TABLE IF EXISTS course_prerequisite CASCADE;
DROP TABLE IF EXISTS course_program CASCADE;
DROP TABLE IF EXISTS section CASCADE; -- This will be dropped but not recreated
DROP TABLE IF EXISTS course CASCADE;
DROP TABLE IF EXISTS professor CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS program CASCADE;
DROP TABLE IF EXISTS department CASCADE;

-- Create Department table
CREATE TABLE department (
    department_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Program table
CREATE TABLE program (
    program_id VARCHAR(50) PRIMARY KEY,
    department_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES department(department_id) ON DELETE CASCADE
);

-- Create Admin table
CREATE TABLE admin (
    admin_id VARCHAR(50) PRIMARY KEY,
    department_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES department(department_id) ON DELETE CASCADE
);

-- Create Professor table
CREATE TABLE professor (
    professor_id VARCHAR(50) PRIMARY KEY,
    department_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES department(department_id) ON DELETE CASCADE
);

-- Create Course table (modified)
CREATE TABLE course (
    course_id VARCHAR(50) PRIMARY KEY,
    department_id VARCHAR(50) NOT NULL,
    course_name VARCHAR(150) NOT NULL, -- Changed from course_code to course_name and increased length
    duration_minutes INTEGER NOT NULL,
    is_core BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES department(department_id) ON DELETE CASCADE,
    UNIQUE (department_id, course_name)
);

-- Create CourseProgram table (many-to-many relationship)
CREATE TABLE course_program (
    course_program_id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    program_id VARCHAR(50) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES program(program_id) ON DELETE CASCADE,
    UNIQUE (course_id, program_id)
);

-- Create CoursePrerequisite table
CREATE TABLE course_prerequisite (
    prerequisite_id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    prerequisite_course_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_course_id) REFERENCES course(course_id) ON DELETE CASCADE,
    UNIQUE (course_id, prerequisite_course_id),
    CHECK (course_id != prerequisite_course_id) -- Prevent self-reference
);

-- Create TimeSlot table (modified to include day field)
CREATE TABLE time_slot (
    timeslot_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    day_of_week VARCHAR(20) NOT NULL, -- Added to specify which day
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, day_of_week),
    CHECK (start_time < end_time)
);

-- Create ProfessorAvailability table (modified day_of_week to VARCHAR)
CREATE TABLE professor_availability (
    availability_id VARCHAR(50) PRIMARY KEY,
    professor_id VARCHAR(50) NOT NULL,
    timeslot_id VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL, -- Changed from INTEGER to VARCHAR
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id) ON DELETE CASCADE,
    FOREIGN KEY (timeslot_id) REFERENCES time_slot(timeslot_id) ON DELETE CASCADE,
    UNIQUE (professor_id, timeslot_id, day_of_week)
);

-- Create Semester table
CREATE TABLE semester (
    semester_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name),
    CHECK (start_date < end_date)
);

-- Create Schedule table
CREATE TABLE schedule (
    schedule_id VARCHAR(50) PRIMARY KEY,
    semester_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semester_id) REFERENCES semester(semester_id) ON DELETE CASCADE
);

-- Create ScheduledCourse table (modified to reference course_id directly instead of section_id)
CREATE TABLE scheduled_course (
    scheduled_course_id VARCHAR(50) PRIMARY KEY,
    schedule_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL, -- Changed from section_id to course_id
    professor_id VARCHAR(50) NOT NULL,
    timeslot_id VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL, -- Changed from INTEGER to VARCHAR
    is_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE, -- Updated reference
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id) ON DELETE CASCADE,
    FOREIGN KEY (timeslot_id) REFERENCES time_slot(timeslot_id) ON DELETE CASCADE
);

-- Create Conflict table (modified day_of_week to VARCHAR)
CREATE TABLE conflict (
    conflict_id VARCHAR(50) PRIMARY KEY,
    schedule_id VARCHAR(50) NOT NULL,
    timeslot_id VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL, -- Changed from INTEGER to VARCHAR
    conflict_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY (timeslot_id) REFERENCES time_slot(timeslot_id) ON DELETE CASCADE
);

-- Create ConflictCourse table (many-to-many relationship)
CREATE TABLE conflict_course (
    conflict_course_id VARCHAR(50) PRIMARY KEY,
    conflict_id VARCHAR(50) NOT NULL,
    scheduled_course_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (conflict_id) REFERENCES conflict(conflict_id) ON DELETE CASCADE,
    FOREIGN KEY (scheduled_course_id) REFERENCES scheduled_course(scheduled_course_id) ON DELETE CASCADE,
    UNIQUE (conflict_id, scheduled_course_id)
);

-- Create indexes for performance
CREATE INDEX idx_course_department ON course(department_id);
CREATE INDEX idx_course_is_core ON course(is_core);
CREATE INDEX idx_professor_department ON professor(department_id);
CREATE INDEX idx_course_program_course ON course_program(course_id);
CREATE INDEX idx_course_program_program ON course_program(program_id);
CREATE INDEX idx_professor_availability_professor ON professor_availability(professor_id);
CREATE INDEX idx_professor_availability_timeslot ON professor_availability(timeslot_id);
CREATE INDEX idx_scheduled_course_schedule ON scheduled_course(schedule_id);
CREATE INDEX idx_scheduled_course_professor ON scheduled_course(professor_id);
CREATE INDEX idx_scheduled_course_timeslot ON scheduled_course(timeslot_id);
CREATE INDEX idx_conflict_schedule ON conflict(schedule_id);
CREATE INDEX idx_conflict_resolved ON conflict(is_resolved);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_department_modtime
    BEFORE UPDATE ON department
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_program_modtime
    BEFORE UPDATE ON program
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_admin_modtime
    BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_professor_modtime
    BEFORE UPDATE ON professor
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_course_modtime
    BEFORE UPDATE ON course
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_time_slot_modtime
    BEFORE UPDATE ON time_slot
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_professor_availability_modtime
    BEFORE UPDATE ON professor_availability
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_semester_modtime
    BEFORE UPDATE ON semester
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_schedule_modtime
    BEFORE UPDATE ON schedule
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_scheduled_course_modtime
    BEFORE UPDATE ON scheduled_course
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_conflict_modtime
    BEFORE UPDATE ON conflict
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert predefined time slots based on requirements (updated to include day_of_week)
INSERT INTO time_slot (timeslot_id, name, start_time, end_time, duration_minutes, day_of_week)
VALUES 
    ('TS1-MON', 'Time Slot 1', '09:10:00', '10:05:00', 55, 'Monday'),
    ('TS2-MON', 'Time Slot 2', '10:20:00', '11:15:00', 55, 'Monday'),
    ('TS3-MON', 'Time Slot 3', '11:30:00', '12:25:00', 55, 'Monday'),
    ('TS4-MON', 'Time Slot 4', '12:45:00', '14:05:00', 80, 'Monday'),
    ('TS5-MON', 'Time Slot 5', '13:30:00', '14:50:00', 80, 'Monday'),
    ('TS6-MON', 'Time Slot 6', '17:30:00', '20:30:00', 180, 'Monday'),
    ('TS7-MON', 'Time Slot 7', '18:00:00', '21:00:00', 180, 'Monday'),
    
    ('TS1-TUE', 'Time Slot 1', '09:10:00', '10:05:00', 55, 'Tuesday'),
    ('TS2-TUE', 'Time Slot 2', '10:20:00', '11:15:00', 55, 'Tuesday'),
    ('TS3-TUE', 'Time Slot 3', '11:30:00', '12:25:00', 55, 'Tuesday'),
    ('TS4-TUE', 'Time Slot 4', '12:45:00', '14:05:00', 80, 'Tuesday'),
    ('TS5-TUE', 'Time Slot 5', '13:30:00', '14:50:00', 80, 'Tuesday'),
    ('TS6-TUE', 'Time Slot 6', '17:30:00', '20:30:00', 180, 'Tuesday'),
    ('TS7-TUE', 'Time Slot 7', '18:00:00', '21:00:00', 180, 'Tuesday');

-- You can add more time slots for other days of the week as needed

-- Commit the transaction
COMMIT;

-- Output confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Updated Course Scheduling System database schema created successfully.';
END $$;