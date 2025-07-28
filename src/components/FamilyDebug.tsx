import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const FamilyDebug: React.FC = () => {
  const { user, profile } = useUser();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      user: null,
      profile: null,
      session: null,
      dbTests: {}
    };

    try {
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      info.session = {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: sessionError?.message
      };

      info.user = {
        exists: !!user,
        id: user?.id,
        email: user?.email
      };

      info.profile = {
        exists: !!profile,
        userId: profile?.user_id,
        familyId: profile?.family_id,
        fullName: profile?.full_name
      };

      // Test database access
      if (session?.user?.id) {
        // Test user_profiles access
        try {
          const { data: userProfileData, error: userProfileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          info.dbTests.userProfile = {
            success: !userProfileError,
            data: userProfileData,
            error: userProfileError?.message
          };
        } catch (error: any) {
          info.dbTests.userProfile = {
            success: false,
            error: error.message
          };
        }

        // Test families access
        try {
          const { data: familiesData, error: familiesError } = await supabase
            .from('families')
            .select('*')
            .limit(5);
          
          info.dbTests.families = {
            success: !familiesError,
            count: familiesData?.length || 0,
            data: familiesData,
            error: familiesError?.message
          };
        } catch (error: any) {
          info.dbTests.families = {
            success: false,
            error: error.message
          };
        }

        // Test family_members access
        try {
          const { data: membersData, error: membersError } = await supabase
            .from('family_members')
            .select('*')
            .eq('user_id', session.user.id);
          
          info.dbTests.familyMembers = {
            success: !membersError,
            count: membersData?.length || 0,
            data: membersData,
            error: membersError?.message
          };
        } catch (error: any) {
          info.dbTests.familyMembers = {
            success: false,
            error: error.message
          };
        }

        // Test kids_profiles access
        try {
          const { data: kidsData, error: kidsError } = await supabase
            .from('kids_profiles')
            .select('*')
            .limit(5);
          
          info.dbTests.kidsProfiles = {
            success: !kidsError,
            count: kidsData?.length || 0,
            data: kidsData,
            error: kidsError?.message
          };
        } catch (error: any) {
          info.dbTests.kidsProfiles = {
            success: false,
            error: error.message
          };
        }
      }

    } catch (error: any) {
      info.generalError = error.message;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [user, profile]);

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (success === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (success: boolean | undefined) => {
    if (success === true) return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    if (success === false) return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Unknown</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔍 Family System Debug Information</span>
          <Button onClick={runDiagnostics} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Running diagnostics...</p>
          </div>
        ) : (
          <>
            {/* Authentication Status */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🔐 Authentication Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Session</span>
                    {getStatusIcon(debugInfo.session?.exists)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {debugInfo.session?.exists ? `✅ ${debugInfo.session.email}` : '❌ No session'}
                  </p>
                  {debugInfo.session?.error && (
                    <p className="text-xs text-red-600 mt-1">{debugInfo.session.error}</p>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">User Context</span>
                    {getStatusIcon(debugInfo.user?.exists)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {debugInfo.user?.exists ? `✅ ${debugInfo.user.email}` : '❌ No user'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Profile</span>
                    {getStatusIcon(debugInfo.profile?.exists)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {debugInfo.profile?.exists ? `✅ ${debugInfo.profile.fullName}` : '❌ No profile'}
                  </p>
                  {debugInfo.profile?.familyId && (
                    <p className="text-xs text-gray-500 mt-1">Family ID: {debugInfo.profile.familyId.slice(0, 8)}...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Database Tests */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🗄️ Database Access Tests</h3>
              <div className="space-y-3">
                {Object.entries(debugInfo.dbTests || {}).map(([table, result]: [string, any]) => (
                  <div key={table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.success)}
                      <div>
                        <span className="font-medium capitalize">{table.replace(/([A-Z])/g, ' $1')}</span>
                        {result.count !== undefined && (
                          <span className="text-sm text-gray-500 ml-2">({result.count} records)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(result.success)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Details */}
            {Object.values(debugInfo.dbTests || {}).some((test: any) => test.error) && (
              <div>
                <h3 className="text-lg font-semibold mb-3">⚠️ Error Details</h3>
                <div className="space-y-2">
                  {Object.entries(debugInfo.dbTests || {}).map(([table, result]: [string, any]) => 
                    result.error ? (
                      <div key={table} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-800">{table}:</p>
                        <p className="text-sm text-red-600">{result.error}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Raw Data (for debugging) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                🔧 Show Raw Debug Data
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FamilyDebug;