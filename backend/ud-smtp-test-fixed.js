// ud-smtp-test-fixed.js
const nodemailer = require('nodemailer');

// Create a transporter for UD's SMTP server with the correct hostname
const transporter = nodemailer.createTransport({
  host: 'mail.udel.edu',  // Use mail.udel.edu instead of smtp.udel.edu
  port: 25,
  secure: false,
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000
});

// Test email address - use your actual email
const testEmailAddress = 'tango@udel.edu'; // replace with your email

async function sendTestEmail() {
  try {
    console.log('Attempting to connect to UD SMTP server...');
    
    // First, verify the connection
    const connectionTest = await transporter.verify();
    console.log('Connection verified successfully!');
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: 'noreply@coursehen.udel.edu',
      to: testEmailAddress,
      subject: 'UD SMTP Test',
      text: 'This is a test email sent using the UD SMTP server.',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>UD SMTP Test</h2>
          <p>This is a test email sent using the UD SMTP server.</p>
          <p>If you received this, your connection to UD's SMTP server is working!</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
sendTestEmail();