import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, FileText, BarChart3, Users, Settings } from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "plans", label: "Diet Plans", icon: FileText },
    { id: "tracking", label: "Tracking", icon: BarChart3 },
    { id: "community", label: "Community", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

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
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(item.id)}
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
        })}
      </div>
    </Card>
  );
};

export default Navigation;