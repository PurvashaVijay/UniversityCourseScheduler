// src/types/courseTypes.ts
export interface Course {
    course_id: string;
    course_name?: string;
    name?: string;
    department_id?: string;
    duration_minutes?: number;
    is_core?: boolean;
    program_id?: string;
    description?: string;
    semesters?: string[];
    semester?: string;
    numClasses?: number;
  }
  
  export interface ProgramWithCourses {
    program_id: string;
    name: string;
    department_id: string;
    Courses?: Course[];
  }