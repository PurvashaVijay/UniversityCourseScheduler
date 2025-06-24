
# University Scheduler

A comprehensive system for automating the creation of university course schedules using constraint-based optimization. The system generates optimal schedules that satisfy complex requirements such as professor availability, course prerequisites, cross-program course sharing, and time slot constraints.

## 🏗️ Architecture Overview

The application uses a hybrid architecture combining a Node.js/Express backend with a Python-based constraint solving engine:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   React +       │     │  Node.js +       │     │  Python +           │
│   TypeScript    │◄───►│  Express +       │◄───►│  Google OR-Tools    │
│   Frontend      │     │  Sequelize ORM   │     │  Constraint Solver  │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
        ▲                        ▲
        │                        │
        └────────────┬───────────┘
                     ▼
               ┌──────────────┐
               │  PostgreSQL  │
               │  Database    │
               └──────────────┘
```

## 🚀 Key Features

### Multi-Program Course Association
- Courses can belong to multiple programs across departments
- Program-specific attributes (core status, number of classes)

### Advanced Scheduling Constraints
- Professor availability and qualifications
- Time slot duration matching
- Core course prioritization
- Pattern enforcement for multi-class courses (MW, TTh, MTTh)
- Balanced distribution across days

### Conflict Detection and Resolution
- Identification of scheduling conflicts
- Detailed explanations for unschedulable courses
- Manual override capabilities for administrators

### Flexible Time Management
- Support for variable course durations
- Different time slot patterns for different days
- Support for single, dual, and triple class scheduling

## 🔧 Technology Stack

**Frontend:**
- React with TypeScript
- Material UI
- User interfaces for administrators and professors
- Schedule visualization and conflict resolution

**Backend API:**
- Node.js with Express.js
- RESTful API
- Sequelize ORM for database operations
- JWT authentication

**Scheduler Engine:**
- Python with Google OR-Tools
- Constraint Programming (CP-SAT) solver
- Advanced constraints handling
- Pattern-based scheduling for multi-class courses

**Database:**
- PostgreSQL relational database
- Maintains data integrity through foreign key constraints

## 📁 Project Structure

```
university-scheduler/
├── backend/              # Node.js Express API
│   ├── app/
│   │   ├── models/       # Sequelize models
│   │   └── ...
│   ├── scripts/          # Setup and utility scripts
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # API controllers
│   │   ├── middleware/   # Auth middleware
│   │   ├── routes/       # API routes
│   │   ├── server.js     # Express setup
│   │   └── index.js      # Entry point
│   └── python/
│       ├── course_scheduler.py    # OR-Tools implementation
│       ├── scheduler_interface.py # Node.js interface
│       └── test_scheduler.py      # Testing script
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/       # Static assets
│       ├── components/   # React components
│       │   ├── admin/    # Admin interface components
│       │   ├── auth/     # Authentication components
│       │   └── common/   # Shared components
│       ├── contexts/     # React context providers
│       ├── services/     # API service modules
│       ├── App.tsx       # Main app component
│       └── index.tsx     # Entry point
├── config/               # Project configuration
├── docs/                 # Documentation
└── ...
```

## 🗄️ Data Model

### Core Entities
- **Department**: Academic departments (Computer Science, Economics, etc.)
- **Program**: Degree programs offered by departments
- **Course**: Individual courses with duration, department, and core status
- **Professor**: Faculty members with department affiliation and availability
- **TimeSlot**: Available teaching periods (e.g., "Morning 1", 9:10-10:05)
- **Semester**: Academic terms (Fall, Spring, etc.)

### Scheduling Entities
- **Schedule**: Generated timetables for a specific semester
- **ScheduledCourse**: Individual course assignments in a schedule (course + professor + timeslot)
- **Conflict**: Identified scheduling problems that need resolution

### Relationship Entities
- **CourseProgram**: Many-to-many relationship between courses and programs
- **CoursePrerequisite**: Self-referential relationship for prerequisites
- **ProfessorAvailability**: Tracks when professors are available to teach
- **ProfessorCourse**: Tracks which professors can teach which courses
- **CourseSemester**: Tracks which semesters a course is offered in

## ⚙️ Prerequisites

### Backend Requirements
- Node.js v22.14.0
- Python 3.10.1 or Python 3.9.6
- PostgreSQL 14
- OR-Tools library

### Frontend Requirements
- Node.js 14+
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd university-scheduler
```

### 2. Backend Setup
```bash
cd backend
npm install

# Install Python dependencies
pip install ortools>=9.12.4544
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Database Setup
```bash
# Create PostgreSQL database
# Run initial data seeding (departments, time slots, etc.)
# Create admin user
```

### 5. Environment Configuration
Create environment files with the following variables:
- Database connection parameters
- JWT secret and expiration
- Node.js and Python paths

## 🚀 Usage

### Start the Backend
```bash
cd backend
npm start
```

### Start the Frontend
```bash
cd frontend
npm start
```

### Run the Scheduler
The Python-based scheduling engine is automatically invoked through the Node.js API when generating schedules.

## 🔍 How It Works

### Scheduling Algorithm
The Python-based scheduling engine uses Google's OR-Tools CP-SAT solver to:

1. **Define Variables**: Course-professor-timeslot assignments
2. **Apply Hard Constraints**:
   - Professor qualification (can teach the course)
   - Professor availability (available at assigned times)
   - Time slot matching (course duration matches slot duration)
   - Pattern enforcement (proper day patterns for multi-class courses)
   - Core course conflict prevention
3. **Optimize Objectives**:
   - Maximize the number of scheduled courses
   - Distribute courses evenly across days
   - Balance professor workloads
   - Maintain consistent time slots for multi-class courses

### Component Communication
- **Node.js ↔ Python**: Data exchange via JSON through stdin/stdout
- **Node.js ↔ Database**: Sequelize ORM with transaction support
- **Node.js ↔ Frontend**: RESTful API with JWT authentication

