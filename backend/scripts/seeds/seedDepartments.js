// backend/scripts/seeds/seedDepartments.js
const Department = require('../../app/models/Department');
const { v4: uuidv4 } = require('uuid');

async function seedDepartments() {
  try {
    const departments = [
      {
        department_id: `DEPT-${uuidv4().substring(0, 8).toUpperCase()}`,
        name: 'Computer Science',
        description: 'CS Department'
      },
      {
        department_id: `DEPT-${uuidv4().substring(0, 8).toUpperCase()}`,
        name: 'Economics',
        description: 'Economics Department'
      }
      // Add more departments as needed
    ];
    
    for (const dept of departments) {
      await Department.findOrCreate({
        where: { name: dept.name },
        defaults: dept
      });
    }
    
    console.log('Departments seeded successfully');
  } catch (error) {
    console.error('Error seeding departments:', error);
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  seedDepartments().finally(() => process.exit());
}

module.exports = seedDepartments;