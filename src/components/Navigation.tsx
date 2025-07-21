
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, FileText, BarChart3, Users, Settings, Upload, Activity, FileHeart, Trophy } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const location = useLocation();
  
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
    { id: "upload", label: "Upload & Setup", icon: Upload, path: "/upload" },
    { id: "plans", label: "Diet Plans", icon: FileText },
    { id: "tracking", label: "Tracking", icon: BarChart3 },
    { id: "health-metrics", label: "Health Metrics", icon: Activity },
    { id: "lab-reports", label: "Lab Reports", icon: FileHeart },
    { id: "rewards", label: "Rewards", icon: Trophy },
    { id: "community", label: "Community", icon: Users, path: "/community" },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleNavigation = (item: any) => {
    console.log('Navigation clicked:', item.id, 'has path:', item.path, 'current location:', location.pathname);
    if (item.path) {
      // For pages with routes, don't call onTabChange
      console.log('Using Link navigation for:', item.path);
      return;
    } else {
      // For tabs within the main page
      console.log('Using tab navigation for:', item.id);
      onTabChange(item.id);
    }
  };

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 mx-4 mb-4 bg-card/95 backdrop-blur-sm border-border/50 shadow-card md:relative md:mx-0 md:mb-0 md:w-64 md:h-screen md:rounded-none md:border-r md:border-b-0">
      <div className="flex justify-around p-4 md:flex-col md:justify-start md:space-y-2 md:h-full">
        <div className="hidden md:block mb-8 px-2">
          <h1 className="text-2xl font-bold bg-gradient-health bg-clip-text text-transparent">
            NourishPlate
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your nutrition companion
          </p>
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path 
            ? location.pathname === item.path 
            : activeTab === item.id;
          
          const ButtonComponent = item.path ? (
            <Link to={item.path} key={item.id}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`flex-col h-auto py-2 px-3 md:flex-row md:justify-start md:h-11 md:px-4 transition-all duration-300 w-full ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "hover:bg-secondary hover:text-secondary-foreground"
                }`}
              >
                <Icon className="h-5 w-5 md:mr-3" />
                <span className="text-xs mt-1 md:mt-0 md:text-sm">
                  {item.label}
                </span>
              </Button>
            </Link>
          ) : (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => handleNavigation(item)}
              className={`flex-col h-auto py-2 px-3 md:flex-row md:justify-start md:h-11 md:px-4 transition-all duration-300 ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-glow" 
                  : "hover:bg-secondary hover:text-secondary-foreground"
              }`}
            >
              <Icon className="h-5 w-5 md:mr-3" />
              <span className="text-xs mt-1 md:mt-0 md:text-sm">
                {item.label}
              </span>
            </Button>
          );
          
          return ButtonComponent;
        })}
      </div>
    </Card>
  );
};

export default Navigation;
