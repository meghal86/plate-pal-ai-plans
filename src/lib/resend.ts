import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface EmailTemplate {
  welcome: (userName: string, loginUrl?: string) => EmailData;
  passwordReset: (userName: string, resetUrl: string) => EmailData;
  notification: (userName: string, message: string) => EmailData;
}

// Default sender email - you may need to verify this domain with Resend
const DEFAULT_FROM = 'noreply@yourdomain.com';

/**
 * Send an email using Resend
 */
export async function sendEmail(emailData: EmailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailData.from || DEFAULT_FROM,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Email templates for common use cases
 */
export const emailTemplates: EmailTemplate = {
  welcome: (userName: string, loginUrl?: string) => ({
    to: '',
    subject: 'Welcome to NourishPlate!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to NourishPlate, ${userName}!</h1>
        <p>Thank you for joining our community of healthy eating enthusiasts.</p>
        <p>We're excited to help you on your journey to better nutrition and wellness.</p>
        ${loginUrl ? `<p><a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Started</a></p>` : ''}
        <p>Best regards,<br>The NourishPlate Team</p>
      </div>
    `,
    text: `Welcome to NourishPlate, ${userName}! Thank you for joining our community of healthy eating enthusiasts. We're excited to help you on your journey to better nutrition and wellness. ${loginUrl ? `Get started: ${loginUrl}` : ''} Best regards, The NourishPlate Team`,
  }),

  passwordReset: (userName: string, resetUrl: string) => ({
    to: '',
    subject: 'Reset Your NourishPlate Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password for your NourishPlate account.</p>
        <p><a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The NourishPlate Team</p>
      </div>
    `,
    text: `Hi ${userName}, We received a request to reset your password for your NourishPlate account. Reset your password: ${resetUrl} If you didn't request this password reset, please ignore this email. This link will expire in 24 hours. Best regards, The NourishPlate Team`,
  }),

  notification: (userName: string, message: string) => ({
    to: '',
    subject: 'NourishPlate Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">NourishPlate Notification</h1>
        <p>Hi ${userName},</p>
        <p>${message}</p>
        <p>Best regards,<br>The NourishPlate Team</p>
      </div>
    `,
    text: `Hi ${userName}, ${message} Best regards, The NourishPlate Team`,
  }),
};

/**
 * Send a welcome email
 */
export async function sendWelcomeEmail(to: string, userName: string, loginUrl?: string) {
  const emailData = emailTemplates.welcome(userName, loginUrl);
  emailData.to = to;
  return sendEmail(emailData);
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(to: string, userName: string, resetUrl: string) {
  const emailData = emailTemplates.passwordReset(userName, resetUrl);
  emailData.to = to;
  return sendEmail(emailData);
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(to: string, userName: string, message: string) {
  const emailData = emailTemplates.notification(userName, message);
  emailData.to = to;
  return sendEmail(emailData);
}

export default resend;