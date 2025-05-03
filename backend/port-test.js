// port-test.js
const nodemailer = require('nodemailer');

async function testSmtpConnection() {
  // Test ports
  const ports = [25, 465, 587];
  const secureOptions = [false, true, false]; // 25: no ssl, 465: ssl, 587: tls
  
  for (let i = 0; i < ports.length; i++) {
    const port = ports[i];
    const secure = secureOptions[i];
    
    console.log(`Testing connection to smtp.udel.edu on port ${port} (secure: ${secure})...`);
    
    try {
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: 'smtp.udel.edu',
        port: port,
        secure: secure,
        auth: null, // No auth
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
      
      // Verify the connection
      await transporter.verify();
      console.log(`SUCCESS! Connected to smtp.udel.edu on port ${port}!`);
    } catch (error) {
      console.error(`FAILED on port ${port}: ${error.message}`);
    }
  }
}

testSmtpConnection();