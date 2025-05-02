// src/services/emailService.js
const nodemailer = require('nodemailer');

console.log('Initializing email service with UD SMTP...');

// Create a transporter using UD SMTP with correct settings
const transporter = nodemailer.createTransport({
  host: 'mail.udel.edu',  // Correct hostname!
  port: 25,
  secure: false,
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  }
});

// Function to send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  console.log(`Sending password reset email to: ${email}`);
  
  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  // Email content
  const mailOptions = {
    from: 'noreply@coursehen.udel.edu',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="background-color: #00539F; padding: 20px; text-align: center; color: white;">
          <h1>CourseHen Password Reset</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hello,</p>
          <p>We received a request to reset your password for your CourseHen account. Click the button below to reset your password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #00539F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Your Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have questions.</p>
          <p>Best regards,<br/>The CourseHen Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px;">
          <p>© ${new Date().getFullYear()} University of Delaware. All rights reserved.</p>
        </div>
      </div>
    `
  };
  
  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

console.log('UD SMTP email service initialized successfully');

module.exports = {
  sendPasswordResetEmail
};