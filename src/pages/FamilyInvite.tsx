import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, CheckCircle, X, Loader2 } from 'lucide-react';

const FamilyInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<{
    familyId: string;
    email: string;
    familyName?: string;
    inviterName?: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      try {
        const decoded = atob(token);
        const [familyId, email] = decoded.split(':');
        
        if (familyId && email) {
          loadInviteData(familyId, email);
        } else {
          throw new Error('Invalid token format');
        }
      } catch (error) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or expired.",
          variant: "destructive"
        });
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, toast]);

  const loadInviteData = async (familyId: string, email: string) => {
    try {
      const { data: family } = await supabase
        .from('families')
        .select('name, created_by')
        .eq('id', familyId)
        .single();

      const { data: inviter } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', family?.created_by)
        .single();

      setInviteData({
        familyId,
        email,
        familyName: family?.name || 'Family',
        inviterName: inviter?.full_name || 'Someone'
      });
    } catch (error) {
      console.error('Error loading invite data:', error);
      toast({
        title: "Error",
        description: "Failed to load invitation details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!inviteData) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to accept this invitation.",
          variant: "destructive"
        });
        navigate('/signin');
        return;
      }

      const { error: updateError } = await supabase
        .from('family_members')
        .update({
          user_id: user.id,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('family_id', inviteData.familyId)
        .eq('email', inviteData.email)
        .eq('status', 'pending');

      if (updateError) throw updateError;

      await supabase
        .from('user_profiles')
        .update({ family_id: inviteData.familyId })
        .eq('user_id', user.id);

      toast({
        title: "Welcome to the Family!",
        description: `You've successfully joined ${inviteData.familyName}.`,
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-gray-600">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Family Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">{inviteData?.inviterName}</span> has invited you to join
            </p>
            <p className="text-xl font-bold text-gray-900 mb-4">
              {inviteData?.familyName}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What you'll get access to:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• View and manage kids' profiles</li>
              <li>• Share meal plans and recipes</li>
              <li>• Track family nutrition goals</li>
              <li>• Collaborate on healthy eating</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              disabled={processing}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button 
              onClick={acceptInvite}
              disabled={processing}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Accept & Join
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyInvitePage;