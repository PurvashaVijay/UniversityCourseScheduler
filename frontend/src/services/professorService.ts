// src/services/professorService.ts

import { v4 as uuidv4 } from 'uuid';

// Define the base API URL - not used in mock data but kept for compatibility
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Types
export interface Professor {
  professor_id: string;
  department_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  semesters?: string[];    // For semester availability
  course_ids?: string[];   // For multiple course assignments
  created_at: string;
  updated_at: string;
}

export interface ProfessorAvailability {
  availability_id: string;
  professor_id: string;
  timeslot_id: string;
  day_of_week: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessorDetail extends Professor {
  department?: any;
  courses?: any[];
  availabilities?: ProfessorAvailability[];
}

// Mock data that matches existing department and course data in your database
const MOCK_PROFESSORS: Professor[] = [
  // Finance Department professors
  {
    professor_id: 'PROF-efe3da81',
    department_id: 'Finance',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    password_hash: 'hashed_password',
    semesters: ['Fall', 'Spring'],
    course_ids: ['Finance Analytics', 'Investment Banking'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    professor_id: 'PROF-7b8e9f01',
    department_id: 'Finance',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    password_hash: 'hashed_password',
    semesters: ['Fall'],
    course_ids: ['Corporate Finance', 'Finance Analytics'],
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  {
    professor_id: 'PROF-2c3d4e5f',
    department_id: 'Finance',
    first_name: 'Robert',
    last_name: 'Johnson',
    email: 'robert.johnson@example.com',
    password_hash: 'hashed_password',
    semesters: ['Spring'],
    course_ids: ['Investment Banking', 'Financial Markets'],
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },

  // Marketing professors
  {
    professor_id: 'PROF-a1b2c3d4',
    department_id: 'Marketing',
    first_name: 'Emily',
    last_name: 'Williams',
    email: 'emily.williams@example.com',
    password_hash: 'hashed_password',
    semesters: ['Fall', 'Spring'],
    course_ids: ['Digital Marketing', 'Marketing Analytics'],
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z'
  },
  {
    professor_id: 'PROF-5f6g7h8i',
    department_id: 'Marketing',
    first_name: 'Michael',
    last_name: 'Brown',
    email: 'michael.brown@example.com',
    password_hash: 'hashed_password',
    semesters: ['Fall'],
    course_ids: ['Brand Management', 'Consumer Behavior'],
    created_at: '2024-01-19T10:00:00Z',
    updated_at: '2024-01-19T10:00:00Z'
  },

  // Business Analytics professors
  {
    professor_id: 'PROF-9j0k1l2m',
    department_id: 'Business Analytics',
    first_name: 'Sarah',
    last_name: 'Davis',
    email: 'sarah.davis@example.com',
    password_hash: 'hashed_password',
    semesters: ['Fall', 'Spring'],
    course_ids: ['Data Visualization', 'Business Intelligence'],
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  },
  {
    professor_id: 'PROF-3n4o5p6q',
    department_id: 'Business Analytics',
    first_name: 'David',
    last_name: 'Miller',
    email: 'david.miller@example.com',
    password_hash: 'hashed_password',
    semesters: ['Spring'],
    course_ids: ['Machine Learning for Business', 'Data Mining'],
    created_at: '2024-01-21T10:00:00Z',
    updated_at: '2024-01-21T10:00:00Z'
  },

  // Information Systems professors
  {
    professor_id: 'PROF-7r8s9t0u',
    department_id: 'Information Systems',
    first_name: 'James',
    last_name: 'Wilson',
    email: 'james.wilson@example.com',
    password_hash: 'hashed_password',
    semesters: ['Fall'],
    course_ids: ['Database Management', 'Systems Analysis'],
    created_at: '2024-01-22T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z'
  },
  {
    professor_id: 'PROF-1v2w3x4y',
    department_id: 'Information Systems',
    first_name: 'Jennifer',
    last_name: 'Taylor',
    email: 'jennifer.taylor@example.com',
    password_hash: 'hashed_password',
    semesters: ['Fall', 'Spring'],
    course_ids: ['IT Project Management', 'Enterprise Architecture'],
    created_at: '2024-01-23T10:00:00Z',
    updated_at: '2024-01-23T10:00:00Z'
  },

  // Management professors
  {
    professor_id: 'PROF-5z6a7b8c',
    department_id: 'Management',
    first_name: 'Thomas',
    last_name: 'Anderson',
    email: 'thomas.anderson@example.com',
    password_hash: 'hashed_password',
    semesters: ['Spring'],
    course_ids: ['Organizational Behavior', 'Strategic Management'],
    created_at: '2024-01-24T10:00:00Z',
    updated_at: '2024-01-24T10:00:00Z'
  }
];

// Mock availability data
const MOCK_AVAILABILITY: ProfessorAvailability[] = [
  // John Doe (Finance)
  {
    availability_id: 'AVAIL-1a2b3c4d',
    professor_id: 'PROF-efe3da81',
    timeslot_id: 'TS1-MON',
    day_of_week: 'Monday',
    is_available: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    availability_id: 'AVAIL-2b3c4d5e',
    professor_id: 'PROF-efe3da81',
    timeslot_id: 'TS2-MON',
    day_of_week: 'Monday',
    is_available: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    availability_id: 'AVAIL-3c4d5e6f',
    professor_id: 'PROF-efe3da81',
    timeslot_id: 'TS3-TUE',
    day_of_week: 'Tuesday',
    is_available: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    availability_id: 'AVAIL-4d5e6f7g',
    professor_id: 'PROF-efe3da81',
    timeslot_id: 'TS1-WED',
    day_of_week: 'Wednesday',
    is_available: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  
  // Jane Smith (Finance)
  {
    availability_id: 'AVAIL-5e6f7g8h',
    professor_id: 'PROF-7b8e9f01',
    timeslot_id: 'TS1-MON',
    day_of_week: 'Monday',
    is_available: false,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  {
    availability_id: 'AVAIL-6f7g8h9i',
    professor_id: 'PROF-7b8e9f01',
    timeslot_id: 'TS2-MON',
    day_of_week: 'Monday',
    is_available: true,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  
  // Robert Johnson (Finance)
  {
    availability_id: 'AVAIL-7g8h9i0j',
    professor_id: 'PROF-2c3d4e5f',
    timeslot_id: 'TS1-TUE',
    day_of_week: 'Tuesday',
    is_available: true,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },
  {
    availability_id: 'AVAIL-8h9i0j1k',
    professor_id: 'PROF-2c3d4e5f',
    timeslot_id: 'TS2-TUE',
    day_of_week: 'Tuesday',
    is_available: true,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },
  
  // Additional availabilities for other professors
  {
    availability_id: 'AVAIL-9i0j1k2l',
    professor_id: 'PROF-a1b2c3d4',
    timeslot_id: 'TS1-MON',
    day_of_week: 'Monday',
    is_available: true,
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z'
  },
  {
    availability_id: 'AVAIL-0j1k2l3m',
    professor_id: 'PROF-a1b2c3d4',
    timeslot_id: 'TS1-WED',
    day_of_week: 'Wednesday',
    is_available: true,
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z'
  }
];

// Helper functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.random() * 300 + 100); // Random delay between 100-400ms

// Fetch all professors
export const getAllProfessors = async (): Promise<Professor[]> => {
  try {
    // Simulate API delay
    await randomDelay();
    return [...MOCK_PROFESSORS];
  } catch (error) {
    console.error('Error in getAllProfessors:', error);
    throw error;
  }
};

// Fetch professors by department
export const getProfessorsByDepartment = async (departmentId: string): Promise<Professor[]> => {
  try {
    await randomDelay();
    return MOCK_PROFESSORS.filter(professor => professor.department_id === departmentId);
  } catch (error) {
    console.error(`Error in getProfessorsByDepartment for departmentId ${departmentId}:`, error);
    throw error;
  }
};

// Fetch professors by course
export const getProfessorsByCourse = async (courseId: string): Promise<Professor[]> => {
  try {
    await randomDelay();
    return MOCK_PROFESSORS.filter(
      professor => professor.course_ids?.includes(courseId)
    );
  } catch (error) {
    console.error(`Error in getProfessorsByCourse for courseId ${courseId}:`, error);
    throw error;
  }
};

// Fetch a single professor by ID
export const getProfessorById = async (id: string): Promise<ProfessorDetail> => {
  try {
    console.log(`Mock service: getProfessorById called with ID ${id}`);
    await randomDelay();
    
    const professor = MOCK_PROFESSORS.find(p => p.professor_id === id);
    
    // Mock department data to prevent 404 errors when fetching department info
    const mockDepartment = {
      department_id: professor?.department_id || 'Finance',
      name: `${professor?.department_id || 'Finance'} Department`,
      description: 'Department description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Mock course data
    const mockCourses = (professor?.course_ids || ['Finance Analytics']).map(courseId => ({
      course_id: courseId,
      course_name: courseId,
      department_id: professor?.department_id || 'Finance',
      is_core: true,
      duration_minutes: 60,
      semester: 'Fall',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    if (!professor) {
      console.log(`Professor not found with ID ${id}, returning mock data`);
      // Instead of throwing an error, return mock data for any ID
      return {
        professor_id: id,
        department_id: 'Finance',
        first_name: 'Default',
        last_name: 'Professor',
        email: 'default.professor@example.com',
        password_hash: 'hashed_password',
        semesters: ['Fall', 'Spring'],
        course_ids: ['Finance Analytics'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        department: mockDepartment,
        courses: mockCourses,
        availabilities: [
          {
            availability_id: `AVAIL-${uuidv4().substring(0, 8)}`,
            professor_id: id,
            timeslot_id: 'TS1-MON',
            day_of_week: 'Monday',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            availability_id: `AVAIL-${uuidv4().substring(0, 8)}`,
            professor_id: id,
            timeslot_id: 'TS2-MON',
            day_of_week: 'Monday',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      };
    }
    
    // Add availabilities to the professor details
    const availabilities = MOCK_AVAILABILITY.filter(a => a.professor_id === id);
    
    // If no availabilities found, create some mock ones
    const professorAvailabilities = availabilities.length > 0 ? availabilities : [
      {
        availability_id: `AVAIL-${uuidv4().substring(0, 8)}`,
        professor_id: id,
        timeslot_id: 'TS1-MON',
        day_of_week: 'Monday',
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        availability_id: `AVAIL-${uuidv4().substring(0, 8)}`,
        professor_id: id,
        timeslot_id: 'TS2-MON',
        day_of_week: 'Monday',
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        availability_id: `AVAIL-${uuidv4().substring(0, 8)}`,
        professor_id: id,
        timeslot_id: 'TS3-TUE',
        day_of_week: 'Tuesday',
        is_available: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return {
      ...professor,
      department: mockDepartment,
      courses: mockCourses,
      availabilities: professorAvailabilities
    };
  } catch (error) {
    console.error(`Error in getProfessorById for ID ${id}:`, error);
    // Instead of propagating the error, return mock data
    return {
      professor_id: id,
      department_id: 'Finance',
      first_name: 'Fallback',
      last_name: 'Professor',
      email: 'fallback.professor@example.com',
      password_hash: 'hashed_password',
      semesters: ['Fall'],
      course_ids: ['Finance Analytics'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      department: {
        department_id: 'Finance',
        name: 'Finance Department',
        description: 'Department description',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      courses: [
        {
          course_id: 'Finance Analytics',
          course_name: 'Finance Analytics',
          department_id: 'Finance',
          is_core: true,
          duration_minutes: 60,
          semester: 'Fall',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      availabilities: []
    };
  }
};

// Get professor availability
export const getProfessorAvailability = async (professorId: string): Promise<ProfessorAvailability[]> => {
  try {
    await randomDelay();
    const availabilities = MOCK_AVAILABILITY.filter(a => a.professor_id === professorId);
    return availabilities;
  } catch (error) {
    console.error(`Error in getProfessorAvailability for professor ID ${professorId}:`, error);
    throw error;
  }
};

// Set professor availability
export const setProfessorAvailability = async (
  professorId: string,
  availabilities: ProfessorAvailability[]
): Promise<ProfessorAvailability[]> => {
  try {
    await randomDelay();
    
    // In a real implementation, this would update the database
    // For the mock, we'll just return the input availabilities with IDs
    const updatedAvailabilities = availabilities.map(a => ({
      ...a,
      availability_id: a.availability_id || `AVAIL-${uuidv4().substring(0, 8)}`,
      professor_id: professorId,
      created_at: a.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    return updatedAvailabilities;
  } catch (error) {
    console.error(`Error in setProfessorAvailability for professor ID ${professorId}:`, error);
    throw error;
  }
};

// Create a new professor
export const createProfessor = async (professor: Partial<Professor>): Promise<Professor> => {
  try {
    await randomDelay();
    
    // Generate ID if not provided
    if (!professor.professor_id) {
      professor.professor_id = `PROF-${uuidv4().substring(0, 8)}`;
    }
    
    // Ensure course_ids is an array
    if (!professor.course_ids) {
      professor.course_ids = [];
    }
    
    // Create timestamp
    const timestamp = new Date().toISOString();
    
    // Create new professor object
    const newProfessor: Professor = {
      ...professor as Professor,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    // In a real implementation, this would add to the database
    // For the mock, we'll just return the new professor
    return newProfessor;
  } catch (error) {
    console.error('Error in createProfessor:', error);
    throw error;
  }
};

// Update an existing professor
export const updateProfessor = async (id: string, professor: Partial<Professor>): Promise<Professor> => {
  try {
    await randomDelay();
    
    // Find existing professor
    const existingProfessor = MOCK_PROFESSORS.find(p => p.professor_id === id);
    
    if (!existingProfessor) {
      throw new Error('Professor not found');
    }
    
    // Ensure course_ids is an array
    if (!professor.course_ids) {
      professor.course_ids = [];
    }
    
    // Update professor
    const updatedProfessor: Professor = {
      ...existingProfessor,
      ...professor,
      updated_at: new Date().toISOString()
    };
    
    // In a real implementation, this would update the database
    // For the mock, we'll just return the updated professor
    return updatedProfessor;
  } catch (error) {
    console.error(`Error in updateProfessor for ID ${id}:`, error);
    throw error;
  }
};

// Delete a professor
export const deleteProfessor = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    await randomDelay();
    
    // In a real implementation, this would delete from the database
    // For the mock, we'll just return success
    return { success: true, message: 'Professor deleted successfully' };
  } catch (error) {
    console.error(`Error in deleteProfessor for ID ${id}:`, error);
    throw error;
  }
};

// Delete multiple professors
export const deleteProfessors = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
  try {
    await randomDelay();
    
    // In a real implementation, this would delete from the database
    // For the mock, we'll just return success
    return { success: true, message: 'Professors deleted successfully' };
  } catch (error) {
    console.error(`Error in deleteProfessors:`, error);
    throw error;
  }
};

// Assign courses to a professor
export const assignCoursesToProfessor = async (professorId: string, courseIds: string[]): Promise<Professor> => {
  try {
    await randomDelay();
    
    // Find existing professor
    const existingProfessor = MOCK_PROFESSORS.find(p => p.professor_id === professorId);
    
    if (!existingProfessor) {
      throw new Error('Professor not found');
    }
    
    // Filter out any empty course selections
    const validCourseIds = courseIds.filter(id => id !== '');
    
    // Update professor
    const updatedProfessor: Professor = {
      ...existingProfessor,
      course_ids: validCourseIds,
      updated_at: new Date().toISOString()
    };
    
    // In a real implementation, this would update the database
    // For the mock, we'll just return the updated professor
    return updatedProfessor;
  } catch (error) {
    console.error(`Error in assignCoursesToProfessor for professor ID ${professorId}:`, error);
    throw error;
  }
};

const professorService = {
  getAllProfessors,
  getProfessorsByDepartment,
  getProfessorsByCourse,
  getProfessorById,
  getProfessorAvailability,
  setProfessorAvailability,
  createProfessor,
  updateProfessor,
  deleteProfessor,
  deleteProfessors,
  assignCoursesToProfessor
};

export default professorService;