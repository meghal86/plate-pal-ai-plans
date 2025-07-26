import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";
import EmailConfirmation from "@/components/EmailConfirmation";
import BrandIcons from "@/components/BrandIcons";

const SignIn = () => {
  console.log("SignIn component is loading"); // Debug log
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [emailConfirmationError, setEmailConfirmationError] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const navigate = useNavigate();

  // Get user's language preference for placeholders
  const isHindi = navigator.language?.startsWith('hi') || false;

  const placeholders = {
    email: isHindi ? "ईमेल दर्ज करें" : "Enter your email",
    password: isHindi ? "पासवर्ड दर्ज करें" : "Enter your password",
    forgotEmail: isHindi ? "अपना ईमेल दर्ज करें" : "Enter your email"
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user starts typing
    setEmailConfirmationError(false); // Clear email confirmation error
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!formData.email || !formData.password) {
      setError(isHindi ? "सभी फ़ील्ड भरें" : "Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError(isHindi ? "कृपया एक वैध ईमेल दर्ज करें" : "Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(isHindi ? "पासवर्ड कम से कम 6 अक्षर का होना चाहिए" : "Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: formData.email, 
        password: formData.password 
      });
      
      if (error) {
        // Provide more specific error messages
        if (error.message.includes("Invalid login credentials")) {
          setError(isHindi ? "अमान्य ईमेल या पासवर्ड" : "Invalid email or password");
        } else if (error.message.includes("Email not confirmed")) {
          setError(isHindi ? "कृपया अपना ईमेल जांचें और अपना खाता पुष्टि करें" : "Please check your email and confirm your account");
          setEmailConfirmationError(true);
        } else {
          setError(error.message);
        }
      } else {
        // Successful login
        navigate("/dashboard");
      }
    } catch (err) {
      setError(isHindi ? "लॉगिन में त्रुटि हुई" : "Error during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook" | "twitter" | "apple") => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(isHindi ? "सोशल लॉगिन में त्रुटि हुई" : "Error during social login");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError("");

    if (!forgotPasswordEmail) {
      setForgotPasswordError(isHindi ? "कृपया अपना ईमेल दर्ज करें" : "Please enter your email");
      setForgotPasswordLoading(false);
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      setForgotPasswordError(isHindi ? "कृपया एक वैध ईमेल दर्ज करें" : "Please enter a valid email address");
      setForgotPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/signin`
      });

      if (error) {
        setForgotPasswordError(error.message);
      } else {
        setForgotPasswordSuccess(true);
      }
    } catch (err) {
      setForgotPasswordError(isHindi ? "पासवर्ड रीसेट में त्रुटि हुई" : "Error during password reset");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 relative overflow-hidden">
        {/* Food-themed background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-orange-400 rounded-full blur-xl"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-green-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-yellow-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 right-1/3 w-12 h-12 bg-red-400 rounded-full blur-xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/30">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {isHindi ? "लॉग इन करें" : "Welcome Back"}
              </h1>
              <p className="text-gray-600 text-sm">
                {isHindi ? "अपने खाते में वापस आएं" : "Sign in to your account"}
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-medium shadow-sm"
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
              >
                <div className="flex items-center justify-center gap-3">
                  <BrandIcons provider="google" className="w-5 h-5" />
                  {isHindi ? "Google के साथ जारी रखें" : "Continue with Google"}
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-[#1877F2] hover:bg-[#166FE5] border-[#1877F2] text-white font-medium shadow-sm"
                onClick={() => handleSocialLogin("facebook")}
                disabled={loading}
              >
                <div className="flex items-center justify-center gap-3">
                  <BrandIcons provider="facebook" className="w-5 h-5" />
                  {isHindi ? "Facebook के साथ जारी रखें" : "Continue with Facebook"}
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-black hover:bg-gray-800 border-black text-white font-medium shadow-sm"
                onClick={() => handleSocialLogin("twitter")}
                disabled={loading}
              >
                <div className="flex items-center justify-center gap-3">
                  <BrandIcons provider="x" className="w-5 h-5" />
                  {isHindi ? "X के साथ जारी रखें" : "Continue with X"}
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-black hover:bg-gray-800 border-black text-white font-medium shadow-sm"
                onClick={() => handleSocialLogin("apple")}
                disabled={loading}
              >
                <div className="flex items-center justify-center gap-3">
                  <BrandIcons provider="apple" className="w-5 h-5" />
                  {isHindi ? "Apple के साथ जारी रखें" : "Continue with Apple"}
                </div>
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/90 text-gray-500">
                  {isHindi ? "या ईमेल के साथ" : "or with email"}
                </span>
              </div>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Mail size={16} />
                </div>
                <Input
                  type="email"
                  placeholder={placeholders.email}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-12 pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={placeholders.password}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="h-12 pl-10 pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-orange-600 hover:text-orange-700 underline"
                >
                  {isHindi ? "पासवर्ड भूल गए?" : "Forgot Password?"}
                </button>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                  {emailConfirmationError && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setShowEmailConfirmation(true)}
                        className="text-orange-600 hover:text-orange-700 underline text-sm"
                      >
                        {isHindi ? "पुष्टि ईमेल फिर से भेजें" : "Resend confirmation email"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isHindi ? "लॉगिन हो रहा है..." : "Signing in..."}
                  </div>
                ) : (
                  isHindi ? "लॉग इन करें" : "Sign In"
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <p className="text-gray-600 text-sm">
                {isHindi ? "खाता नहीं है?" : "Don't have an account?"}{" "}
                <Link
                  to="/signup"
                  className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  {isHindi ? "साइन अप करें" : "Sign Up"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Confirmation Modal */}
      {showEmailConfirmation && (
        <EmailConfirmation onClose={() => setShowEmailConfirmation(false)} />
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isHindi ? "पासवर्ड रीसेट" : "Reset Password"}
              </h2>
              <p className="text-gray-600 text-sm">
                {isHindi 
                  ? "अपना ईमेल दर्ज करें और हम आपको पासवर्ड रीसेट लिंक भेज देंगे" 
                  : "Enter your email and we'll send you a password reset link"
                }
              </p>
            </div>

            {forgotPasswordSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {isHindi ? "ईमेल भेज दिया गया!" : "Email Sent!"}
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  {isHindi 
                    ? "कृपया अपना ईमेल जांचें और पासवर्ड रीसेट लिंक पर क्लिक करें" 
                    : "Please check your email and click the password reset link"
                  }
                </p>
                <Button onClick={() => setShowForgotPassword(false)} className="w-full">
                  {isHindi ? "ठीक है" : "OK"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder={placeholders.forgotEmail}
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>

                {forgotPasswordError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{forgotPasswordError}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1"
                  >
                    {isHindi ? "रद्द करें" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={forgotPasswordLoading || !forgotPasswordEmail}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {forgotPasswordLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isHindi ? "भेज रहा है..." : "Sending..."}
                      </div>
                    ) : (
                      isHindi ? "रीसेट लिंक भेजें" : "Send Reset Link"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SignIn; 