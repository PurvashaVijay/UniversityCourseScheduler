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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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
      // Return mock data
      return [
        {
          course_id: "COURSE-001",
          department_id: "DEPT-001",
          course_name: "Introduction to Programming",
          duration_minutes: 55,
          is_core: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }
  },

  getCourseById: async (id: string): Promise<Course> => {
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
      // Return mock data
      return {
        course_id: id,
        department_id: "DEPT-001",
        course_name: "Sample Course",
        duration_minutes: 60,
        is_core: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
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
      // Return mock data
      return [
        {
          course_id: "COURSE-001",
          department_id: "DEPT-001",
          course_name: "Introduction to Programming",
          duration_minutes: 55,
          is_core: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }
  }
};

export default courseService;