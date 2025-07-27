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
  Settings
} from "lucide-react";
import Header from "./Header";
import { useUser } from "@/contexts/UserContext";

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout = ({ children, showSidebar = true }: LayoutProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
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
  }, [location.pathname]);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'plans', label: 'Diet Plans', icon: Utensils, path: '/upload' },
    { id: 'tracking', label: 'Progress Tracking', icon: TrendingUp, path: '/tracking' },
    { id: 'health-metrics', label: 'Health Metrics', icon: Heart, path: '/health-metrics' },
    { id: 'lab-reports', label: 'Lab Reports', icon: FileText, path: '/lab-reports' },
    { id: 'rewards', label: 'Rewards', icon: Trophy, path: '/rewards' },
    { id: 'community', label: 'Community', icon: Users, path: '/community' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/profile' }
  ];

  return (
    <div className="dashboard-page min-h-screen bg-white">
      {/* Sidebar Navigation */}
      {showSidebar && (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-sm shadow-lg z-40 border-r border-white/30 lg:block hidden">
          <div className="p-6">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center mr-3">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">NourishPlate</h1>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      navigate(item.path);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-400'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Profile Section */}
            <div className="absolute bottom-6 left-6 right-6">
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
                    onClick={() => navigate("/profile")}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
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
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout; 