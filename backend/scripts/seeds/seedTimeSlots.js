// seedTimeSlots.js - updated with correct path references
const { sequelize } = require('../../src/config/database');
const { TimeSlot } = require('../../app/models');
const { v4: uuidv4 } = require('uuid');

async function seedTimeSlots() {
  try {
    console.log('Starting time slot seeding...');
    
    // Check connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // First, delete existing time slots to avoid duplicates
    await TimeSlot.destroy({ where: {} });
    console.log('Cleared existing time slots.');
    
    // Define time slots
    const slots = [
      { name: 'Time Slot 1', start_time: '09:10:00', end_time: '10:05:00', duration_minutes: 55 },
      { name: 'Time Slot 2', start_time: '10:20:00', end_time: '11:15:00', duration_minutes: 55 },
      { name: 'Time Slot 3', start_time: '11:30:00', end_time: '12:25:00', duration_minutes: 55 },
      { name: 'Time Slot 4', start_time: '12:45:00', end_time: '14:05:00', duration_minutes: 80 },
      { name: 'Time Slot 5', start_time: '13:30:00', end_time: '14:50:00', duration_minutes: 80 },
      { name: 'Time Slot 6', start_time: '17:30:00', end_time: '20:30:00', duration_minutes: 180 },
      { name: 'Time Slot 7', start_time: '18:00:00', end_time: '21:00:00', duration_minutes: 180 }
    ];
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Create time slots for each day
    for (const day of days) {
      for (const slot of slots) {
        const timeslotId = `TS${slot.name.split(' ')[2]}-${day.substring(0, 3).toUpperCase()}`;
        console.log(`Creating time slot: ${timeslotId} - ${slot.name} on ${day}`);
        
        await TimeSlot.create({
          timeslot_id: timeslotId,
          name: slot.name,
          start_time: slot.start_time,
          end_time: slot.end_time,
          duration_minutes: slot.duration_minutes,
          day_of_week: day,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    console.log('Time slot seeding completed successfully.');
    
    // Verify the time slots were created
    const count = await TimeSlot.count();
    console.log(`Total time slots created: ${count}`);
    
  } catch (error) {
    console.error('Error seeding time slots:', error);
  } finally {
    process.exit(0);
  }
}

seedTimeSlots();