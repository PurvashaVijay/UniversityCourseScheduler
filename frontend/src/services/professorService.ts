// src/services/professorService.ts
// Add these imports at the top of your file
import { Course } from './courseService';
import { Department } from './departmentService';

// Interface for course-specific semesters
export interface CourseSemesters {
  [courseId: string]: string[];
}

// Types
export interface Professor {
  professor_id: string;
  department_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  semesters?: string[];    // For semester availability
  course_ids?: string[];   // For multiple course assignments
  course_semesters?: CourseSemesters; // Add this for course-specific semesters
  courses?: Course[];  // Add this
  department?: Department; // Add this
  Courses?: Course[];  // Add this optional field to match backend response format
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

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Normalize professor data to ensure consistent structure
const normalizeProfessorData = (professor: any): Professor => {
  // Make sure courses data is properly handled if present
  const courses = professor.courses || professor.Courses || [];
  
  // Preserve course information correctly
  if (professor.Courses && !professor.courses) {
    professor.courses = professor.Courses;
  }
  
  // Extract unique semesters from courses
  const uniqueSemesters = new Set<string>();
  courses.forEach((course: any) => {
    // Try to get semester from professor_course or directly from course
    const semester = course.professor_course?.semester || course.semester;
    if (semester) {
      uniqueSemesters.add(semester);
    }
  });
  
  // Make sure semesters and course_ids are handled correctly
  const semesters = professor.semesters || Array.from(uniqueSemesters) || [];
  const courseIds = professor.course_ids || courses.map((c: any) => c.course_id) || [];
  
  // Add course_semesters handling
  const courseSemesters = professor.course_semesters || {};
  
  // If no course_semesters but courses with semester info exist, build it
  if (!professor.course_semesters && courses.length > 0) {
    courses.forEach((course: any) => {
      const courseId = course.course_id;
      const semester = course.professor_course?.semester || course.semester;
      
      if (courseId && semester) {
        if (!courseSemesters[courseId]) {
          courseSemesters[courseId] = [];
        }
        if (!courseSemesters[courseId].includes(semester)) {
          courseSemesters[courseId].push(semester);
        }
      }
    });
  }
  
  return {
    professor_id: professor.professor_id,
    department_id: professor.department_id,
    first_name: professor.first_name,
    last_name: professor.last_name,
    email: professor.email,
    password_hash: professor.password_hash || '',
    semesters: semesters,
    course_ids: courseIds,
    course_semesters: courseSemesters,
    courses: courses,
    department: professor.department,
    created_at: professor.created_at,
    updated_at: professor.updated_at
  };
};

// Fetch all professors
export const getAllProfessors = async (): Promise<Professor[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch professors');
    }
    
    const data = await response.json();
    console.log('Raw professor data from API:', data);
    return data.map(normalizeProfessorData);
  } catch (error) {
    console.error('Error in getAllProfessors:', error);
    throw error;
  }
};

// Fetch professors by department
export const getProfessorsByDepartment = async (departmentId: string): Promise<Professor[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/department/${departmentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch professors for department ${departmentId}`);
    }
    
    const data = await response.json();
    return data.map(normalizeProfessorData);
  } catch (error) {
    console.error(`Error in getProfessorsByDepartment for departmentId ${departmentId}:`, error);
    throw error;
  }
};

// Fetch professors by course
export const getProfessorsByCourse = async (courseId: string): Promise<Professor[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/course/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch professors for course ${courseId}`);
    }
    
    const data = await response.json();
    return data.map(normalizeProfessorData);
  } catch (error) {
    console.error(`Error in getProfessorsByCourse for course ${courseId}:`, error);
    
    // Fallback to client-side filtering if API endpoint doesn't exist
    console.log('Falling back to client-side filtering...');
    const allProfessors = await getAllProfessors();
    
    return Promise.all(
      allProfessors.map(async (prof) => {
        try {
          const detailedProf = await getProfessorById(prof.professor_id);
          return detailedProf;
        } catch (err) {
          return prof;
        }
      })
    ).then(professors => {
      return professors.filter(professor => {
        // Check if professor has this course assigned
        if (professor.courses && Array.isArray(professor.courses)) {
          return professor.courses.some(course => course.course_id === courseId);
        }
        if (professor.course_ids && Array.isArray(professor.course_ids)) {
          return professor.course_ids.includes(courseId);
        }
        return false;
      });
    });
  }
};

// Fetch a single professor by ID
export const getProfessorById = async (id: string): Promise<Professor> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch professor with id ${id}`);
    }
    
    const data = await response.json();
    console.log('Raw professor data from API:', data);
    
    // Make sure we normalize the data properly
    return normalizeProfessorData(data);
  } catch (error) {
    console.error(`Error in getProfessorById for ID ${id}:`, error);
    throw error;
  }
};

// Add function to get available course semesters
export const getCourseSemesters = async (courseId: string): Promise<{
  available_semesters: string[];
  assigned_professors: {
    professor_id: string;
    professor_name: string;
    semester: string;
  }[];
}> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/courses/${courseId}/professors`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch course professor assignments for ${courseId}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting course professor assignments for ${courseId}:`, error);
    throw error;
  }
};

// Get professor availability
export const getProfessorAvailability = async (professorId: string): Promise<ProfessorAvailability[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/${professorId}/availability`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch availability for professor ${professorId}`);
    }
    
    return await response.json();
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
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/${professorId}/availability`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ availability: availabilities })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update availability for professor ${professorId}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in setProfessorAvailability for professor ID ${professorId}:`, error);
    throw error;
  }
};

// Create a new professor
export const createProfessor = async (professor: Partial<Professor>): Promise<Professor> => {
  try {
    const token = localStorage.getItem('token');
    console.log('Creating professor with data:', professor);
    
    const response = await fetch(`${API_URL}/professors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(professor)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create professor');
    }
    
    const data = await response.json();
    return normalizeProfessorData(data);
  } catch (error) {
    console.error('Error in createProfessor:', error);
    throw error;
  }
};

// Update an existing professor
export const updateProfessor = async (id: string, professor: Partial<Professor>): Promise<Professor> => {
  try {
    const token = localStorage.getItem('token');
    console.log('Updating professor with ID:', id, 'Data:', professor);
    
    const response = await fetch(`${API_URL}/professors/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(professor)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update professor ${id}`);
    }
    
    const data = await response.json();
    return normalizeProfessorData(data);
  } catch (error) {
    console.error(`Error in updateProfessor for ID ${id}:`, error);
    throw error;
  }
};

// Delete a professor
export const deleteProfessor = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    console.log('Deleting professor with ID:', id);
    
    const response = await fetch(`${API_URL}/professors/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete professor ${id}`);
    }
    
    // Handle 204 No Content or empty response
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {
        success: true,
        message: 'Professor deleted successfully'
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in deleteProfessor for ID ${id}:`, error);
    throw error;
  }
};

// Delete multiple professors
export const deleteProfessors = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    console.log('Batch deleting professors:', ids);
    
    const response = await fetch(`${API_URL}/professors/batch-delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete professors');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in deleteProfessors:`, error);
    throw error;
  }
};

// Export the service methods
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
  getCourseSemesters
};

export default professorService;