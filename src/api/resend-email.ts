// Resend Email API Integration via Supabase Edge Functions
// Handles sending family invitation emails securely from the server side

import { supabase } from '@/integrations/supabase/client';

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
 * Send a family invitation email using Supabase Edge Function
 * This avoids CORS issues by calling Resend API from the server side
 */
export async function sendFamilyInviteEmail(data: FamilyInviteEmailData): Promise<EmailResponse> {
  try {
    console.log('📧 Sending family invite email to:', data.inviteEmail);

    // Use Supabase edge function for email sending
    const { data: result, error } = await supabase.functions.invoke('send-family-invite', {
      body: data
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }

    if (!result?.success) {
      console.error('❌ Email sending failed:', result);
      return {
        success: false,
        error: result?.error || 'Failed to send email'
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
