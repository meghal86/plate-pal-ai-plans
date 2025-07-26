import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import BrandIcons from "@/components/BrandIcons";

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Get user's language preference for placeholders
  const isHindi = navigator.language?.startsWith('hi') || false;

  const placeholders = {
    email: isHindi ? "ईमेल दर्ज करें" : "Enter your email",
    password: isHindi ? "पासवर्ड दर्ज करें" : "Enter your password",
    confirmPassword: isHindi ? "पासवर्ड की पुष्टि करें" : "Confirm your password"
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user starts typing
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
    // Allow common special characters including #, -, _, etc.
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError(isHindi ? "सभी फ़ील्ड भरें" : "Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError(isHindi ? "कृपया एक वैध ईमेल दर्ज करें" : "Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError(isHindi 
        ? "पासवर्ड में कम से कम 6 अक्षर, 1 बड़ा अक्षर, 1 छोटा अक्षर और 1 संख्या होनी चाहिए" 
        : "Password must be at least 6 characters with 1 uppercase, 1 lowercase, and 1 number"
      );
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(isHindi ? "पासवर्ड मेल नहीं खाते" : "Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/signin`
        }
      });

      if (error) {
        setError(error.message);
      } else {
        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
          setError(
            isHindi 
              ? "सफलतापूर्वक साइन अप! कृपया अपना ईमेल जांचें और अपना खाता पुष्टि करें।" 
              : "Successfully signed up! Please check your email and confirm your account."
          );
          // Don't navigate to profile yet - user needs to confirm email first
        } else {
          // Email confirmation not required or already confirmed
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(isHindi ? "साइन अप में त्रुटि हुई" : "Error during sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook" | "twitter" | "apple") => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError(isHindi ? "सोशल लॉगिन में त्रुटि हुई" : "Error during social login");
      setLoading(false);
    }
  };

  return (
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
              {isHindi ? "खाता बनाएं" : "Create Account"}
            </h1>
            <p className="text-gray-600 text-sm">
              {isHindi ? "अपना स्वस्थ जीवन शुरू करें" : "Start your healthy journey"}
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

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
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

            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={16} />
              </div>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={placeholders.confirmPassword}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="h-12 pl-10 pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">
                {isHindi ? "पासवर्ड आवश्यकताएं:" : "Password requirements:"}
              </p>
              <ul className="space-y-1">
                <li className={`flex items-center gap-1 ${formData.password.length >= 6 ? 'text-green-600' : ''}`}>
                  <span>•</span>
                  {isHindi ? "कम से कम 6 अक्षर" : "At least 6 characters"}
                </li>
                <li className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                  <span>•</span>
                  {isHindi ? "1 बड़ा अक्षर" : "1 uppercase letter"}
                </li>
                <li className={`flex items-center gap-1 ${/[a-z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                  <span>•</span>
                  {isHindi ? "1 छोटा अक्षर" : "1 lowercase letter"}
                </li>
                <li className={`flex items-center gap-1 ${/\d/.test(formData.password) ? 'text-green-600' : ''}`}>
                  <span>•</span>
                  {isHindi ? "1 संख्या" : "1 number"}
                </li>
              </ul>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
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
                  {isHindi ? "बन रहा है..." : "Creating..."}
                </div>
              ) : (
                isHindi ? "खाता बनाएं" : "Create Account"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              {isHindi ? "पहले से खाता है?" : "Already have an account?"}{" "}
              <Link
                to="/signin"
                className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                {isHindi ? "लॉग इन करें" : "Log In"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 