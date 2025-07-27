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
import { useUser } from "@/contexts/UserContext";
import { useState, useRef, useEffect } from "react";

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
  const { profile, loading, refreshProfile } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user name from profile
  const userName = profile?.full_name || "User";
  
  // Debug logging
  console.log('🎯 Header render - loading:', loading, 'profile:', profile, 'userName:', userName);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Add small delay to allow button clicks to process first
        setTimeout(() => {
          setIsDropdownOpen(false);
        }, 10);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
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
        </div>

        {/* Right side - User info and actions */}
        {showUserInfo && (
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Logout Button - Icon Only */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {loading ? "Loading..." : userName}
                </p>
                <p className="text-xs text-gray-500">Premium Member</p>
              </div>
              
              {/* User Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={toggleDropdown}
                  className="h-8 w-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                >
                  <User className="h-4 w-4 text-white" />
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </button>
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDropdownOpen(false);
                          await handleSignOut();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 