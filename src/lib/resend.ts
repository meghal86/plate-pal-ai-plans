export const sendFamilyInvite = async (
  inviteEmail: string,
  inviterName: string,
  familyName: string,
  inviteLink: string
) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_h3tvM9fC_C5JH12ELAP1mY5Y8P5tPqGic',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [inviteEmail],
        subject: `${inviterName} invited you to join their family on NourishPlate`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f97316; margin: 0;">NourishPlate</h1>
              <p style="color: #666; margin: 5px 0;">Family Nutrition Platform</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">You're Invited to Join a Family!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                <strong>${inviterName}</strong> has invited you to join <strong>${familyName}</strong> on NourishPlate.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                By joining, you'll be able to:
              </p>
              <ul style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                <li>View and manage kids' profiles together</li>
                <li>Share meal plans and recipes</li>
                <li>Track family nutrition goals</li>
                <li>Collaborate on healthy eating habits</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background: linear-gradient(135deg, #f97316, #dc2626); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                If you can't click the button, copy and paste this link into your browser:<br>
                <a href="${inviteLink}" style="color: #f97316;">${inviteLink}</a>
              </p>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                This invitation was sent to ${inviteEmail}. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Response details:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};