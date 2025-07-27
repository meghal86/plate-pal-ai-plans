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
  const { user, profile, loading, refreshProfile } = useUser();
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

  // Force refresh profile if username is still "User" after loading
  useEffect(() => {
    if (!loading && profile && profile.full_name === "User") {
      console.log('🔄 Username is still "User", attempting to refresh profile');
      refreshProfile();
    }
  }, [loading, profile, refreshProfile]);

  // Additional fallback: if profile is null but user exists, try to refresh
  useEffect(() => {
    if (!loading && !profile && user) {
      console.log('🔄 Profile is null but user exists, attempting to refresh profile');
      refreshProfile();
    }
  }, [loading, profile, user, refreshProfile]);

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
    <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-white/30">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Left side - Back button and title */}
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(backTo)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm h-8 px-3"
              >
                <Home className="h-3.5 w-3.5 mr-1" />
                Back to Dashboard
              </Button>
            )}
          </div>

          {/* Right side - User info and actions */}
          {showUserInfo && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative p-1.5 h-8 w-8">
                <Bell className="h-4 w-4 text-gray-600" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* Logout Button - Icon Only */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors p-1.5 h-8 w-8"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-300 mx-1"></div>

              {/* User Menu - At the very end */}
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">
                    {loading ? "Loading..." : (userName === "User" && user?.email ? user.email.split('@')[0] : userName)}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">Premium Member</p>
                </div>
                
                {/* User Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={toggleDropdown}
                    className="h-6 w-6 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <User className="h-3 w-3 text-white" />
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
      </div>
    </header>
  );
};

export default Header; 