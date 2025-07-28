import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, LogOut } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const QuickAuth: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email for verification.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Success",
        description: "Signed out successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔐 Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Signed in as: {user.email}</p>
              <p className="text-sm text-gray-600">User ID: {user.id}</p>
            </div>
            <Button onClick={signOut} disabled={loading} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔐 Quick Authentication (For Testing)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={signIn} disabled={loading} className="flex-1">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
          <Button onClick={signUp} disabled={loading} variant="outline" className="flex-1">
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          This is a temporary authentication helper for testing. Use any email/password combination.
        </p>
      </CardContent>
    </Card>
  );
};

export default QuickAuth;