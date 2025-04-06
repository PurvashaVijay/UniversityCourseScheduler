const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the Python test script
//const pythonScriptPath = path.join(__dirname, 'python/test_scheduler.py');

const pythonScriptPath = path.join(__dirname, '../python/test_scheduler.py');
console.log('Python script path:', pythonScriptPath);

// Check if Python script exists
if (!fs.existsSync(pythonScriptPath)) {
  console.error(`Python script not found at ${pythonScriptPath}`);
  process.exit(1);
}

// Hardcode the venv python instead of 'python3':
const pythonCommand = 'C:\\Users\\shash\\.virtualenvs\\backend-wjcBA0vK\\Scripts\\python.exe';

// Try with python3 first
const pythonProcess = spawn('python3', [pythonScriptPath]);

let outputData = '';
let errorData = '';

// Collect output data
pythonProcess.stdout.on('data', (data) => {
  outputData += data.toString();
  console.log(`Python stdout: ${data}`);
});

// Collect error data
pythonProcess.stderr.on('data', (data) => {
  errorData += data.toString();
  console.error(`Python stderr: ${data}`);
});

// Handle process completion
pythonProcess.on('close', (code) => {
  console.log(`Python process exited with code ${code}`);
  
  if (code !== 0) {
    console.error(`Error: ${errorData}`);
    process.exit(1);
  }
  
  console.log('Python test successful!');
  process.exit(0);
});