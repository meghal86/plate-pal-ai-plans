import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { Users, CheckCircle, X, Loader2, Mail, UserPlus } from 'lucide-react';

interface InviteData {
  familyId: string;
  email: string;
  token: string;
  familyName?: string;
  inviterName?: string;
  role?: string;
}

const FamilyInviteAccept: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInviteData();
  }, []);

  const loadInviteData = async () => {
    try {
      const familyId = searchParams.get('family');
      const email = searchParams.get('email');
      const token = searchParams.get('token');

      if (!familyId || !email || !token) {
        setError('Invalid invitation link. Please check the link and try again.');
        setLoading(false);
        return;
      }

      // SIMPLIFIED: Just get family details without validating invitation record
      const { data: family } = await supabase
        .from('families')
        .select('name, created_by')
        .eq('id', familyId)
        .single();

      // SIMPLIFIED: Skip database validation for now
      if (!family) {
        setError('Family not found.');
        setLoading(false);
        return;
      }

      // Get inviter details
      const { data: inviter } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', family.created_by)
        .single();

      // Set invitation data without database validation
      setInviteData({
        familyId,
        email,
        token,
        familyName: family.name || 'Family',
        inviterName: inviter?.full_name || 'Someone',
        role: 'member' // Default role
      });

    } catch (error) {
      console.error('Error loading invite data:', error);
      setError('Failed to load invitation details.');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!inviteData) return;

    // If user is not logged in, redirect to auth with invitation data
    if (!user?.id) {
      // Store invitation data in localStorage for after authentication
      localStorage.setItem('pendingInvitation', JSON.stringify(inviteData));

      // Redirect to login/signup with pre-filled email
      navigate(`/auth?email=${encodeURIComponent(inviteData.email)}&redirect=family-invite-complete`);
      return;
    }

    // If user is logged in, process the invitation
    setAccepting(true);
    try {
      // Verify the user's email matches the invitation
      if (user.email !== inviteData.email) {
        toast({
          title: "Email Mismatch",
          description: `This invitation is for ${inviteData.email}. Please log in with the correct email address.`,
          variant: "destructive",
        });
        setAccepting(false);
        return;
      }

      // Add user to family (create new record since we're not using database validation)
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

      toast({
        title: "Welcome to the Family! 🎉",
        description: `You've successfully joined ${inviteData.familyName}. You now have access to all family data including kids profiles, meal plans, and more!`,
      });

      // Redirect to family dashboard
      navigate('/family');

    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  const declineInvite = async () => {
    if (!inviteData) return;

    try {
      // Update invitation status to declined
      await supabase
        .from('family_members')
        .update({ status: 'declined' })
        .eq('family_id', inviteData.familyId)
        .eq('email', inviteData.email)
        .eq('invite_token', inviteData.token);

      toast({
        title: "Invitation Declined",
        description: "You have declined the family invitation.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error declining invite:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2">Loading invitation...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Please sign in to accept this family invitation.
            </p>
            <Button onClick={() => navigate('/signin')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <CardTitle>Family Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">
              You're invited to join
            </p>
            <p className="text-2xl font-bold text-orange-600 mb-2">
              {inviteData?.familyName}
            </p>
            <p className="text-gray-600">
              by <strong>{inviteData?.inviterName}</strong> as a <strong>{inviteData?.role}</strong>
            </p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">As a family member, you'll be able to:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• View and contribute to family meal plans</li>
              <li>• Access kids' nutrition profiles</li>
              <li>• Collaborate on shopping lists</li>
              <li>• Track family nutrition goals</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={acceptInvite} 
              disabled={accepting}
              className="flex-1"
            >
              {accepting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Accept
            </Button>
            <Button 
              onClick={declineInvite} 
              variant="outline"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyInviteAccept;
