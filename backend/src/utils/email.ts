import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { IEmailOptions } from '../types/index';

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(options: IEmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendOTPEmail(email: string, otp: string): Promise<void> {
    const emailOptions: IEmailOptions = {
      to: email,
      subject: 'Your OTP for Note App Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #333; margin-bottom: 30px; }
            .otp-code { background-color: #2563eb; color: white; padding: 15px 25px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
            .warning { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 10px; margin: 20px 0; color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Note App</h1>
              <h2>Email Verification</h2>
            </div>
            <p>Hello!</p>
            <p>Thank you for registering with Note App. To complete your registration, please use the following One-Time Password (OTP):</p>
            <div class="otp-code">${otp}</div>
            <div class="warning">
              <strong>⚠️ Important:</strong> This OTP will expire in 10 minutes for security purposes.
            </div>
            <p>If you didn't create an account with Note App, please ignore this email.</p>
            <div class="footer">
              <p>Best regards,<br>The Note App Team</p>
              <p style="font-size: 12px; color: #888;">This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await this.sendEmail(emailOptions);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const emailOptions: IEmailOptions = {
      to: email,
      subject: 'Welcome to Note App! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Note App</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #333; margin-bottom: 30px; }
            .welcome-section { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Note App</h1>
            </div>
            <div class="welcome-section">
              <h2>Welcome, ${name}! 🎉</h2>
              <p>Your email has been successfully verified and your account is now active.</p>
            </div>
            <p>You can now start creating and managing your notes with ease. Here's what you can do:</p>
            <ul>
              <li>✍️ Create unlimited notes</li>
              <li>📱 Access your notes from any device</li>
              <li>🔐 Your data is secure and encrypted</li>
              <li>🚀 Fast and reliable performance</li>
            </ul>
            <p>Thank you for choosing Note App. We're excited to help you stay organized!</p>
            <div class="footer">
              <p>Best regards,<br>The Note App Team</p>
              <p style="font-size: 12px; color: #888;">This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await this.sendEmail(emailOptions);
  }

  // Test email connection
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
