/**
 * Database initialization script
 * 
 * This script initializes the database with default data:
 * - Default time slots
 * - Super admin user
 */

const mongoose = require('mongoose');
const TimeSlot = require('../backend/app/models/TimeSlot');
const User = require('../backend/app/models/User');
require('dotenv').config();

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Initialize default time slots
    await TimeSlot.initializeDefaultTimeSlots();
    
    // Check if super admin exists
    const adminExists = await User.findOne({ role: 'super_admin' });
    
    if (!adminExists) {
      // Create super admin user
      const superAdmin = new User({
        name: 'System Administrator',
        email: 'admin@example.com',
        username: 'admin',
        password: process.env.ADMIN_INITIAL_PASSWORD || 'admin123!',
        role: 'super_admin'
      });
      
      await superAdmin.save();
      console.log('Super admin user created');
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the initialization
initializeDatabase();