// Vercel API Route for sending family invitation emails
// This handles CORS and calls Resend API securely from the server side

export const config = { runtime: 'edge' };

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
    const body = await request.json();
    const { inviterName, inviterEmail, familyName, inviteEmail, role, inviteLink } = body;

    // Validate required fields
    if (!inviteEmail || !familyName || !inviteLink) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: inviteEmail, familyName, and inviteLink are required'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email format'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('📧 Sending family invite email to:', inviteEmail);

    // Generate email content
    const emailHtml = generateInviteEmailHTML({
      inviterName: inviterName || 'Someone',
      inviterEmail: inviterEmail || '',
      familyName,
      inviteEmail,
      role: role || 'member',
      inviteLink
    });
    const emailText = generateInviteEmailText({
      inviterName: inviterName || 'Someone',
      inviterEmail: inviterEmail || '',
      familyName,
      inviteEmail,
      role: role || 'member',
      inviteLink
    });

    // Send email using Resend API
    const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_h3tvM9fC_C5JH12ELAP1mY5Y8P5tPqGic';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NourishPlate <noreply@nourishplate.com>',
        to: [inviteEmail],
        subject: `${inviterName || 'Someone'} invited you to join their family on NourishPlate`,
        html: emailHtml,
        text: emailText,
        reply_to: inviterEmail || 'noreply@nourishplate.com'
      })
    });
    const result = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: result.message || 'Failed to send email'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      success: true,
      messageId: result.id,
      message: 'Email sent successfully'
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

function generateInviteEmailHTML(data) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Family Invitation - NourishPlate</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🍽️ NourishPlate</h1>
        <h2>You're Invited to Join a Family!</h2>
    </div>
    
    <div class="content">
        <p>Hi there!</p>
        
        <p><strong>${data.inviterName}</strong> ${data.inviterEmail ? `(${data.inviterEmail})` : ''} has invited you to join their family <strong>"${data.familyName}"</strong> on NourishPlate as a <strong>${data.role}</strong>.</p>
        
        <div class="highlight">
            <h3>🏠 What is NourishPlate?</h3>
            <p>NourishPlate is a family nutrition management platform that helps families plan meals, track nutrition, and manage dietary preferences together.</p>
        </div>
        
        <p>As a family member, you'll be able to:</p>
        <ul>
            <li>📋 View and contribute to family meal plans</li>
            <li>👶 Access kids' nutrition profiles and preferences</li>
            <li>🛒 Collaborate on shopping lists</li>
            <li>📊 Track family nutrition goals</li>
            <li>🍳 Share cooking assignments</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="${data.inviteLink}" class="button">Accept Invitation</a>
        </div>
        
        <p><small>If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${data.inviteLink}">${data.inviteLink}</a></small></p>
        
        <p>If you have any questions, feel free to reply to this email${data.inviterName ? ` or contact ${data.inviterName} directly` : ''}.</p>
        
        <p>Welcome to the NourishPlate family!</p>
    </div>
    
    <div class="footer">
        <p>This invitation was sent by ${data.inviterName} through NourishPlate.<br>
        If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
</body>
</html>
  `.trim();
}

function generateInviteEmailText(data) {
  return `
🍽️ NourishPlate - Family Invitation

Hi there!

${data.inviterName} ${data.inviterEmail ? `(${data.inviterEmail})` : ''} has invited you to join their family "${data.familyName}" on NourishPlate as a ${data.role}.

What is NourishPlate?
NourishPlate is a family nutrition management platform that helps families plan meals, track nutrition, and manage dietary preferences together.

As a family member, you'll be able to:
• View and contribute to family meal plans
• Access kids' nutrition profiles and preferences  
• Collaborate on shopping lists
• Track family nutrition goals
• Share cooking assignments

To accept this invitation, click here: ${data.inviteLink}

If you have any questions, feel free to reply to this email${data.inviterName ? ` or contact ${data.inviterName} directly` : ''}.

Welcome to the NourishPlate family!

---
This invitation was sent by ${data.inviterName} through NourishPlate.
If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}
