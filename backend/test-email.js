// backend/test-email.js
const nodemailer = require('nodemailer');

// Replace with your own email address
const YOUR_EMAIL = 'tango@udel.edu';

// Create transporter for UD's SMTP server
const transporter = nodemailer.createTransport({
  host: 'smtp.udel.edu',
  port: 25,
  secure: false, // No SSL/TLS
  // No auth needed according to the client
});

async function sendTestEmail() {
  try {
    console.log('Sending test email...');
    
    const info = await transporter.sendMail({
      from: '"CourseHen Test" <noreply@coursehen.udel.edu>',
      to: YOUR_EMAIL,
      subject: 'Test Email from CourseHen',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #00539F;">CourseHen Email Test</h1>
          <p>This is a test email to verify that UD's SMTP server configuration is working correctly.</p>
          <p>If you're receiving this email, it means the SMTP configuration is properly set up!</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

// Run the function
sendTestEmail();