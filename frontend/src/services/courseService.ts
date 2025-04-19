// src/services/courseService.ts
// program association interface
  export interface ProgramAssociation {
    program_id: string;
    name?: string;
    department_id?: string;
    is_core: boolean;
    num_classes?: number; // Make num_classes optional
  }
// Updated Course interface with correct fields and optional properties
export interface Course {
  course_id: string;
  program_id?: string;  // Make optional to handle different backend responses
  department_id: string; // Required field
  name?: string; 
  course_name: string; // For backend compatibility
  description?: string;
  duration_minutes: number;
  is_core: boolean;
  numClasses?: number; // Add this new field
  semesters?: string[];  // Optional array of semesters
  semester?: string;     // Optional single semester
  created_at: string;
  updated_at: string;
  program?: any;
  //programs?: any[];      // For courses with multiple programs
  programs?: ProgramAssociation[];  // Add this for multiple programs
  program_associations?: ProgramAssociation[];  // For sending to API
  prerequisites?: any[];
  Department?: any;      // For Department association
  professor_course?: {   // Add professor_course property
    semester: string;
  };
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Get courses by program - enhanced with detailed logging and better error handling
export const getCoursesByProgram = async (programId: string): Promise<Course[]> => {
  try {
    const token = localStorage.getItem('token');
    console.log(`Making API request for program ${programId}`);
    
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
    console.log(`Raw API response for program ${programId}:`, data);
    
    // Ensure we return an array
    if (!Array.isArray(data)) {
      console.warn('API did not return an array, received:', typeof data);
      return [];
    }
    
    // Normalize the data to ensure consistent structure with numClasses properly mapped
    const normalizedCourses = data.map(course => ({
      course_id: course.course_id,
      program_id: programId,
      course_name: course.course_name || '',
      name: course.name || course.course_name || '',
      description: course.description || '',
      department_id: course.department_id || '',
      duration_minutes: course.duration_minutes || 0,
      is_core: Boolean(course.is_core), // Explicitly convert to boolean
      // Map the num_classes field to numClasses for frontend use
      numClasses: course.num_classes || 1,
      // Ensure semesters is always an array
      semesters: Array.isArray(course.semesters) ? course.semesters : 
               (course.semesters ? [course.semesters] : []),
      created_at: course.created_at || '',
      updated_at: course.updated_at || '',
      // Include professor_course if available
      professor_course: course.professor_course,
      // Include semester if available
      semester: course.semester
    }));
    
    console.log(`Normalized ${normalizedCourses.length} courses for program ${programId}`);
    console.log('Sample normalized course:', normalizedCourses.length > 0 ? JSON.stringify(normalizedCourses[0], null, 2) : 'No courses');
    
    return normalizedCourses;
  } catch (error) {
    console.error(`Error fetching courses for program ${programId}:`, error);
    return [];
  }
};

// Get semesters for a course - new function
export const getCourseSemesters = async (courseId: string): Promise<string[]> => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/courses/${courseId}/semesters`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch semesters for course ${courseId}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`Retrieved semesters for course ${courseId}:`, data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching semesters for course ${courseId}:`, error);
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
      program_associations: course.program_associations, // Add this for multiple programs
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

    // Log the response status to help diagnose issues
    console.log(`Course creation response status: ${response.status}`);
    
    // Check if response is ok (status in the 200-299 range)
    if (!response.ok) {
      // Log the status code and response text for debugging
      console.error(`HTTP error ${response.status}: ${response.statusText}`);
      
      // Try to get more detailed error info from the response
      let errorMessage = `Failed to create course: HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.error) {
          console.error('Detailed error:', errorData.error);
        }
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    // For successful responses, carefully handle the response body
    try {
      // Get the response content type
      const contentType = response.headers.get('content-type');
      
      // Only try to parse JSON if the content type is json
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // If not JSON, create a synthetic success response
        return {
          course_id: course.course_id,
          course_name: course.name || course.course_name,
          department_id: course.department_id,
          duration_minutes: course.duration_minutes || 0,
          is_core: course.is_core || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Course;
      }
    } catch (parseError) {
      console.error('Error parsing successful response:', parseError);
      // Return a basic course object as fallback
      return {
        course_id: course.course_id,
        course_name: course.name || course.course_name,
        department_id: course.department_id,
        duration_minutes: course.duration_minutes || 0,
        is_core: course.is_core || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Course;
    }
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
    
    // Ensure program associations are properly formatted
    const backendCourse = {
      course_name: course.name || course.course_name, 
      department_id: course.department_id,
      duration_minutes: course.duration_minutes,
      is_core: Boolean(course.is_core),
      program_id: course.program_id, // For backward compatibility
      // Make sure ALL program associations are included
      program_associations: course.program_associations?.map(pa => ({
        program_id: pa.program_id,
        is_core: Boolean(pa.is_core),
        num_classes: pa.num_classes || 1
      })),
      semesters: course.semesters 
    };
    
    console.log('Sending data to backend:', backendCourse);
    
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

// Get course by ID - Enhanced version with proper semester handling
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
    console.log('numClasses or num_classes value:', data.numClasses || data.num_classes);
    
    // Transform the data to ensure consistency
    return {
      course_id: data.course_id,
      course_name: data.course_name || '',
      name: data.name || data.course_name || '',
      department_id: data.department_id || '',
      duration_minutes: data.duration_minutes || 0,
      is_core: Boolean(data.is_core),
      // Extract numClasses from the response
      numClasses: data.numClasses || (data.num_classes || 1),
      // Include other fields as needed
      program_id: data.program_id || (data.programs && data.programs.length > 0 ? data.programs[0].program_id : ''),
      programs: data.programs || [],
      // Ensure semesters are always an array
      semesters: Array.isArray(data.semesters) ? data.semesters : 
               (data.semesters ? [data.semesters] : []),
      prerequisites: data.prerequisites || [],
      description: data.description || '',
      Department: data.Department || null,
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      // Include professor_course if available
      professor_course: data.professor_course,
      // Include semester if available
      semester: data.semester
    };
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    return null;
  }
};

// Debug endpoint for program courses
export const debugCoursesByProgram = async (programId: string): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    console.log(`Debugging courses for program ${programId}`);
    
    const response = await fetch(`${API_URL}/courses/debug/${programId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Debug endpoint failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Debug data for program ${programId}:`, data);
    return data;
  } catch (error) {
    console.error(`Error debugging courses for program ${programId}:`, error);
    // Fixed TypeScript error by checking if error is an instance of Error
    return { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

const courseService = {
  getAllCourses: async (): Promise<Course[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log("Attempting to fetch all courses with token:", token ? "Token exists" : "No token");
      
      const response = await fetch(`${API_URL}/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Response status:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch courses: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Courses data received:", data);
      return data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Return empty array but log the detailed error
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
  deleteCourses,
  getCourseSemesters,
  debugCoursesByProgram
};

export default courseService;