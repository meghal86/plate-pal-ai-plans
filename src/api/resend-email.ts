// Resend Email API Integration via Supabase Edge Functions
// Handles sending family invitation emails securely from the server side

export interface FamilyInviteEmailData {
  inviterName: string;
  inviterEmail: string;
  familyName: string;
  inviteEmail: string;
  role: string;
  inviteLink: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a family invitation email using a backend API
 * This avoids CORS issues by calling Resend API from the server side
 */
export async function sendFamilyInviteEmail(data: FamilyInviteEmailData): Promise<EmailResponse> {
  try {
    console.log('📧 Sending family invite email to:', data.inviteEmail);

    // TEMPORARY: For testing, only allow sending to verified email
    const testData = {
      ...data,
      inviteEmail: 'meghal86@gmail.com' // Force to verified email for testing
    };

    console.log('🧪 Using test email for Resend limitations:', testData.inviteEmail);

    // Use your production Vercel API endpoint for email sending (v2 working version)
    const API_ENDPOINT = 'https://nourishplate.vercel.app/api/send-family-invite-v2';

    console.log('📤 Calling email API');

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Email API error:', result);
      return {
        success: false,
        error: result.error || 'Failed to send email'
      };
    }

    if (!result.success) {
      console.error('❌ Email sending failed:', result);
      return {
        success: false,
        error: result.error || 'Failed to send email'
      };
    }

    console.log('✅ Email sent successfully:', result);
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Email templates are now handled in the Supabase Edge Function
// to avoid CORS issues and keep the API key secure
