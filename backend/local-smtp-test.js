// local-smtp-test.js
const nodemailer = require('nodemailer');

// Create a transporter using the local sendmail
const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'windows',
  path: '/usr/sbin/sendmail'
});

// Test email address - use your actual email
const testEmailAddress = 'tango@udel.edu'; // replace with your email

async function sendTestEmail() {
  try {
    console.log('Attempting to send email via local sendmail...');
    
    const info = await transporter.sendMail({
      from: 'noreply@coursehen.local',
      to: testEmailAddress,
      subject: 'Local SMTP Test',
      text: 'This is a test email sent using the local sendmail binary.',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Local SMTP Test</h2>
          <p>This is a test email sent using the local sendmail binary on your Mac.</p>
          <p>If you received this, your local SMTP is working!</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Run the function
sendTestEmail();