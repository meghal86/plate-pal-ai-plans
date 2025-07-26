import { useState } from "react";
import { resendEmailConfirmation } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

interface EmailConfirmationProps {
  onClose: () => void;
}

const EmailConfirmation = ({ onClose }: EmailConfirmationProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Get user's language preference
  const isHindi = navigator.language?.startsWith('hi') || false;

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const { error } = await resendEmailConfirmation(email);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(isHindi ? "ईमेल भेजने में त्रुटि हुई" : "Error sending email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isHindi ? "ईमेल पुष्टि" : "Email Confirmation"}
          </h2>
          <p className="text-gray-600 text-sm">
            {isHindi 
              ? "अपना ईमेल दर्ज करें और हम आपको पुष्टि ईमेल फिर से भेज देंगे" 
              : "Enter your email and we'll resend the confirmation email"
            }
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isHindi ? "ईमेल भेज दिया गया!" : "Email Sent!"}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {isHindi 
                ? "कृपया अपना ईमेल जांचें और लिंक पर क्लिक करें" 
                : "Please check your email and click the confirmation link"
              }
            </p>
            <Button onClick={onClose} className="w-full">
              {isHindi ? "ठीक है" : "OK"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResendEmail} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder={isHindi ? "आपका ईमेल" : "Your email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                {isHindi ? "रद्द करें" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={loading || !email}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isHindi ? "भेज रहा है..." : "Sending..."}
                  </div>
                ) : (
                  isHindi ? "ईमेल भेजें" : "Send Email"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation; 