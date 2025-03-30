// src/services/timeSlotService.ts

// Add TimeSlot type definition
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

// Mock data for time slots - comprehensive set covering all days of the week
const MOCK_TIMESLOTS: TimeSlot[] = [
  // Monday slots
  {
    timeslot_id: "TS1-MON",
    name: "Morning 1",
    start_time: "09:10:00",
    end_time: "10:05:00",
    duration_minutes: 55,
    day_of_week: "Monday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS2-MON",
    name: "Morning 2",
    start_time: "10:20:00",
    end_time: "11:15:00",
    duration_minutes: 55,
    day_of_week: "Monday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS3-MON",
    name: "Morning 3",
    start_time: "11:30:00",
    end_time: "12:25:00",
    duration_minutes: 55,
    day_of_week: "Monday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS4-MON",
    name: "Afternoon 1",
    start_time: "12:45:00",
    end_time: "14:05:00",
    duration_minutes: 80,
    day_of_week: "Monday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS5-MON",
    name: "Afternoon 2",
    start_time: "13:30:00",
    end_time: "14:50:00",
    duration_minutes: 80,
    day_of_week: "Monday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS6-MON",
    name: "Evening 1",
    start_time: "17:30:00",
    end_time: "20:30:00",
    duration_minutes: 180,
    day_of_week: "Monday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS7-MON",
    name: "Evening 2",
    start_time: "18:00:00",
    end_time: "21:00:00",
    duration_minutes: 180,
    day_of_week: "Monday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  
  // Tuesday slots
  {
    timeslot_id: "TS1-TUE",
    name: "Morning 1",
    start_time: "09:10:00",
    end_time: "10:05:00",
    duration_minutes: 55,
    day_of_week: "Tuesday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS2-TUE",
    name: "Morning 2",
    start_time: "10:20:00",
    end_time: "11:15:00",
    duration_minutes: 55,
    day_of_week: "Tuesday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS3-TUE",
    name: "Morning 3",
    start_time: "11:30:00",
    end_time: "12:25:00",
    duration_minutes: 55,
    day_of_week: "Tuesday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS4-TUE",
    name: "Afternoon 1",
    start_time: "12:45:00",
    end_time: "14:05:00",
    duration_minutes: 80,
    day_of_week: "Tuesday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS5-TUE",
    name: "Afternoon 2",
    start_time: "13:30:00",
    end_time: "14:50:00",
    duration_minutes: 80,
    day_of_week: "Tuesday", 
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  
  // Wednesday slots
  {
    timeslot_id: "TS1-WED",
    name: "Morning 1",
    start_time: "09:10:00",
    end_time: "10:05:00",
    duration_minutes: 55,
    day_of_week: "Wednesday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS2-WED",
    name: "Morning 2",
    start_time: "10:20:00",
    end_time: "11:15:00",
    duration_minutes: 55,
    day_of_week: "Wednesday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS3-WED",
    name: "Morning 3",
    start_time: "11:30:00",
    end_time: "12:25:00",
    duration_minutes: 55,
    day_of_week: "Wednesday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  
  // Thursday slots  
  {
    timeslot_id: "TS1-THU",
    name: "Morning 1",
    start_time: "09:10:00",
    end_time: "10:05:00",
    duration_minutes: 55,
    day_of_week: "Thursday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS2-THU",
    name: "Morning 2",
    start_time: "10:20:00",
    end_time: "11:15:00",
    duration_minutes: 55,
    day_of_week: "Thursday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  
  // Friday slots
  {
    timeslot_id: "TS1-FRI",
    name: "Morning 1",
    start_time: "09:10:00",
    end_time: "10:05:00",
    duration_minutes: 55,
    day_of_week: "Friday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    timeslot_id: "TS2-FRI",
    name: "Morning 2",
    start_time: "10:20:00",
    end_time: "11:15:00",
    duration_minutes: 55,
    day_of_week: "Friday",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.random() * 300 + 100); // Random delay between 100-400ms

const timeSlotService = {
  getAllTimeSlots: async (): Promise<TimeSlot[]> => {
    try {
      // Simulate API delay
      await randomDelay();
      return [...MOCK_TIMESLOTS];
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  },

  getTimeSlotById: async (id: string): Promise<TimeSlot> => {
    try {
      await randomDelay();
      const timeSlot = MOCK_TIMESLOTS.find(ts => ts.timeslot_id === id);
      
      if (!timeSlot) {
        throw new Error(`Time slot with ID ${id} not found`);
      }
      
      return timeSlot;
    } catch (error) {
      console.error(`Error fetching time slot with ID ${id}:`, error);
      
      // Return a default time slot if not found
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
    }
  },

  getTimeSlotsByDay: async (day: string): Promise<TimeSlot[]> => {
    try {
      await randomDelay();
      return MOCK_TIMESLOTS.filter(timeSlot => timeSlot.day_of_week === day);
    } catch (error) {
      console.error(`Error fetching time slots for day ${day}:`, error);
      
      // Return a default time slot if error
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
  },
  
  // Additional service methods as needed
  createTimeSlot: async (timeSlot: Partial<TimeSlot>): Promise<TimeSlot> => {
    try {
      await randomDelay();
      
      // Create new time slot
      const newTimeSlot: TimeSlot = {
        timeslot_id: timeSlot.timeslot_id || `TS-${Math.floor(Math.random() * 1000)}`,
        name: timeSlot.name || "New Time Slot",
        start_time: timeSlot.start_time || "00:00:00",
        end_time: timeSlot.end_time || "00:00:00",
        duration_minutes: timeSlot.duration_minutes || 0,
        day_of_week: timeSlot.day_of_week || "Monday",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newTimeSlot;
    } catch (error) {
      console.error('Error creating time slot:', error);
      throw error;
    }
  },
  
  updateTimeSlot: async (id: string, timeSlot: Partial<TimeSlot>): Promise<TimeSlot> => {
    try {
      await randomDelay();
      
      // Find existing time slot
      const existingTimeSlot = MOCK_TIMESLOTS.find(ts => ts.timeslot_id === id);
      
      if (!existingTimeSlot) {
        throw new Error('Time slot not found');
      }
      
      // Update time slot
      const updatedTimeSlot: TimeSlot = {
        ...existingTimeSlot,
        ...timeSlot,
        updated_at: new Date().toISOString()
      };
      
      return updatedTimeSlot;
    } catch (error) {
      console.error(`Error updating time slot with ID ${id}:`, error);
      throw error;
    }
  },
  
  deleteTimeSlot: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await randomDelay();
      return { success: true, message: 'Time slot deleted successfully' };
    } catch (error) {
      console.error(`Error deleting time slot with ID ${id}:`, error);
      throw error;
    }
  }
};

export default timeSlotService;