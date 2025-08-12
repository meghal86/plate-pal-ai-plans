import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const OAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the current session to check if OAuth was successful
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('OAuth callback session error:', sessionError);
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('OAuth callback successful:', session.user);
          setSuccess(true);
          setLoading(false);
          
          // Redirect to dashboard after a brief success message
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Check for error parameters in URL
          const errorParam = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          
          if (errorParam) {
            console.error('OAuth callback URL error:', errorParam, errorDescription);
            setError(errorDescription || errorParam);
          } else {
            setError('OAuth authentication failed. Please try again.');
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('OAuth callback unexpected error:', err);
        setError('Unexpected error during authentication. Please try again.');
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/30 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Completing Sign In...
          </h2>
          <p className="text-gray-600">
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/30 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Sign In Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Welcome! Redirecting you to your dashboard...
          </p>
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/30 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/signin')}
              className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;