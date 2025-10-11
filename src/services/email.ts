/**
 * Email service for sending notifications
 * Supports multiple email providers: Resend, SendGrid, Console (for development)
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type EmailProvider = 'resend' | 'sendgrid' | 'console';

export class EmailService {
  private provider: EmailProvider;
  private resendApiKey?: string;
  private sendGridApiKey?: string;
  private fromEmail: string;

  constructor() {
    // Determine email provider from environment variables
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.sendGridApiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@brainforest.dev';

    // Select provider based on available API keys
    if (this.resendApiKey) {
      this.provider = 'resend';
      console.log('✅ Email service initialized with Resend');
    } else if (this.sendGridApiKey) {
      this.provider = 'sendgrid';
      console.log('✅ Email service initialized with SendGrid');
    } else {
      this.provider = 'console';
      console.warn('⚠️  No email API key found. Emails will be logged to console only.');
      console.warn('   Set RESEND_API_KEY or SENDGRID_API_KEY environment variable to enable email sending.');
    }
  }

  /**
   * Send an email using the configured provider
   * @param options Email options
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    switch (this.provider) {
      case 'resend':
        await this.sendWithResend(options);
        break;
      case 'sendgrid':
        await this.sendWithSendGrid(options);
        break;
      case 'console':
      default:
        this.logToConsole(options);
        break;
    }
  }

  /**
   * Send email using Resend
   */
  private async sendWithResend(options: EmailOptions): Promise<void> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      console.log('✅ Email sent successfully via Resend to:', options.to);
    } catch (error) {
      console.error('❌ Failed to send email via Resend:', error);
      // Fallback to console logging if sending fails
      this.logToConsole(options);
      throw error;
    }
  }

  /**
   * Send email using SendGrid
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<void> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }],
          }],
          from: { email: this.fromEmail },
          subject: options.subject,
          content: [
            { type: 'text/html', value: options.html },
            ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid API error: ${error}`);
      }

      console.log('✅ Email sent successfully via SendGrid to:', options.to);
    } catch (error) {
      console.error('❌ Failed to send email via SendGrid:', error);
      // Fallback to console logging if sending fails
      this.logToConsole(options);
      throw error;
    }
  }

  /**
   * Log email to console (development/fallback)
   */
  private logToConsole(options: EmailOptions): void {
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL (Console Mode - Not Actually Sent)');
    console.log('='.repeat(80));
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('-'.repeat(80));
    console.log('HTML Body:');
    console.log(options.html);
    if (options.text) {
      console.log('-'.repeat(80));
      console.log('Text Body:');
      console.log(options.text);
    }
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Send account deletion confirmation email
   * @param email User email
   * @param pseudo User pseudo/name
   */
  async sendAccountDeletionEmail(email: string, pseudo: string | null): Promise<void> {
    const name = pseudo || 'User';
    
    await this.sendEmail({
      to: email,
      subject: 'BrainForest Account Deleted',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Deletion Confirmation</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>This email confirms that your BrainForest account has been permanently deleted as requested.</p>
              <p>All your personal data, learning progress, courses, and account information have been removed from our systems.</p>
              <p><strong>What's been deleted:</strong></p>
              <ul>
                <li>Profile information (email, username, bio)</li>
                <li>Learning progress and course completions</li>
                <li>Module subscriptions and course likes</li>
                <li>Comments and contributions</li>
                <li>Authentication tokens and sessions</li>
              </ul>
              <p>We're sorry to see you go! If you'd like to rejoin BrainForest in the future, you're always welcome to create a new account.</p>
              <p>If you have any questions or concerns, please don't hesitate to reach out to our community team on Discord.</p>
              <a href="https://discord.gg/W2jeRP6m" class="button">Join Our Discord</a>
            </div>
            <div class="footer">
              <p>BrainForest - Open Source, Community-Driven Learning</p>
              <p><a href="https://github.com/Youpi-Corp">View on GitHub</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${name},

This email confirms that your BrainForest account has been permanently deleted as requested.

All your personal data, learning progress, courses, and account information have been removed from our systems.

What's been deleted:
- Profile information (email, username, bio)
- Learning progress and course completions
- Module subscriptions and course likes
- Comments and contributions
- Authentication tokens and sessions

We're sorry to see you go! If you'd like to rejoin BrainForest in the future, you're always welcome to create a new account.

If you have any questions or concerns, please reach out to our community team on Discord: https://discord.gg/W2jeRP6m

BrainForest - Open Source, Community-Driven Learning
GitHub: https://github.com/Youpi-Corp
      `.trim(),
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();
