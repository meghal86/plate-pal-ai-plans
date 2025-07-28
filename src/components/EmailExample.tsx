import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { sendEmail, sendWelcomeEmail, sendNotificationEmail } from '../lib/resend';
import { toast } from 'sonner';

export function EmailExample() {
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendWelcomeEmail = async () => {
    if (!email || !userName) {
      toast.error('Please fill in email and user name');
      return;
    }

    setIsLoading(true);
    try {
      await sendWelcomeEmail(email, userName);
      toast.success('Welcome email sent successfully!');
      setEmail('');
      setUserName('');
    } catch (error) {
      console.error('Error sending welcome email:', error);
      toast.error('Failed to send welcome email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotificationEmail = async () => {
    if (!email || !userName || !customMessage) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await sendNotificationEmail(email, userName, customMessage);
      toast.success('Notification email sent successfully!');
      setCustomMessage('');
    } catch (error) {
      console.error('Error sending notification email:', error);
      toast.error('Failed to send notification email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCustomEmail = async () => {
    if (!email || !customSubject || !customMessage) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await sendEmail({
        to: email,
        subject: customSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Custom Email</h1>
            <p>${customMessage.replace(/\n/g, '<br>')}</p>
            <p>Best regards,<br>The NourishPlate Team</p>
          </div>
        `,
        text: `${customMessage}\n\nBest regards,\nThe NourishPlate Team`,
      });
      toast.success('Custom email sent successfully!');
      setCustomSubject('');
      setCustomMessage('');
    } catch (error) {
      console.error('Error sending custom email:', error);
      toast.error('Failed to send custom email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resend Email Testing</CardTitle>
          <CardDescription>
            Test the Resend email functionality with different email templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">User Name</Label>
              <Input
                id="userName"
                placeholder="John Doe"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSendWelcomeEmail} 
              disabled={isLoading}
              variant="outline"
            >
              Send Welcome Email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Notification Email</CardTitle>
          <CardDescription>
            Send a notification email with a custom message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notificationMessage">Notification Message</Label>
            <Textarea
              id="notificationMessage"
              placeholder="Your custom notification message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>
          <Button 
            onClick={handleSendNotificationEmail} 
            disabled={isLoading}
            variant="outline"
          >
            Send Notification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Custom Email</CardTitle>
          <CardDescription>
            Send a completely custom email with your own subject and content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customSubject">Subject</Label>
            <Input
              id="customSubject"
              placeholder="Your email subject..."
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customMessage">Message</Label>
            <Textarea
              id="customMessage"
              placeholder="Your custom email message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>
          <Button 
            onClick={handleSendCustomEmail} 
            disabled={isLoading}
            variant="outline"
          >
            Send Custom Email
          </Button>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p><strong>Note:</strong> Make sure you have:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Verified your sender domain with Resend</li>
          <li>Updated the DEFAULT_FROM email in src/lib/resend.ts</li>
          <li>Set up your Resend API key in the environment variables</li>
        </ul>
      </div>
    </div>
  );
}