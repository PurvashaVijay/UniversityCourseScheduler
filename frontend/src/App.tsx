import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Course Scheduler</h1>
            <p>Welcome to the University Course Scheduling System</p>
            <div style={{ marginTop: '2rem' }}>
              <h2>Getting Started</h2>
              <p>This application helps universities manage course scheduling efficiently.</p>
              <ul>
                <li>Administrators can manage departments, programs, and courses</li>
                <li>Professors can set their availability</li>
                <li>The system automatically generates optimal schedules</li>
              </ul>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;