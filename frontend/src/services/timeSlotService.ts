// src/services/timeSlotService.ts

// Add TimeSlot type definition at the top
export interface TimeSlot {
  timeslot_id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  day_of_week: string;
  created_at: string;
  updated_at: string;
}

//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const timeSlotService = {
  getAllTimeSlots: async (): Promise<TimeSlot[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-slots`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch time slots');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching time slots:', error);
      // Return mock data for development
      return [
        {
          timeslot_id: "TS1-MON",
          name: "Morning 1",
          start_time: "09:10:00",
          end_time: "10:05:00",
          duration_minutes: 55,
          day_of_week: "Monday",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          timeslot_id: "TS2-MON",
          name: "Morning 2",
          start_time: "10:20:00",
          end_time: "11:15:00",
          duration_minutes: 55,
          day_of_week: "Monday",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }
  },

  getTimeSlotById: async (id: string): Promise<TimeSlot> => {
    // Mock implementation
    return {
      timeslot_id: id,
      name: "Sample Time Slot",
      start_time: "09:00:00",
      end_time: "10:30:00",
      duration_minutes: 90,
      day_of_week: "Monday",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  getTimeSlotsByDay: async (day: string): Promise<TimeSlot[]> => {
    // Mock implementation
    return [{
      timeslot_id: `TS1-${day.substring(0,3).toUpperCase()}`,
      name: "Sample Time Slot",
      start_time: "09:00:00",
      end_time: "10:30:00",
      duration_minutes: 90,
      day_of_week: day,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
  }
};

export default timeSlotService;