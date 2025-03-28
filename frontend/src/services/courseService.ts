// src/services/courseService.ts

// Updated Course interface with correct fields and optional properties
export interface Course {
  course_id: string;
  program_id?: string;  // Make optional to handle different backend responses
  department_id?: string; // Make optional
  name?: string; 
  course_name?: string; // For backend compatibility
  description?: string;
  duration_minutes: number;
  is_core: boolean;
  semesters?: string[];  // Optional array of semesters
  semester?: string;     // Optional single semester
  created_at?: string;
  updated_at?: string;
  program?: any;
  programs?: any[];      // For courses with multiple programs
  prerequisites?: any[];
  Department?: any;      // For Department association
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Get courses by program - simplified and robust
export const getCoursesByProgram = async (programId: string): Promise<Course[]> => {
  try {
    const token = localStorage.getItem('token');
    console.log(`Fetching courses for program ${programId}`);
    
    const response = await fetch(`${API_URL}/courses/program/${programId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch courses by program: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Received raw data for program ${programId}:`, data);
    
    // Ensure we return an array
    if (!Array.isArray(data)) {
      console.warn('API did not return an array, received:', typeof data);
      return [];
    }
    
    // Normalize the data to ensure consistent structure
    const normalizedCourses = data.map(course => ({
      course_id: course.course_id,
      program_id: programId,
      course_name: course.course_name || '',
      name: course.name || course.course_name || '',
      description: course.description || '',
      department_id: course.department_id || '',
      duration_minutes: course.duration_minutes || 0,
      is_core: Boolean(course.is_core)
    }));
    
    console.log(`Normalized ${normalizedCourses.length} courses for program ${programId}`);
    return normalizedCourses;
  } catch (error) {
    console.error(`Error fetching courses for program ${programId}:`, error);
    return [];
  }
};

// Create a new course
export const createCourse = async (course: Partial<Course>): Promise<Course> => {
  try {
    const token = localStorage.getItem('token');
    
    // Map the frontend course model to match what the backend expects
    const backendCourse = {
      course_id: course.course_id,
      department_id: course.department_id,
      course_name: course.name || course.course_name, // Handle both name fields
      duration_minutes: course.duration_minutes,
      is_core: course.is_core,
      program_id: course.program_id, // Send single program_id
      semesters: course.semesters // Include semesters array
    };
    
    console.log('Creating course with data:', backendCourse);
    
    const response = await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(backendCourse)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create course');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Update a course
export const updateCourse = async (id: string, course: Partial<Course>): Promise<Course> => {
  try {
    const token = localStorage.getItem('token');
    
    console.log(`Updating course ${id} with data:`, course);
    
    // Map the frontend course model to match what the backend expects
    const backendCourse = {
      course_name: course.name || course.course_name, // Handle both name fields
      department_id: course.department_id,
      duration_minutes: course.duration_minutes,
      is_core: course.is_core,
      program_id: course.program_id, // Send single program_id
      semesters: course.semesters // Include semesters array
    };
    
    const response = await fetch(`${API_URL}/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(backendCourse)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update course');
    }

    const responseData = await response.json();
    
    // Return either the course field if it exists, or the whole response
    return responseData.course || responseData;
  } catch (error) {
    console.error(`Error updating course ${id}:`, error);
    throw error;
  }
};

// Delete a course
export const deleteCourse = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    console.log(`Attempting to delete course with ID: ${id}`);
    
    const response = await fetch(`${API_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete course');
    }

    // Handle 204 No Content or empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {
        success: true,
        message: 'Course deleted successfully'
      };
    }

    try {
      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Course deleted successfully'
      };
    } catch (parseError) {
      // If JSON parsing fails but request was successful
      return {
        success: true,
        message: 'Course deleted successfully'
      };
    }
  } catch (error) {
    console.error(`Error deleting course ${id}:`, error);
    throw error;
  }
};

// Delete multiple courses
export const deleteCourses = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
  try {
    // For backend compatibility, handle batch deletes as individual deletes if endpoint not available
    const token = localStorage.getItem('token');
    console.log(`Attempting to delete multiple courses: ${ids.join(', ')}`);
    
    // For single course, use the single delete endpoint
    if (ids.length === 1) {
      return await deleteCourse(ids[0]);
    }
    
    // Try using the batch-delete endpoint first
    try {
      const response = await fetch(`${API_URL}/courses/batch-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: data.message || 'Courses deleted successfully'
        };
      }
      
      // If batch endpoint fails, fall back to individual deletes
      console.log('Batch delete endpoint failed, falling back to individual deletes');
    } catch (batchError) {
      console.log('Error with batch delete, falling back to individual deletes:', batchError);
    }
    
    // Individual delete fallback
    const deletePromises = ids.map(id => deleteCourse(id));
    const results = await Promise.all(deletePromises);
    
    // Check if all deletions were successful
    const allSuccessful = results.every(result => result.success);
    
    return {
      success: allSuccessful,
      message: allSuccessful 
        ? 'All courses deleted successfully' 
        : 'Some courses could not be deleted'
    };
  } catch (error) {
    console.error(`Error deleting courses:`, error);
    throw error;
  }
};

// Get course by ID - Enhanced version
export const getCourseById = async (id: string): Promise<Course | null> => {
  try {
    const token = localStorage.getItem('token');
    console.log(`Fetching course with ID: ${id}`);
    
    const response = await fetch(`${API_URL}/courses/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch course: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Received course data for ID ${id}:`, data);
    
    // Transform the data to ensure consistency
    return {
      course_id: data.course_id,
      course_name: data.course_name || '',
      name: data.name || data.course_name || '',
      department_id: data.department_id || '',
      duration_minutes: data.duration_minutes || 0,
      is_core: Boolean(data.is_core),
      // Extract program_id from programs array if available
      program_id: data.program_id || (data.programs && data.programs.length > 0 ? data.programs[0].program_id : ''),
      // Include other fields as needed
      programs: data.programs || [],
      semesters: data.semesters || [],
      prerequisites: data.prerequisites || [],
      description: data.description || '',
      Department: data.Department || null
    };
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    return null;
  }
};

const courseService = {
  getAllCourses: async (): Promise<Course[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  },

  getCoursesByProfessor: async (professorId: string): Promise<Course[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/courses/professor/${professorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses by professor');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching courses for professor ${professorId}:`, error);
      return [];
    }
  },
  
  // Including the updated methods in the courseService object
  getCourseById,
  getCoursesByProgram,
  createCourse,
  updateCourse,
  deleteCourse,
  deleteCourses
};

export default courseService;