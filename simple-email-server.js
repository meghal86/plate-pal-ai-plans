// Simple Express.js server to handle email sending
// This can be deployed to Vercel, Netlify, or any hosting service

const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://localhost:8081', 'https://your-domain.com'],
  credentials: true
}));

app.use(express.json());

const RESEND_API_KEY = 're_h3tvM9fC_C5JH12ELAP1mY5Y8P5tPqGic';

// Email sending endpoint
app.post('/api/send-family-invite', async (req, res) => {
  try {
    const { inviterName, inviterEmail, familyName, inviteEmail, role, inviteLink } = req.body;

    // Validate required fields
    if (!inviteEmail || !familyName || !inviteLink) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Generate email content
    const emailHtml = generateInviteEmailHTML({
      inviterName, inviterEmail, familyName, inviteEmail, role, inviteLink
    });
    
    const emailText = generateInviteEmailText({
      inviterName, inviterEmail, familyName, inviteEmail, role, inviteLink
    });

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NourishPlate <noreply@nourishplate.com>',
        to: [inviteEmail],
        subject: `${inviterName} invited you to join their family on NourishPlate`,
        html: emailHtml,
        text: emailText,
        reply_to: inviterEmail
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return res.status(400).json({
        success: false,
        error: result.message || 'Failed to send email'
      });
    }

    console.log('Email sent successfully:', result);
    res.json({
      success: true,
      messageId: result.id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

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

function generateInviteEmailText(data) {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
});

module.exports = app;
