// Supabase Edge Function to send family invitation emails
// This runs on the server side to avoid CORS issues

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FamilyInviteRequest {
  inviterName: string;
  inviterEmail: string;
  familyName: string;
  inviteEmail: string;
  role: string;
  inviteLink: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client to verify the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse the request body
    const requestData: FamilyInviteRequest = await req.json()
    
    // Validate required fields
    if (!requestData.inviteEmail || !requestData.familyName || !requestData.inviteLink) {
      throw new Error('Missing required fields')
    }

    // Send email using Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Resend API key not configured')
    }

    const emailHtml = generateInviteEmailHTML(requestData)
    const emailText = generateInviteEmailText(requestData)

    const emailPayload = {
      from: 'NourishPlate <noreply@nourishplate.com>',
      to: [requestData.inviteEmail],
      subject: `${requestData.inviterName} invited you to join their family on NourishPlate`,
      html: emailHtml,
      text: emailText,
      reply_to: requestData.inviterEmail
    }

    console.log('Sending email to:', requestData.inviteEmail)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', result)
      throw new Error(result.message || 'Failed to send email')
    }

    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: 'Email sent successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

function generateInviteEmailHTML(data: FamilyInviteRequest): string {
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
        
        <p><strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you to join their family <strong>"${data.familyName}"</strong> on NourishPlate as a <strong>${data.role}</strong>.</p>
        
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
        
        <p>If you have any questions, feel free to reply to this email or contact ${data.inviterName} directly.</p>
        
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

function generateInviteEmailText(data: FamilyInviteRequest): string {
  return `
🍽️ NourishPlate - Family Invitation

Hi there!

${data.inviterName} (${data.inviterEmail}) has invited you to join their family "${data.familyName}" on NourishPlate as a ${data.role}.

What is NourishPlate?
NourishPlate is a family nutrition management platform that helps families plan meals, track nutrition, and manage dietary preferences together.

As a family member, you'll be able to:
• View and contribute to family meal plans
• Access kids' nutrition profiles and preferences  
• Collaborate on shopping lists
• Track family nutrition goals
• Share cooking assignments

To accept this invitation, click here: ${data.inviteLink}

If you have any questions, feel free to reply to this email or contact ${data.inviterName} directly.

Welcome to the NourishPlate family!

---
This invitation was sent by ${data.inviterName} through NourishPlate.
If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}
