import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { Users, CheckCircle, Loader2 } from 'lucide-react';

interface InviteData {
  familyId: string;
  email: string;
  token: string;
  familyName?: string;
  inviterName?: string;
  role?: string;
}

const FamilyInviteComplete: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  useEffect(() => {
    completeInvitation();
  }, [user]);

  const completeInvitation = async () => {
    try {
      // Get pending invitation from localStorage
      const pendingInvitation = localStorage.getItem('pendingInvitation');
      if (!pendingInvitation) {
        toast({
          title: "No Pending Invitation",
          description: "No invitation found to complete.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      const inviteData: InviteData = JSON.parse(pendingInvitation);
      setInviteData(inviteData);

      if (!user?.id) {
        // User not logged in yet, wait for authentication
        return;
      }

      // Verify the user's email matches the invitation
      if (user.email !== inviteData.email) {
        toast({
          title: "Email Mismatch",
          description: `This invitation is for ${inviteData.email}. Please log in with the correct email address.`,
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Add user to family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: inviteData.familyId,
          user_id: user.id,
          role: inviteData.role || 'member',
          status: 'accepted',
          invited_by: null,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString()
        });

      if (memberError) {
        console.error('Error adding family member:', memberError);
        // Continue anyway - the important part is updating the user profile
      }

      // Update user profile with family_id
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ family_id: inviteData.familyId })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Clear the pending invitation
      localStorage.removeItem('pendingInvitation');

      setSuccess(true);
      
      toast({
        title: "Welcome to the Family! 🎉",
        description: `You've successfully joined ${inviteData.familyName}. You now have access to all family data!`,
      });

    } catch (error) {
      console.error('Error completing invitation:', error);
      toast({
        title: "Error",
        description: "Failed to complete invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const goToFamily = () => {
    navigate('/family');
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
              <h2 className="text-xl font-semibold">Completing Your Invitation...</h2>
              <p className="text-gray-600">Please wait while we set up your family access.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to {inviteData.familyName}! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                You've successfully joined the family! You now have access to:
              </p>
              <ul className="text-left space-y-2 mt-4">
                <li className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span>Family member profiles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span>Kids' nutrition profiles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span>Shared meal plans</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span>Family dietary preferences</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span>Shopping lists and more!</span>
                </li>
              </ul>
            </div>
            
            <Button 
              onClick={goToFamily}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Go to Family Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-gray-600">Unable to complete the invitation process.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyInviteComplete;
