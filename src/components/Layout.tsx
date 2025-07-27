import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Utensils, 
  TrendingUp, 
  Heart, 
  FileText, 
  Trophy, 
  Users, 
  Menu,
  Settings,
  Baby,
  X
} from "lucide-react";
import Header from "./Header";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout = ({ children, showSidebar = true }: LayoutProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading } = useUser();

  // Get user profile from context
  const userProfile = profile ? {
    full_name: profile.full_name || "User",
    member_type: "Premium Member"
  } : null;

  // Update active tab based on current location
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') setActiveTab('dashboard');
    else if (path === '/upload') setActiveTab('plans');
    else if (path === '/profile') setActiveTab('settings');
    else if (path === '/family') setActiveTab('community');
    else if (path === '/community') setActiveTab('community');
    else if (path === '/tracking') setActiveTab('tracking');
    else if (path === '/health-metrics') setActiveTab('health-metrics');
    else if (path === '/lab-reports') setActiveTab('lab-reports');
    else if (path === '/rewards') setActiveTab('rewards');
    else if (path === '/kids') setActiveTab('kids');
  }, [location.pathname]);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'plans', label: 'Diet Plans', icon: Utensils, path: '/upload' },
    { id: 'kids', label: 'Kids Zone', icon: Baby, path: '/kids' },
    { id: 'tracking', label: 'Progress Tracking', icon: TrendingUp, path: '/tracking' },
    { id: 'health-metrics', label: 'Health Metrics', icon: Heart, path: '/health-metrics' },
    { id: 'lab-reports', label: 'Lab Reports', icon: FileText, path: '/lab-reports' },
    { id: 'rewards', label: 'Rewards', icon: Trophy, path: '/rewards' },
    { id: 'community', label: 'Community', icon: Users, path: '/community' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/profile' }
  ];

  const handleNavigation = (item: any) => {
    setActiveTab(item.id);
    navigate(item.path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const NavigationMenu = () => (
    <nav className="space-y-2 scroll-smooth min-h-0">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
              isActive
                ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-400'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const UserProfileSection = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-800">
            {loading ? "Loading..." : userProfile?.full_name || "User"}
          </p>
          <p className="text-sm text-gray-500">
            {loading ? "..." : userProfile?.member_type || "Member"}
          </p>
        </div>
        <button
          onClick={() => handleNavigation({ id: 'settings', path: '/profile' })}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page min-h-screen bg-white">
      {/* Desktop Sidebar Navigation */}
      {showSidebar && (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-sm shadow-lg z-40 border-r border-white/30 lg:block hidden overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="p-6 min-h-full flex flex-col">
            {/* Logo */}
            <div className="flex items-center mb-8 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center mr-3">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">NourishPlate</h1>
            </div>

            {/* Navigation Menu - Scrollable */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <NavigationMenu />
            </div>

            {/* User Profile Section */}
            <div className="mt-6 flex-shrink-0">
              <UserProfileSection />
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Navigation */}
      {showSidebar && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-white/95 backdrop-blur-sm border-white/30 shadow-lg hover:bg-white/100 transition-all duration-200 ${
                  isMobileMenuOpen ? 'bg-orange-50 border-orange-200' : ''
                }`}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5 text-gray-700" />
                {activeTab !== 'dashboard' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-white/95 backdrop-blur-sm">
              <div className="p-6 h-full flex flex-col">
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-8 flex-shrink-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center mr-3">
                      <Utensils className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">NourishPlate</h1>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close navigation menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Mobile Navigation Menu - Scrollable */}
                <div className="flex-1 overflow-y-auto -mx-6 px-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  <NavigationMenu />
                </div>

                {/* Mobile User Profile Section */}
                <div className="mt-6 flex-shrink-0">
                  <UserProfileSection />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`${showSidebar ? 'lg:ml-64' : ''} min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 relative overflow-hidden`}>
        {/* Header */}
        <Header title="NourishPlate" showUserInfo={true} />
        
        {/* Ensure content doesn't get hidden behind sidebar */}
        <div className="relative w-full h-full">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 bg-orange-400 rounded-full blur-xl"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-green-400 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-yellow-400 rounded-full blur-xl"></div>
            <div className="absolute bottom-32 right-1/3 w-12 h-12 bg-red-400 rounded-full blur-xl"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 lg:pt-0 pt-16">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout; 