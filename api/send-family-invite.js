// Vercel Edge Function for sending family invitation emails
// This handles CORS and calls Resend API securely from the server side

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { inviterName, inviterEmail, familyName, inviteEmail, role, inviteLink } = body;

    // Validate required fields
    if (!inviteEmail || !familyName || !inviteLink) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: inviteEmail, familyName, and inviteLink are required'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('📧 Sending email to:', inviteEmail);

    // Get API key
    const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_h3tvM9fC_C5JH12ELAP1mY5Y8P5tPqGic';
    console.log('🔑 API Key available:', RESEND_API_KEY ? 'Yes' : 'No');

    // Simple email payload
    const emailPayload = {
      from: 'onboarding@resend.dev',
      to: [inviteEmail],
      subject: `${inviterName || 'Someone'} invited you to join their family on NourishPlate`,
      html: `
        <h1>🍽️ NourishPlate Family Invitation</h1>
        <p><strong>${inviterName || 'Someone'}</strong> has invited you to join their family "${familyName}" on NourishPlate.</p>
        <p><a href="${inviteLink}" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>If the button doesn't work, copy this link: ${inviteLink}</p>
      `,
      text: `${inviterName || 'Someone'} invited you to join their family "${familyName}" on NourishPlate. Accept here: ${inviteLink}`
    };

    console.log('📤 Calling Resend API...');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    });

    const result = await response.json();
    console.log('📥 Resend response:', response.status, result);

    if (!response.ok) {
      console.error('❌ Resend error:', result);
      return new Response(JSON.stringify({
        success: false,
        error: `Resend API error: ${response.status} - ${JSON.stringify(result)}`
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('✅ Email sent successfully');
    return new Response(JSON.stringify({
      success: true,
      messageId: result.id,
      message: 'Email sent successfully',
      sentTo: inviteEmail
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Error: ${error.message}`
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }


}
