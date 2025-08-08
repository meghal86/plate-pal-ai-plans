import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Utensils, 
  TrendingUp, 
  Users, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const primaryNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'plans', label: 'Plans', icon: Utensils, path: '/upload' },
  { id: 'tracking', label: 'Track', icon: TrendingUp, path: '/tracking' },
  { id: 'community', label: 'Community', icon: Users, path: '/community' },
  { id: 'settings', label: 'Profile', icon: Settings, path: '/profile' }
];

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (item: NavItem) => {
    navigate(item.path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-area-padding">
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center px-2 py-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 min-w-[60px] rounded-lg transition-all duration-200 touch-target tap-highlight',
                  active 
                    ? 'text-orange-600 bg-orange-50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                )}
                aria-label={item.label}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  active && 'scale-110'
                )} />
                <span className={cn(
                  'text-xs font-medium',
                  active && 'font-semibold'
                )}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;