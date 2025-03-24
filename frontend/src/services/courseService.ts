// src/services/courseService.ts

// Add Course type definition at the top
export interface Course {
  course_id: string;
  department_id: string;
  course_name: string;
  duration_minutes: number;
  is_core: boolean;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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

      return await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  },

  getCourseById: async (id: string): Promise<Course | null> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/courses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching course ${id}:`, error);
      return null;
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
  }
};

export default courseService;