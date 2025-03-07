# Course Scheduling System - Architecture Document

## 1. Introduction

### 1.1 Purpose
This document describes the architectural design of the University Course Scheduling System - a platform designed to automate the creation and management of academic course schedules across multiple departments and programs while respecting various constraints.

### 1.2 Scope
This architecture covers all components of the scheduling system, including:
- Database design and data management
- Backend business logic and constraint solver
- Frontend interfaces for administrators and professors
- Integration and API design
- Deployment and operations

### 1.3 Goals
- Develop a reliable, maintainable scheduling system
- Support complex scheduling constraints and conflict resolution
- Provide intuitive interfaces for administrators and professors
- Enable real-time updates across departments
- Minimize scheduling conflicts while prioritizing core courses

## 2. System Overview

### 2.1 System Description
The Course Scheduling System is a web-based application that generates optimized course schedules by balancing multiple constraints:
- Professor availability preferences
- Core vs. elective course priorities
- Cross-program course requirements
- Time slot constraints and room availability
- Pre-requisite ordering

The system handles approximately 70-80 courses per semester across multiple departments, with around 60 professors and serving approximately 600 students.

### 2.2 User Roles
- **Department Administrators**: Add courses, set constraints, review and finalize schedules
- **Professors**: Provide availability information
- **Students**: No direct interaction (view final schedules through external systems)

### 2.3 Key Features
- Automated schedule generation based on defined constraints
- Manual override capabilities for administrators
- Conflict detection and resolution workflow
- Cross-department course coordination
- Historical schedule preservation

## 3. Architecture Principles

### 3.1 Separation of Concerns
The system separates data management, business logic, and presentation into distinct layers, allowing for independent development and maintenance.

### 3.2 Modularity
Components are designed as modular services that can be developed, tested, and deployed independently.

### 3.3 Constraint-Based Design
The core scheduling engine uses constraint satisfaction techniques to balance competing requirements and generate optimal schedules.

### 3.4 Security by Design
Authentication, authorization, and data protection are built into the architecture from the ground up.

### 3.5 Data Integrity
The system maintains transactional integrity and ensures that schedule changes are consistently applied across all relevant departments.

## 4. System Context

### 4.1 Context Diagram
┌───────────────────────────────────────────────────────────┐
│                                                           │
│                  Course Scheduling System                 │
│                                                           │
└───────────────┬──────────────────────┬───────────────────┘
│                      │
┌───────────▼────────┐   ┌─────────▼─────────┐
│                    │   │                   │
│   Administrator    │   │     Professor     │
│                    │   │                   │
└────────────────────┘   └───────────────────┘
### 4.2 External Systems
- No direct external system integrations in the initial phase
- System is designed to be self-contained

## 5. Components and Layers

### 5.1 Component Diagram
┌───────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                         │
│                                                                   │
│  ┌─────────────────────┐  ┌────────────────────┐  ┌──────────┐   │
│  │ Admin Web Interface │  │ Professor Portal   │  │  API     │   │
│  └─────────────────────┘  └────────────────────┘  └──────────┘   │
└────────────────┬──────────────────────┬───────────────┬──────────┘
│                      │               │
┌────────────────▼──────────────────────▼───────────────▼──────────┐
│                         Application Layer                         │
│                                                                   │
│  ┌────────────────┐  ┌───────────────┐  ┌────────────────────┐   │
│  │ Course Manager │  │ User Manager  │  │  Schedule Manager  │   │
│  └────────────────┘  └───────────────┘  └────────────────────┘   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Constraint Solver                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────┘
│
┌────────────────────────────────────▼───────────────────────────┐
│                          Data Access Layer                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Database Repositories                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬───────────────────────────┘
│
┌────────────────────────────────────▼───────────────────────────┐
│                         PostgreSQL Database                     │
└─────────────────────────────────────────────────────────────────┘
### 5.2 Presentation Layer
- Admin Web Interface: React-based SPA for department administrators
- Professor Portal: Simplified interface for professors to input availability
- API: RESTful APIs for communication between frontend and backend

### 5.3 Application Layer
- Course Manager: Handles course creation, modification, and association with programs
- User Manager: Manages admin and professor accounts, authentication
- Schedule Manager: Processes schedule creation, conflicts, and overrides
- Constraint Solver: Core algorithm that generates optimal schedules based on constraints

### 5.4 Data Access Layer
- Database Repositories: Abstracts database operations and provides business objects to the application layer

### 5.5 Database Layer
- PostgreSQL database storing all system data according to the defined schema

## 6. Data Architecture

### 6.1 Database Schema Overview
The system uses a PostgreSQL relational database with the following key entities:

- **Department**: Academic departments offering courses
- **Program**: Master's programs within departments
- **Course**: Academic courses with core/elective designation
- **Professor**: Faculty members who teach courses
- **TimeSlot**: Available time slots for scheduling
- **ProfessorAvailability**: Records when professors can teach
- **Schedule**: Complete semester schedules
- **ScheduledCourse**: Placement of courses in time slots
- **Conflict**: Records of scheduling conflicts requiring resolution

See the complete database schema in `database/schema.sql`.

