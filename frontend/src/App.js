/*import React from 'react';  
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;*/

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Placeholder components - replace these with your actual components when ready
const Login = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Login Page</h1>
    <div style={{ maxWidth: '300px', margin: '0 auto' }}>
      <div style={{ margin: '1rem 0' }}>
        <input type="text" placeholder="Email" style={{ width: '100%', padding: '0.5rem' }} />
      </div>
      <div style={{ margin: '1rem 0' }}>
        <input type="password" placeholder="Password" style={{ width: '100%', padding: '0.5rem' }} />
      </div>
      <button style={{ width: '100%', padding: '0.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
        Login
      </button>
    </div>
  </div>
);

const Dashboard = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Course Scheduler Dashboard</h1>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
      <div style={{ flex: '1 1 200px', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>Departments</h3>
        <p>5 departments</p>
      </div>
      <div style={{ flex: '1 1 200px', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>Courses</h3>
        <p>78 courses</p>
      </div>
      <div style={{ flex: '1 1 200px', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>Professors</h3>
        <p>60 professors</p>
      </div>
      <div style={{ flex: '1 1 200px', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>Conflicts</h3>
        <p>8 scheduling conflicts</p>
      </div>
    </div>
  </div>
);

const Unauthorized = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Access Denied</h1>
    <p>You don't have permission to access this page.</p>
    <button style={{ padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
      Back to Dashboard
    </button>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Main dashboard - will replace with protected routes later */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
