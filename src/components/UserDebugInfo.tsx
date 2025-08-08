import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UserDebugInfo: React.FC = () => {
  const { user, profile, loading } = useUser();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 bg-white/95 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">User Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Loading:</strong> {loading ? 'true' : 'false'}
        </div>
        <div>
          <strong>User ID:</strong> {user?.id || 'null'}
        </div>
        <div>
          <strong>User Email:</strong> {user?.email || 'null'}
        </div>
        <div>
          <strong>Profile Full Name:</strong> {profile?.full_name || 'null'}
        </div>
        <div>
          <strong>Profile User ID:</strong> {profile?.user_id || 'null'}
        </div>
        <div>
          <strong>User Metadata:</strong> {JSON.stringify(user?.user_metadata || {}, null, 2)}
        </div>
        <div>
          <strong>Profile Object:</strong> {profile ? 'exists' : 'null'}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserDebugInfo;