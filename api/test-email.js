// Simple test endpoint to verify email sending works
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
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
    console.log('🧪 Test email endpoint called');
    
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email is required'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('📧 Sending test email to:', email);

    // Get API key
    const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_h3tvM9fC_C5JH12ELAP1mY5Y8P5tPqGic';
    console.log('🔑 API Key length:', RESEND_API_KEY?.length);

    // Simple email payload
    const emailPayload = {
      from: 'onboarding@resend.dev',
      to: [email],
      subject: 'Test Email from NourishPlate',
      html: '<h1>Test Email</h1><p>This is a test email from NourishPlate API.</p>',
      text: 'Test Email - This is a test email from NourishPlate API.'
    };

    console.log('📤 Sending to Resend API...');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    });

    console.log('📥 Resend response status:', response.status);
    const result = await response.json();
    console.log('📥 Resend response:', result);

    if (!response.ok) {
      console.error('❌ Resend error:', result);
      return new Response(JSON.stringify({
        success: false,
        error: `Resend error: ${response.status} - ${JSON.stringify(result)}`
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('✅ Email sent successfully');
    return new Response(JSON.stringify({
      success: true,
      messageId: result.id,
      message: 'Test email sent successfully'
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ Catch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Exception: ${error.message}`
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
