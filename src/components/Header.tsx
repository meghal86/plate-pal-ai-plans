import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Menu,
  Home
} from "lucide-react";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
  showUserInfo?: boolean;
}

const Header = ({ 
  title = "NourishPlate", 
  showBackButton = false, 
  backTo = "/dashboard",
  showUserInfo = true 
}: HeaderProps) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile
  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error('Header: Error fetching profile:', error);
        } else if (profile) {
          setUserProfile({
            full_name: profile.full_name || session.user.email?.split('@')[0] || "User"
          });
        } else {
          setUserProfile({
            full_name: session.user.email?.split('@')[0] || "User"
          });
        }
      }
    } catch (error) {
      console.error('Header: Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        navigate('/signin');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-white/30 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Back button and title */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(backTo)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </div>

        {/* Right side - User actions */}
        {showUserInfo && (
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* User Profile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium">
                {loading ? "Loading..." : userProfile?.full_name || "User"}
              </span>
            </Button>

            {/* Sign Out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-10 h-10 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 