### 6.2 Data Flow
1. Administrators input courses and constraints
2. Professors provide availability
3. Constraint solver generates schedule
4. Administrators review conflicts and apply overrides
5. Final schedule is stored and distributed

### 6.3 Data Management
- The system maintains historical data of past schedules indefinitely
- All modifications to schedules are tracked with timestamps
- Critical operations use transactions to ensure data consistency

## 7. API Design

### 7.1 API Principles
- RESTful design
- JSON data format
- Authentication required for all endpoints
- Role-based access control
- Versioned API endpoints

### 7.2 Key API Endpoints

#### Course Management
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create a new course
- `GET /api/courses/{id}` - Get course details
- `PUT /api/courses/{id}` - Update course
- `DELETE /api/courses/{id}` - Delete course

#### Professor Management
- `GET /api/professors` - List all professors
- `POST /api/professors` - Create a new professor
- `GET /api/professors/{id}/availability` - Get professor availability
- `POST /api/professors/{id}/availability` - Set professor availability

#### Schedule Management
- `POST /api/schedules/generate` - Generate a new schedule
- `GET /api/schedules/{id}` - Get schedule details
- `GET /api/schedules/{id}/conflicts` - List conflicts in a schedule
- `POST /api/schedules/{id}/overrides` - Apply manual override

## 8. Security Architecture

### 8.1 Authentication
- JWT-based authentication
- Secure password storage using bcrypt
- Session timeout after period of inactivity

### 8.2 Authorization
- Role-based access control (RBAC)
- Department-level access restrictions
- API endpoint permissions based on user role

### 8.3 Data Protection
- HTTPS for all communications
- Database encryption for sensitive data
- Input validation and sanitization
- Protection against common web vulnerabilities (XSS, CSRF)

## 9. Deployment Architecture

### 9.1 Deployment Options
The system can be deployed in two ways:
1. On-premises deployment within university infrastructure
2. Cloud-based deployment on AWS, Azure, or GCP

### 9.2 Deployment Diagram (Cloud Option)
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│   Load Balancer     │────▶│   Web Servers       │
│                     │     │                     │
└─────────────────────┘     └──────────┬──────────┘
│
▼
┌─────────────────────┐
│                     │
│   API Servers       │
│                     │
└──────────┬──────────┘
│
┌────────────────────┬─┴───────────────────┐
│                    │                     │
┌────────────────▼─────┐   ┌──────────▼────────┐   ┌────────▼─────────┐
│                      │   │                   │   │                  │
│   PostgreSQL DB      │   │   Redis Cache     │   │   File Storage   │
│                      │   │                   │   │                  │
└──────────────────────┘   └───────────────────┘   └──────────────────┘
### 9.3 Infrastructure Requirements
- Web and API servers: 2+ instances for redundancy
- Database: PostgreSQL with replication for high availability
- Caching: Redis for performance optimization
- File storage: For document storage and exports
- CI/CD pipeline for automated deployment

## 10. Performance Considerations

### 10.1 Performance Requirements
- Schedule generation: Complete within 1-2 minutes
- UI responsiveness: < 2 second response time for most operations
- Support for 50+ concurrent users

### 10.2 Optimization Strategies
- Database indexing for frequently accessed data
- Caching of generated schedules and common queries
- Asynchronous processing for schedule generation
- Pagination for large data sets

## 11. Technology Stack

### 11.1 Frontend
- **Framework**: React.js
- **State Management**: Redux
- **UI Components**: Material-UI
- **HTTP Client**: Axios

### 11.2 Backend
- **API Framework**: Node.js with Express
- **Constraint Solver**: Python with OR-Tools or similar
- **Authentication**: JWT
- **Validation**: Joi or similar

### 11.3 Database
- **RDBMS**: PostgreSQL 14+
- **ORM**: Sequelize, TypeORM, or similar

### 11.4 DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions or Jenkins
- **Monitoring**: Prometheus and Grafana

## 12. Development Approach

### 12.1 Development Methodology
- Agile/Scrum with 2-week sprints
- Feature-driven development

### 12.2 Testing Strategy
- Unit testing with Jest for frontend and backend
- Integration testing for API endpoints
- End-to-end testing with Cypress
- Performance testing for the constraint solver

### 12.3 Coding Standards
- ESLint and Prettier for code formatting
- Code reviews required for all pull requests
- Documentation for all APIs and key components

## 13. Implementation Roadmap

### 13.1 Phase 1: Foundation
- Database setup
- Basic user management
- Core data models implementation

### 13.2 Phase 2: Core Functionality
- Course and program management
- Professor availability management
- Basic scheduling algorithm

### 13.3 Phase 3: Complete System
- Advanced constraint handling
- Conflict resolution workflow
- UI refinement and usability improvements

### 13.4 Phase 4: Optimization and Enhancement
- Performance optimization
- Additional features based on user feedback
- Extended reporting capabilities

## 14. Appendices

### 14.1 Glossary
- **Core Course**: Required course for a program
- **Elective Course**: Optional course for a program
- **Constraint**: Rule that must be followed in scheduling
- **Override**: Manual adjustment to the generated schedule
- **Conflict**: Situation where constraints cannot be simultaneously satisfied

### 14.2 References
- Database Schema Documentation
- Requirements Specification Document